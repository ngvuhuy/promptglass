import type { StoredRequest } from '../../../shared/types.js';
import { MetricsPanel } from './MetricsPanel';
import { TokenStream } from './TokenStream';

interface ChatViewProps {
  request: StoredRequest;
}

export function ChatView({ request }: ChatViewProps) {
  const isStreaming = !request.metrics;

  // Extract the last user message or the prompt
  const messages = request.requestBody.messages || [];
  const systemPrompt = messages.find((m: any) => m.role === 'system')?.content;
  const userPrompt = messages.filter((m: any) => m.role === 'user').pop()?.content || 'No user prompt found';

  // Reconstruct response content
  let responseContent = '';
  if (request.responseBody?.choices?.[0]?.message?.content) {
    responseContent = request.responseBody.choices[0].message.content;
  } else if (request.responseBody?.choices?.[0]?.text) {
    responseContent = request.responseBody.choices[0].text;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <MetricsPanel metrics={request.metrics} isStreaming={isStreaming} />

      <div className="flex-1 overflow-auto p-8 space-y-12 max-w-5xl mx-auto w-full">
        {systemPrompt && (
          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-2">System</h3>
            <div className="p-6 bg-secondary text-sm font-mono whitespace-pre-wrap leading-relaxed">
              {systemPrompt}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-border pb-2">User</h3>
          <div className="p-6 bg-secondary text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground">
            {userPrompt}
          </div>
        </section>

        <section className="space-y-4 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Assistant</h3>
            {isStreaming && (
              <span className="text-[10px] font-mono text-primary animate-pulse uppercase tracking-widest">Streaming...</span>
            )}
          </div>
          <div className="flex-1 min-h-0 bg-secondary">
            <TokenStream content={responseContent} />
          </div>
        </section>
      </div>
    </div>
  );
}
