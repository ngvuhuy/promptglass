import type { Metrics } from '../../../shared/types.js';
import { Card, CardContent } from './ui/card';
import { Clock, Zap, Activity, Timer } from 'lucide-react';

interface MetricsPanelProps {
  metrics: Metrics;
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  const statCards = [
    {
      title: 'Time to First Token',
      value: `${Math.round(metrics.ttft)} ms`,
      icon: <Timer className="w-4 h-4 text-blue-400" />,
      desc: 'Correlates to prefill speed',
    },
    {
      title: 'Throughput',
      value: `${metrics.tokensPerSecond.toFixed(1)} t/s`,
      icon: <Zap className="w-4 h-4 text-yellow-400" />,
      desc: 'Generation speed',
    },
    {
      title: 'Total Latency',
      value: `${Math.round(metrics.totalLatency)} ms`,
      icon: <Clock className="w-4 h-4 text-purple-400" />,
      desc: 'End-to-end request time',
    },
    {
      title: 'Tokens',
      value: metrics.tokenCount.toString(),
      icon: <Activity className="w-4 h-4 text-green-400" />,
      desc: 'Total generated tokens',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-900 border-b border-gray-800">
      {statCards.map((stat, i) => (
        <Card key={i} className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {stat.title}
              </span>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-gray-100">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.desc}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
