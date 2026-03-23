import { useState } from 'react';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Send, Loader2 } from 'lucide-react';

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
      // Send the request directly to our proxy endpoint
      // We pass the X-PromptGlass-Mode header so the backend knows to categorize it as a "chat" request
      const response = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PromptGlass-Mode': 'chat',
        },
        body: JSON.stringify({
          model: 'default', // The target LLM will interpret this
          messages,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${await response.text()}`);
      }

      // We just consume the stream to let the backend proxy finish its job
      // The Sidebar and ChatView will pick up the saved request via the polling mechanism
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
    <div className="flex flex-col h-full p-6 space-y-6 overflow-auto">
      <div className="max-w-4xl w-full mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Chat Mode</h2>
          <p className="text-gray-400">Send requests directly to test the LLM.</p>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-sm text-gray-400 uppercase">System Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are a helpful AI assistant."
              className="bg-gray-950 border-gray-800 text-gray-200 font-mono resize-none"
              rows={3}
            />
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-sm text-blue-400 uppercase">User Prompt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask a question..."
              className="bg-gray-950 border-gray-800 text-gray-200 font-mono min-h-[150px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSend();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Press Cmd/Ctrl + Enter to send</span>
              <Button 
                onClick={handleSend} 
                disabled={isSending || !prompt.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {isSending ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
            {error && (
              <div className="text-sm text-red-500 mt-2 p-3 bg-red-950/30 rounded border border-red-900/50">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
