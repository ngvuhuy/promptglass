import { Router, Request, Response } from 'express';
import { saveRequest, getSetting } from '../services/storage.js';
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
  const targetUrl = getSetting('TARGET_URL') || process.env.TARGET_URL;
  const targetApiKey = getSetting('TARGET_API_KEY') || process.env.TARGET_API_KEY;

  if (!targetUrl) {
    res.status(500).json({ error: 'Target URL is not configured.' });
    return;
  }

  const requestBody = req.body;
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

      const { clientStream, metricsPromise } = processStream(targetResponse, requestStartTime);

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
      saveRequest(mode, requestBody, responseBody, metrics, contextHash);

    } else {
      // Non-streaming response handling
      const responseData = (await targetResponse.json()) as any;
      const totalLatency = performance.now() - requestStartTime;

      const metrics = {
        ttft: totalLatency,
        totalLatency,
        tokensPerSecond: 0, // Not applicable for non-streaming in the same way
        tokenCount: responseData.usage?.completion_tokens || 0,
        interTokenLatencies: [],
        completedAt: new Date().toISOString()
      };

      res.json(responseData);
      saveRequest(mode, requestBody, responseData, metrics, contextHash);
    }

  } catch (error: any) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Failed to proxy request', details: error.message });
  }
});

export default router;
