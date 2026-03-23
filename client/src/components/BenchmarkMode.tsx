import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Zap, Clock, FileText, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Slider } from './ui/slider';
import frankensteinText from '../../../benchmarks/gutenberg/frankenstein.txt?raw';

interface BenchmarkModeProps {
  onRunComplete: () => void;
}

export function BenchmarkMode({ onRunComplete }: BenchmarkModeProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [activeScenario, setActiveScenario] = useState('context');
  const [contextTokens, setContextTokens] = useState(4000); // Default 4k tokens

  const runBenchmark = async (prompt: string, count: number = 1) => {
    setIsRunning(true);
    try {
      for (let i = 0; i < count; i++) {
        const response = await fetch('/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-PromptGlass-Mode': 'benchmark',
          },
          body: JSON.stringify({
            model: 'default',
            messages: [{ role: 'user', content: prompt }],
            stream: true,
          }),
        });

        const reader = response.body?.getReader();
        if (reader) {
          while (true) {
            const { done } = await reader.read();
            if (done) break;
          }
        }
        
        if (i < count - 1) await new Promise(r => setTimeout(r, 500));
      }
    } catch (e) {
      console.error('Benchmark failed', e);
    } finally {
      setIsRunning(false);
      onRunComplete();
    }
  };

  const scenarios = {
    context: {
      title: 'Context Heavy (Gutenberg)',
      desc: 'Sends a large block of text from Frankenstein to test prefill speed.',
      icon: <FileText className="w-5 h-5 text-purple-400" />,
      action: () => {
        // Rough heuristic: 1 token = ~4 chars
        const charCount = contextTokens * 4;
        // Loop the text if the requested size is larger than the book itself
        let payload = frankensteinText;
        while (payload.length < charCount) {
          payload += '\n\n' + frankensteinText;
        }
        
        const slicedText = payload.slice(0, charCount);
        runBenchmark(`${slicedText}\n\nBased on the text above, who is Frankenstein? Summarize in one sentence.`, 1);
      }
    },
    latency: {
      title: 'Latency Ping',
      desc: 'Sends a single word 3 times to measure base TTFT variance.',
      icon: <Clock className="w-5 h-5 text-blue-400" />,
      action: () => runBenchmark('Hello.', 3)
    },
    generation: {
      title: 'Generation Heavy',
      desc: 'Asks the model to write a long story to test Tokens/Sec throughput.',
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      action: () => runBenchmark('Write a highly detailed, 5 paragraph story about a cybernetic cat exploring a neon city. Be extremely descriptive.', 1)
    }
  };

  return (
    <div className="flex flex-col h-full p-6 overflow-auto">
      <div className="max-w-4xl w-full mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Benchmark Mode</h2>
          <p className="text-gray-400">Run standardized tests against your LLM to measure performance.</p>
        </div>

        <Tabs value={activeScenario} onValueChange={setActiveScenario}>
          <TabsList className="bg-gray-900 border border-gray-800">
            {Object.entries(scenarios).map(([key, s]) => (
              <TabsTrigger key={key} value={key} className="data-[state=active]:bg-gray-800">
                <span className="flex items-center gap-2">
                  {s.icon}
                  {s.title}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(scenarios).map(([key, s]) => (
            <TabsContent key={key} value={key} className="mt-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {s.icon} {s.title}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {s.desc}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {key === 'context' && (
                    <div className="space-y-4 py-4 border-y border-gray-800">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-300">Context Size</label>
                        <span className="text-sm font-mono text-purple-400">{contextTokens.toLocaleString()} tokens</span>
                      </div>
                      <Slider
                        value={[contextTokens]}
                        onValueChange={(vals) => setContextTokens((vals as number[])[0])}
                        min={1000}
                        max={128000}
                        step={1000}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500">
                        Select the target token length. Frankenstein is roughly ~25k tokens. Sizes larger than the book will loop the text.
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={s.action} 
                    disabled={isRunning}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
                  >
                    {isRunning ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Running Benchmark...</>
                    ) : (
                      <><Zap className="w-5 h-5 mr-2" /> Start Run</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
