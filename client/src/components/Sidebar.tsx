import type { StoredRequest } from '../../../shared/types.js';
import { format } from 'date-fns';
import { ScrollArea } from './ui/scroll-area';

interface SidebarProps {
  requests: StoredRequest[];
  selectedId: number | null;
  diffTargetId?: number | null;
  onSelect: (id: number) => void;
  onDiffSelect?: (id: number) => void;
}

export function Sidebar({ requests, selectedId, diffTargetId, onSelect, onDiffSelect }: SidebarProps) {
  return (
    <div className="w-[280px] flex-shrink-0 bg-background border-r border-border flex flex-col h-full">
      <div className="p-5 border-b border-border bg-primary text-primary-foreground">
        <h1 className="text-xl font-black uppercase tracking-tighter">PromptGlass</h1>
        <p className="text-[10px] font-mono mt-1 opacity-70">LLM Request Inspector</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col divide-y divide-border">
          {requests.map((req) => {
            const isSelected = selectedId === req.id;
            const isDiffTarget = diffTargetId === req.id;

            let itemClass = "group relative w-full text-left p-4 transition-colors flex flex-col gap-2";
            if (isSelected) {
              itemClass += " bg-primary text-primary-foreground";
            } else if (isDiffTarget) {
              itemClass += " bg-secondary";
            } else {
              itemClass += " hover:bg-secondary text-muted-foreground hover:text-foreground";
            }

            return (
              <button
                key={req.id}
                onClick={() => onSelect(req.id)}
                className={itemClass}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold uppercase tracking-wider text-xs">{req.mode}</span>
                  <span className={`text-[10px] font-mono ${isSelected ? 'opacity-90' : 'opacity-50'}`}>
                    {format(new Date(req.createdAt), 'HH:mm:ss')}
                  </span>
                </div>

                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-mono">
                    {req.metrics ? `${req.metrics.tokenCount} TKNS` : 'PENDING'}
                  </span>
                  <span className="text-xs font-mono">
                    {req.metrics && req.metrics.ttft > 0 ? `${Math.round(req.metrics.ttft)}ms` : '---'}
                  </span>
                </div>

                {onDiffSelect && !isSelected && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onDiffSelect(req.id);
                    }}
                    className="absolute top-0 right-0 h-full px-3 flex items-center justify-center bg-foreground text-background text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Compare
                  </div>
                )}
              </button>
            );
          })}
          {requests.length === 0 && (
            <div className="text-center p-6 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              No requests
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
