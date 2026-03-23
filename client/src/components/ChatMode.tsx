import { useState } from 'react';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';

interface ChatModeProps {
  onMessageSent: () => void;
}

export function ChatMode({ onMessageSent }: ChatModeProps) {
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant.');
  const [prompt, setPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!prompt.trim()) return;

    setIsSending(true);
    setError(null);

    const messages = [];
    if (systemPrompt.trim()) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    try {
      const response = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PromptGlass-Mode': 'chat',
        },
        body: JSON.stringify({
          model: 'default',
          messages,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${await response.text()}`);
      }

      const reader = response.body?.getReader();
      if (reader) {
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
      }

      setPrompt('');
      onMessageSent();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-8 space-y-12 overflow-auto bg-background">
      <div className="max-w-4xl w-full mx-auto space-y-12">
        <div className="border-b border-border pb-4">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground">Chat Mode</h2>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-2">Send requests directly to test the LLM.</p>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-foreground block">System Prompt</label>
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="You are a helpful AI assistant."
            className="font-mono bg-secondary border-none resize-none p-4"
            rows={3}
          />
        </div>

        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-primary block">User Prompt</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask a question..."
            className="font-mono bg-secondary border-none min-h-[200px] p-4 text-foreground"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSend();
              }
            }}
          />
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs font-mono uppercase text-muted-foreground tracking-widest">Press Cmd/Ctrl + Enter to send</span>
            <Button
              onClick={handleSend}
              disabled={isSending || !prompt.trim()}
              className="rounded-none font-bold uppercase tracking-widest"
            >
              {isSending ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
          {error && (
            <div className="text-xs font-mono text-destructive mt-4 p-4 bg-destructive/10 border border-destructive">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
