import type { StoredRequest } from '../../../shared/types.js';
import { MetricsPanel } from './MetricsPanel';
import { TokenStream } from './TokenStream';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

interface ChatViewProps {
  request: StoredRequest;
  viewMode: 'pretty' | 'raw';
  onViewModeChange: (mode: 'pretty' | 'raw') => void;
}

export function ChatView({ request, viewMode, onViewModeChange }: ChatViewProps) {
  const isStreaming = !request.metrics;

  // Extract messages or prompt
  const messages = (request.requestBody.messages || []) as any[];
  const prompt = request.requestBody.prompt;
  const instructions = request.requestBody.instructions;
  const input = request.requestBody.input;

  // Reconstruct response content
  let responseContent = '';
  if (request.responseBody?.choices?.[0]?.message?.content) {
    responseContent = request.responseBody.choices[0].message.content;
  } else if (request.responseBody?.choices?.[0]?.text) {
    responseContent = request.responseBody.choices[0].text;
  } else if (Array.isArray(request.responseBody?.output)) {
    // Responses API format
    const messageItem = request.responseBody.output.find((i: any) => i.type === 'message' || i.role === 'assistant');
    if (messageItem) {
      const content = messageItem.content;
      if (typeof content === 'string') {
        responseContent = content;
      } else if (Array.isArray(content)) {
        // Handle array of content parts (e.g., [{ type: 'output_text', text: '...' }])
        responseContent = content.map((part: any) => {
          if (typeof part === 'string') return part;
          return part.text || part.output_text || '';
        }).join('');
      }
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="flex items-center justify-between pr-6 border-b border-border">
        <div className="flex-1">
          <MetricsPanel metrics={request.metrics} isStreaming={isStreaming} />
        </div>
        <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as 'pretty' | 'raw')} className="ml-4">
          <TabsList className="bg-secondary/50 p-1">
            <TabsTrigger
              value="pretty"
              className="text-[10px] font-black uppercase tracking-widest px-3 py-1 data-[state=active]:bg-background"
            >
              Pretty
            </TabsTrigger>
            <TabsTrigger
              value="raw"
              className="text-[10px] font-black uppercase tracking-widest px-3 py-1 data-[state=active]:bg-background"
            >
              Raw JSON
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-auto p-8 max-w-5xl mx-auto w-full">
        {viewMode === 'pretty' ? (
          <div className="space-y-12 w-full">
            {instructions && (
              <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Instructions</h3>
                <div className="p-6 bg-secondary text-sm font-mono whitespace-pre-wrap leading-relaxed">
                  {instructions}
                </div>
              </section>
            )}

            {input && (
              <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-border pb-2">Input</h3>
                <div className="space-y-8">
                  {Array.isArray(input) ? (
                    input.map((item: any, index: number) => {
                      // If it's a message-like object with role and content
                      if (item.role && item.content) {
                        return (
                          <div key={index} className="space-y-2">
                            <h4 className={`text-[10px] font-black uppercase tracking-widest ${
                              item.role === 'system' ? 'text-muted-foreground' :
                              item.role === 'user' ? 'text-primary' :
                              'text-foreground'
                            }`}>
                              {item.role}
                            </h4>
                            <div className="p-6 bg-secondary text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground">
                              {typeof item.content === 'string' ? item.content : JSON.stringify(item.content, null, 2)}
                            </div>
                          </div>
                        );
                      }
                      // Fallback for other array item types
                      return (
                        <div key={index} className="p-6 bg-secondary text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground">
                          {typeof item === 'string' ? item : JSON.stringify(item, null, 2)}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 bg-secondary text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground">
                      {typeof input === 'string' ? input : JSON.stringify(input, null, 2)}
                    </div>
                  )}
                </div>
              </section>
            )}

            {prompt && (
              <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-border pb-2">Prompt</h3>
                <div className="p-6 bg-secondary text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground">
                  {prompt}
                </div>
              </section>
            )}

            {messages.map((message, index) => (
              <section key={index} className="space-y-4">
                <h3 className={`text-xs font-black uppercase tracking-widest border-b border-border pb-2 ${message.role === 'system' ? 'text-muted-foreground' :
                  message.role === 'user' ? 'text-primary' :
                    'text-foreground'
                  }`}>
                  {message.role}
                </h3>
                <div className={`p-6 bg-secondary text-sm font-mono whitespace-pre-wrap leading-relaxed ${message.role === 'user' ? 'text-foreground' : ''
                  }`}>
                  {typeof message.content === 'string' ? message.content : JSON.stringify(message.content, null, 2)}
                </div>
              </section>
            ))}

            {!prompt && messages.length === 0 && !instructions && !input && (
              <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-border pb-2">User</h3>
                <div className="p-6 bg-secondary text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground">
                  No user prompt found
                </div>
              </section>
            )}

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
        ) : (
          <div className="space-y-12 w-full font-mono text-xs">
            <section className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-border pb-2">Request Body</h3>
              <div className="p-6 bg-secondary overflow-auto max-h-[400px]">
                <pre>{JSON.stringify(request.requestBody, null, 2)}</pre>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-foreground border-b border-border pb-2">Response Body</h3>
              <div className="p-6 bg-secondary overflow-auto max-h-[600px]">
                <pre>{JSON.stringify(request.responseBody, null, 2)}</pre>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
