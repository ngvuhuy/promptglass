import type { StoredRequest } from '../../../shared/types.js';
import { MetricsPanel } from './MetricsPanel';
import { TokenStream } from './TokenStream';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface ChatViewProps {
  request: StoredRequest;
}

export function ChatView({ request }: ChatViewProps) {
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
    <div className="flex flex-col h-full overflow-hidden">
      <MetricsPanel metrics={request.metrics} />
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
          {/* Input Side */}
          <div className="flex flex-col h-full space-y-4">
            {systemPrompt && (
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-xs text-gray-500 uppercase">System Prompt</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-sm text-gray-300 font-mono whitespace-pre-wrap">{systemPrompt}</p>
                </CardContent>
              </Card>
            )}
            
            <Card className="bg-gray-900 border-gray-800 flex-1 flex flex-col min-h-0">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-xs text-blue-400 uppercase">User Prompt</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 flex-1 overflow-auto">
                <p className="text-sm text-gray-100 font-mono whitespace-pre-wrap">{userPrompt}</p>
              </CardContent>
            </Card>
          </div>

          {/* Output Side */}
          <div className="flex flex-col h-full min-h-0">
            <Card className="bg-gray-900 border-gray-800 flex-1 flex flex-col">
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                <CardTitle className="text-xs text-green-400 uppercase">Assistant Response</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 flex-1 flex flex-col min-h-0">
                <TokenStream content={responseContent} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
