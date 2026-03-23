import { useState } from 'react';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Slider } from './ui/slider';
import frankensteinText from '../../../benchmarks/gutenberg/frankenstein.txt?raw';

interface BenchmarkModeProps {
  onRunComplete: () => void;
}

export function BenchmarkMode({ onRunComplete }: BenchmarkModeProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [activeScenario, setActiveScenario] = useState('context');
  const [contextTokens, setContextTokens] = useState(4000);

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
      action: () => {
        const charCount = contextTokens * 4;
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
      action: () => runBenchmark('Hello.', 3)
    },
    generation: {
      title: 'Generation Heavy',
      desc: 'Asks the model to write a long story to test Tokens/Sec throughput.',
      action: () => runBenchmark('Write a highly detailed, 5 paragraph story about a cybernetic cat exploring a neon city. Be extremely descriptive.', 1)
    }
  };

  return (
    <div className="flex flex-col h-full p-8 overflow-auto bg-background">
      <div className="max-w-4xl w-full mx-auto space-y-12">
        <div className="border-b border-border pb-4">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground">Benchmark Mode</h2>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-2">Run standardized tests against your LLM to measure performance.</p>
        </div>

        <Tabs value={activeScenario} onValueChange={setActiveScenario}>
          <TabsList className="mb-8 p-0 h-auto bg-transparent flex gap-4">
            {Object.entries(scenarios).map(([key, s]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[4px_4px_0px_0px_var(--color-foreground)] data-[state=active]:-translate-y-[2px] data-[state=active]:-translate-x-[2px] border-2 border-foreground rounded-md px-6 py-3 font-bold uppercase tracking-widest text-xs transition-all bg-background text-foreground"
              >
                {s.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(scenarios).map(([key, s]) => (
            <TabsContent key={key} value={key} className="mt-0">
              <div className="border-2 border-foreground rounded-md p-8 bg-card shadow-[8px_8px_0px_0px_var(--color-foreground)] space-y-8">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-foreground">{s.title}</h3>
                  <p className="text-sm font-mono text-muted-foreground mt-2">{s.desc}</p>
                </div>

                {key === 'context' && (
                  <div className="space-y-6 py-6 border-y border-border">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-widest text-foreground">Context Size</label>
                      <span className="text-sm font-mono font-bold">{contextTokens.toLocaleString()} TKNS</span>
                    </div>
                    <Slider
                      value={[contextTokens]}
                      onValueChange={(vals) => setContextTokens(Array.isArray(vals) ? vals[0] : (vals as unknown as number))}
                      min={1000}
                      max={128000}
                      step={1000}
                      className="w-full"
                    />
                    <p className="text-[10px] font-mono uppercase text-muted-foreground">
                      Select the target token length. Frankenstein is roughly ~25k tokens. Sizes larger than the book will loop the text.
                    </p>
                  </div>
                )}

                <Button
                  onClick={s.action}
                  disabled={isRunning}
                  className="w-full h-14 rounded-none font-black uppercase tracking-widest text-lg"
                >
                  {isRunning ? 'RUNNING BENCHMARK...' : 'START RUN'}
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
