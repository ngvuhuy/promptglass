import type { StoredRequest } from '../../../shared/types.js';
import { format } from 'date-fns';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { MessageSquare, Eye, Zap } from 'lucide-react';

interface SidebarProps {
  requests: StoredRequest[];
  selectedId: number | null;
  diffTargetId?: number | null;
  onSelect: (id: number) => void;
  onDiffSelect?: (id: number) => void;
}

export function Sidebar({ requests, selectedId, diffTargetId, onSelect, onDiffSelect }: SidebarProps) {
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
          {requests.map((req) => {
            const isSelected = selectedId === req.id;
            const isDiffTarget = diffTargetId === req.id;
            
            let bgClass = 'bg-gray-900 border-gray-800 hover:bg-gray-800 hover:border-gray-700';
            if (isSelected) bgClass = 'bg-gray-800 border-blue-500/50 shadow-sm';
            else if (isDiffTarget) bgClass = 'bg-gray-800 border-purple-500/50 shadow-sm';

            return (
              <div key={req.id} className={`group relative w-full text-left p-3 rounded-lg border transition-all ${bgClass}`}>
                <button
                  onClick={() => onSelect(req.id)}
                  className="w-full text-left"
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
                
                {/* Compare button that appears on hover, unless it's the currently selected base item */}
                {onDiffSelect && !isSelected && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDiffSelect(req.id);
                    }}
                    className="absolute top-2 right-2 px-2 py-1 text-[10px] bg-gray-800 text-gray-400 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-900 hover:text-purple-300 border border-gray-700 hover:border-purple-700"
                  >
                    Compare
                  </button>
                )}
              </div>
            );
          })}
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
