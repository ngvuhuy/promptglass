import type { StoredRequest } from '../../../shared/types.js';
import { ScrollArea } from './ui/scroll-area';
import { diffWords } from 'diff';

interface DiffViewProps {
  requestA: StoredRequest;
  requestB: StoredRequest;
  onClose: () => void;
}

export function DiffView({ requestA, requestB, onClose }: DiffViewProps) {
  const getResponseText = (req: StoredRequest) => {
    if (req.responseBody?.choices?.[0]?.message?.content) {
      return req.responseBody.choices[0].message.content;
    } else if (req.responseBody?.choices?.[0]?.text) {
      return req.responseBody.choices[0].text;
    }
    return '';
  };

  const textA = getResponseText(requestA);
  const textB = getResponseText(requestB);

  const differences = diffWords(textA, textB);

  const StatDiff = ({ label, valA, valB, invertColors = false }: { label: string, valA: number, valB: number, invertColors?: boolean }) => {
    const diff = valB - valA;
    const pct = valA > 0 ? (diff / valA) * 100 : 0;

    let isImprovement = diff < 0;
    if (invertColors) isImprovement = diff > 0;

    let colorClass = 'text-muted-foreground';
    let iconStr = '→';

    if (Math.abs(pct) > 1) {
      colorClass = isImprovement ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500';
      iconStr = isImprovement ? '↓' : '↑';
      if (invertColors) iconStr = isImprovement ? '↑' : '↓';
    }

    return (
      <div className="flex flex-col border border-border p-4 bg-secondary">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">{label}</span>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-mono font-bold">{Math.round(valA)}</span>
          <div className={`flex items-center text-sm font-black uppercase tracking-widest ${colorClass}`}>
            <span className="mr-1">{iconStr}</span>
            {Math.abs(pct).toFixed(1)}%
          </div>
          <span className="text-2xl font-mono font-bold text-primary">{Math.round(valB)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-border bg-foreground text-background">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter">
            Request Comparison
          </h2>
          <p className="text-xs font-mono mt-1 opacity-70">
            COMPARING #{requestA.id} (BASE) AGAINST #{requestB.id} (TARGET)
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-xs font-bold uppercase tracking-widest px-4 py-2 border border-background hover:bg-background hover:text-foreground transition-colors"
        >
          Close
        </button>
      </div>

      <div className="flex-1 overflow-auto p-8 space-y-12 max-w-5xl mx-auto w-full">
        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-border pb-2">Stats Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatDiff
              label="Time To First Token (ms)"
              valA={requestA.metrics.ttft}
              valB={requestB.metrics.ttft}
            />
            <StatDiff
              label="Total Latency (ms)"
              valA={requestA.metrics.totalLatency}
              valB={requestB.metrics.totalLatency}
            />
            <StatDiff
              label="Tokens Per Second"
              valA={requestA.metrics.tokensPerSecond}
              valB={requestB.metrics.tokensPerSecond}
              invertColors={true}
            />
          </div>
          {requestA.metrics.ttft > requestB.metrics.ttft * 1.5 && (
            <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 rounded-md text-sm text-green-700 dark:text-green-400">
              Target request is significantly faster. High probability of a KV Cache hit!
            </div>
          )}
        </section>

        <section className="space-y-4 flex-1 flex flex-col min-h-[400px]">
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground border-b border-border pb-2">Token-Level Diff</h3>
          <ScrollArea className="flex-1 w-full bg-secondary p-6 font-mono text-sm leading-relaxed border-none">
            <div className="whitespace-pre-wrap">
              {differences.map((part, index) => {
                if (part.added) {
                  return <span key={index} className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 px-0.5 rounded">{part.value}</span>;
                }
                if (part.removed) {
                  return <span key={index} className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 px-0.5 rounded line-through">{part.value}</span>;
                }
                return <span key={index} className="text-muted-foreground">{part.value}</span>;
              })}
            </div>
          </ScrollArea>
        </section>
      </div>
    </div>
  );
}
