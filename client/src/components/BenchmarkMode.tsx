import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Zap, Clock, FileText, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

interface BenchmarkModeProps {
  onRunComplete: () => void;
}

export function BenchmarkMode({ onRunComplete }: BenchmarkModeProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [activeScenario, setActiveScenario] = useState('latency');

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

        // Consume stream
        const reader = response.body?.getReader();
        if (reader) {
          while (true) {
            const { done } = await reader.read();
            if (done) break;
          }
        }
        
        // Slight pause between rapid runs
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
    },
    context: {
      title: 'Context Heavy',
      desc: 'Sends a large block of text to test the prefill speed cache.',
      icon: <FileText className="w-5 h-5 text-purple-400" />,
      action: () => {
        // Generate a synthetic "large context" by repeating a string
        const largeContext = "This is a test of context processing. ".repeat(500);
        runBenchmark(`${largeContext}\n\nSummarize the above text in one sentence.`, 1);
      }
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
                <CardContent>
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
