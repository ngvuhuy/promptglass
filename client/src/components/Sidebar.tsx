import type { StoredRequest } from '../../../shared/types.js';
import { format } from 'date-fns';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { MessageSquare, Eye, Zap } from 'lucide-react';

interface SidebarProps {
  requests: StoredRequest[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function Sidebar({ requests, selectedId, onSelect }: SidebarProps) {
  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'chat': return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'benchmark': return <Zap className="w-4 h-4 text-yellow-400" />;
      default: return <Eye className="w-4 h-4 text-green-400" />;
    }
  };

  return (
    <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      <div className="p-4 border-b border-gray-800 bg-gray-900/50">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          PromptGlass
        </h1>
        <p className="text-xs text-gray-500 mt-1">LLM Request Inspector</p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {requests.map((req) => (
            <button
              key={req.id}
              onClick={() => onSelect(req.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedId === req.id
                  ? 'bg-gray-800 border-blue-500/50 shadow-sm'
                  : 'bg-gray-900 border-gray-800 hover:bg-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getModeIcon(req.mode)}
                  <span className="text-xs font-medium text-gray-300 capitalize">
                    {req.mode}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500">
                  {format(new Date(req.createdAt), 'HH:mm:ss')}
                </span>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <Badge variant="secondary" className="text-[10px] bg-gray-800 text-gray-300">
                  {req.metrics.tokenCount} tokens
                </Badge>
                <span className="text-xs text-gray-400">
                  {req.metrics.ttft > 0 ? `${Math.round(req.metrics.ttft)}ms ttft` : '...'}
                </span>
              </div>
            </button>
          ))}
          {requests.length === 0 && (
            <div className="text-center p-4 text-sm text-gray-500">
              No requests recorded yet.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
