import type { StoredRequest } from '../../../shared/types.js';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { ArrowRight, ArrowDown, ArrowUp, Activity, Zap } from 'lucide-react';
import { diffWords } from 'diff';

interface DiffViewProps {
  requestA: StoredRequest;
  requestB: StoredRequest;
  onClose: () => void;
}

export function DiffView({ requestA, requestB, onClose }: DiffViewProps) {
  // Helper to extract response string
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
  
  // Calculate word-level differences
  const differences = diffWords(textA, textB);

  // Helper to render stat differences
  const StatDiff = ({ label, valA, valB, invertColors = false }: { label: string, valA: number, valB: number, invertColors?: boolean }) => {
    const diff = valB - valA;
    const pct = valA > 0 ? (diff / valA) * 100 : 0;
    
    // Determine if the change is "good" or "bad"
    // For TTFT/Latency, lower is better. For Tokens/sec, higher is better.
    let isImprovement = diff < 0;
    if (invertColors) isImprovement = diff > 0;
    
    let colorClass = 'text-gray-500';
    let Icon = ArrowRight;
    
    if (Math.abs(pct) > 1) {
      colorClass = isImprovement ? 'text-green-400' : 'text-red-400';
      Icon = isImprovement ? ArrowDown : ArrowUp;
      if (invertColors) Icon = isImprovement ? ArrowUp : ArrowDown;
    }

    return (
      <div className="flex flex-col bg-gray-900 border border-gray-800 rounded-lg p-4">
        <span className="text-xs text-gray-500 uppercase tracking-wider mb-2">{label}</span>
        <div className="flex items-center justify-between">
          <span className="text-lg font-mono text-gray-400">{Math.round(valA)}</span>
          <div className={`flex items-center text-sm font-bold ${colorClass}`}>
            <Icon className="w-4 h-4 mr-1" />
            {Math.abs(pct).toFixed(1)}%
          </div>
          <span className="text-lg font-mono text-gray-100">{Math.round(valB)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50">
        <div>
          <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Diff View: Request Comparison
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Compare #{requestA.id} (Base) against #{requestB.id} (Target)
          </p>
        </div>
        <button 
          onClick={onClose}
          className="text-sm px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-md transition-colors"
        >
          Close Diff
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <Card className="bg-gray-950 border-gray-800">
          <CardHeader>
            <CardTitle className="text-sm text-gray-400">Stats Comparison (Cache Miss Detection)</CardTitle>
          </CardHeader>
          <CardContent>
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
                invertColors={true} // Higher is better
              />
            </div>
            {requestA.metrics.ttft > requestB.metrics.ttft * 1.5 && (
              <div className="mt-4 p-3 bg-green-900/20 border border-green-900/50 rounded text-sm text-green-400 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Target request is significantly faster. High probability of a KV Cache hit!
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-950 border-gray-800 flex-1 flex flex-col min-h-[400px]">
          <CardHeader>
            <CardTitle className="text-sm text-gray-400">Token-Level Diff</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 w-full bg-gray-900 p-4 font-mono text-sm leading-relaxed border border-gray-800 rounded-md">
              <div className="whitespace-pre-wrap">
                {differences.map((part, index) => {
                  if (part.added) {
                    return <span key={index} className="bg-green-900/40 text-green-300 px-0.5 rounded">{part.value}</span>;
                  }
                  if (part.removed) {
                    return <span key={index} className="bg-red-900/40 text-red-300 px-0.5 rounded line-through decoration-red-500/50">{part.value}</span>;
                  }
                  return <span key={index} className="text-gray-400">{part.value}</span>;
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
