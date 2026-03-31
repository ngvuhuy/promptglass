import { EventSourceParserStream } from 'eventsource-parser/stream';
import { Metrics } from '../../shared/types.js';

export interface ProcessedStream {
  clientStream: ReadableStream<Uint8Array>;
  metricsPromise: Promise<{ metrics: Metrics; responseBody: any }>;
}

/**
 * Splits an LLM SSE stream: one untouched for the client, one for metrics/capture.
 */
export function processStream(
  response: Response,
  requestStartTime: number,
  onChunk?: (body: any) => void
): ProcessedStream {
  // Split the stream: one for the client, one for our internal processing
  const [clientStream, internalStream] = response.body!.tee();

  const metricsPromise = (async () => {
    let firstTokenTime: number | null = null;
    let lastTokenTime: number = requestStartTime;
    const interTokenLatencies: number[] = [];
    let tokenCount = 0;
    let fullResponseBody: any = null;

    const parserStream = internalStream
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new EventSourceParserStream());

    let usageTokenCount: number | null = null;

    // Node 24 allows async iteration over Web Streams natively
    for await (const event of parserStream as any) {
      if (event.data === '[DONE]') continue;

      try {
        const data = JSON.parse(event.data);
        const now = performance.now();

        // Check for usage info in the chunk (OpenAI spec)
        if (data.usage?.completion_tokens) {
          usageTokenCount = data.usage.completion_tokens;
        }

        const content = data.choices?.[0]?.delta?.content || '';
        if (content) {
          tokenCount++;
          if (firstTokenTime === null) {
            firstTokenTime = now;
          } else {
            interTokenLatencies.push(now - lastTokenTime);
          }
          lastTokenTime = now;
        }

        // Reconstruct the full response body
        if (!fullResponseBody) {
          fullResponseBody = { ...data };
          const choice = fullResponseBody.choices?.[0];
          if (choice?.delta) {
            choice.message = {
              role: choice.delta.role || 'assistant',
              content: choice.delta.content || ''
            };
            delete choice.delta;
          }
        } else if (content) {
          fullResponseBody.choices[0].message.content += content;
        }

        if (onChunk && fullResponseBody) {
          onChunk(fullResponseBody);
        }
      } catch (e) {
        // Ignore malformed chunks
      }
    }

    const now = performance.now();
    const totalLatency = now - requestStartTime;
    const ttft = firstTokenTime ? firstTokenTime - requestStartTime : totalLatency;
    const generationTimeMs = totalLatency - ttft;
    const finalTokenCount = usageTokenCount ?? tokenCount;

    return {
      metrics: {
        ttft,
        totalLatency,
        tokensPerSecond: generationTimeMs > 0 ? (finalTokenCount / (generationTimeMs / 1000)) : 0,
        tokenCount: finalTokenCount,
        interTokenLatencies,
        completedAt: new Date().toISOString(),
      },
      responseBody: fullResponseBody,
    };
  })();

  return { clientStream, metricsPromise };
}
