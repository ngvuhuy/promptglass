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
  requestBody?: any,
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
    let promptTokenCount: number | null = null;

    // Node 24 allows async iteration over Web Streams natively
    for await (const event of parserStream as any) {
      if (event.data === '[DONE]') continue;

      try {
        const data = JSON.parse(event.data);
        const now = performance.now();
        const eventType = (event as any).event;

        // Check for usage info in the chunk (OpenAI spec and others)
        // Chat Completions usage is often in the last chunk or every chunk with stream_options
        // Responses API usage is in the response.completed event
        const usage = data.usage || data.statistics || data.stats;
        if (usage) {
          if (usage.completion_tokens) usageTokenCount = usage.completion_tokens;
          if (usage.prompt_tokens) promptTokenCount = usage.prompt_tokens;
          if (usage.input_tokens) promptTokenCount = usage.input_tokens; // Anthropic/others
          if (usage.output_tokens) usageTokenCount = usage.output_tokens;
        }

        // Extract content based on API type
        let content = '';
        if (eventType === 'response.output_text.delta') {
          content = data.delta || '';
        } else if (eventType === 'response.reasoning_summary_text.delta') {
          // Could handle reasoning separately if needed, but for now just append
          content = data.delta || '';
        } else {
          // Fallback to Chat Completions format
          content = data.choices?.[0]?.delta?.content || data.delta?.content || '';
        }

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
          
          // Initialize for Chat Completions
          const choice = fullResponseBody.choices?.[0];
          if (choice?.delta) {
            choice.message = {
              role: choice.delta.role || 'assistant',
              content: choice.delta.content || ''
            };
            delete choice.delta;
          }
          
          // Initialize for Responses API
          if (eventType?.startsWith('response.')) {
            fullResponseBody.output = fullResponseBody.output || [];
            if (eventType === 'response.output_text.delta' && content) {
               fullResponseBody.output.push({
                 type: 'message',
                 role: 'assistant',
                 content: content
               });
            }
          }
        } else {
          // Update existing response body
          if (eventType === 'response.output_text.delta') {
            const outputItem = fullResponseBody.output?.find((i: any) => i.type === 'message');
            if (outputItem) {
              outputItem.content += content;
            } else {
              fullResponseBody.output = fullResponseBody.output || [];
              fullResponseBody.output.push({
                type: 'message',
                role: 'assistant',
                content: content
              });
            }
          } else if (eventType === 'response.completed') {
            // Take the final response object as the ground truth
            fullResponseBody = { ...data };
          } else if (content && fullResponseBody.choices?.[0]?.message) {
            fullResponseBody.choices[0].message.content += content;
          }
          
          // If we got more usage info later
          if (usage) {
             fullResponseBody.usage = { ...fullResponseBody.usage, ...usage };
          }
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

    // Estimate prompt token count if not provided by response
    if (promptTokenCount === null && requestBody?.messages) {
      const promptText = JSON.stringify(requestBody.messages);
      promptTokenCount = Math.ceil(promptText.length / 4); // Basic estimation
    }

    const prefillSpeed = (promptTokenCount && ttft > 0) ? (promptTokenCount / (ttft / 1000)) : 0;

    return {
      metrics: {
        ttft,
        totalLatency,
        tokensPerSecond: generationTimeMs > 0 ? (finalTokenCount / (generationTimeMs / 1000)) : 0,
        promptPrefillSpeed: prefillSpeed,
        tokenCount: finalTokenCount,
        interTokenLatencies,
        completedAt: new Date().toISOString(),
      },
      responseBody: fullResponseBody,
    };
  })();

  return { clientStream, metricsPromise };
}
