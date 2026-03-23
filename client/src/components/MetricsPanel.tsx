import type { Metrics } from '../../../shared/types.js';

interface MetricsPanelProps {
  metrics: Metrics;
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  const statCards = [
    {
      title: 'TTFT',
      value: `${Math.round(metrics.ttft)}ms`,
    },
    {
      title: 'Speed',
      value: `${metrics.tokensPerSecond.toFixed(1)} t/s`,
    },
    {
      title: 'Latency',
      value: `${Math.round(metrics.totalLatency)}ms`,
    },
    {
      title: 'Tokens',
      value: metrics.tokenCount.toString(),
    },
  ];

  return (
    <div className="flex flex-row items-center divide-x divide-border border-b border-border bg-background">
      {statCards.map((stat, i) => (
        <div key={i} className="flex flex-col flex-1 px-6 py-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
            {stat.title}
          </span>
          <span className="text-2xl font-mono font-bold text-foreground tracking-tighter">
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
