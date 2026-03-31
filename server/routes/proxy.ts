import { Router, Request, Response } from 'express';
import { saveRequest, getSetting, updateRequest } from '../services/storage.js';
import { processStream } from '../services/stream.js';
import crypto from 'node:crypto';
import { RequestMode } from '../../shared/types.js';

const router: Router = Router();

// Helper to hash context for cache hit detection
function hashContext(messages: any[]): string {
  const content = JSON.stringify(messages);
  return crypto.createHash('sha256').update(content).digest('hex');
}

router.post('/chat/completions', async (req: Request, res: Response) => {
  const configuredUrl = getSetting('TARGET_URL') || process.env.TARGET_URL;
  const targetUrl = configuredUrl?.endsWith('/chat/completions')
    ? configuredUrl
    : `${configuredUrl}/chat/completions`;
  const targetApiKey = getSetting('TARGET_API_KEY') || process.env.TARGET_API_KEY;

  if (!targetUrl) {
    res.status(500).json({ error: 'Target URL is not configured.' });
    return;
  }

  const requestBody = { ...req.body };
  if (requestBody.stream === true && !requestBody.stream_options) {
    requestBody.stream_options = { include_usage: true };
  }
  const isStream = requestBody.stream === true;
  const contextHash = requestBody.messages ? hashContext(requestBody.messages) : undefined;

  // Determine mode from custom header, defaulting to 'observe'
  const modeHeader = req.headers['x-promptglass-mode'] as string;
  const mode: RequestMode = (modeHeader === 'chat' || modeHeader === 'benchmark') ? modeHeader : 'observe';

  // Headers for the target LLM
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (targetApiKey) {
    headers['Authorization'] = `Bearer ${targetApiKey}`;
  }

  // Pass through Authorization if provided and target key isn't set
  if (req.headers.authorization && !targetApiKey) {
    headers['Authorization'] = req.headers.authorization;
  }

  const requestStartTime = performance.now();

  // Save request immediately as "pending"
  const requestId = saveRequest(mode, requestBody, undefined, undefined, contextHash);

  try {
    const targetResponse = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!targetResponse.ok) {
      // If error, proxy it back but don't record metrics
      const errorText = await targetResponse.text();
      res.status(targetResponse.status).send(errorText);
      return;
    }

    if (isStream && targetResponse.body) {
      // Set required headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let lastDbUpdate = 0;
      const { clientStream, metricsPromise } = processStream(targetResponse, requestStartTime, requestBody, (body) => {
        const now = Date.now();
        // Throttled update to database during streaming (every 100ms)
        if (now - lastDbUpdate > 100) {
          updateRequest(requestId, body);
          lastDbUpdate = now;
        }
      });

      const reader = clientStream.getReader();

      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        } catch (err) {
          console.error('Error pumping stream to client:', err);
          res.end();
        }
      };

      pump();

      // Wait for the stream to finish and metrics to be computed, then save
      const { metrics, responseBody } = await metricsPromise;
      updateRequest(requestId, responseBody, metrics);

    } else {
      // Non-streaming response handling
      const responseData = (await targetResponse.json()) as any;
      const totalLatency = performance.now() - requestStartTime;

      let promptTokens = responseData.usage?.prompt_tokens || responseData.usage?.input_tokens || 0;
      if (!promptTokens && requestBody.messages) {
        promptTokens = Math.ceil(JSON.stringify(requestBody.messages).length / 4);
      }

      const metrics = {
        ttft: totalLatency,
        totalLatency,
        tokensPerSecond: 0, // Not applicable for non-streaming
        promptPrefillSpeed: (promptTokens && totalLatency > 0) ? (promptTokens / (totalLatency / 1000)) : 0,
        tokenCount: responseData.usage?.completion_tokens || responseData.usage?.output_tokens || 0,
        interTokenLatencies: [],
        completedAt: new Date().toISOString()
      };

      res.json(responseData);
      updateRequest(requestId, responseData, metrics);
    }

  } catch (error: any) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Failed to proxy request', details: error.message });
  }
});

export default router;
