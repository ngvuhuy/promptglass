import { useState } from 'react';
import type { StoredRequest } from '../../../shared/types.js';
import { format } from 'date-fns';
import { ScrollArea } from './ui/scroll-area';

interface SidebarProps {
  requests: StoredRequest[];
  selectedId: number | null;
  diffTargetId?: number | null;
  onSelect: (id: number) => void;
  onDiffSelect?: (id: number) => void;
  onDelete?: (ids: number[]) => void;
}

export function Sidebar({ requests, selectedId, diffTargetId, onSelect, onDiffSelect, onDelete }: SidebarProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);

  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setIsSelecting(newSelected.size > 0);
  };

  const handleDelete = () => {
    if (onDelete && selectedIds.size > 0) {
      onDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelecting(false);
    }
  };

  const cancelSelection = () => {
    setSelectedIds(new Set());
    setIsSelecting(false);
  };

  return (
    <div className="w-[280px] flex-shrink-0 bg-background border-r border-border flex flex-col h-full">
      <div className="p-5 border-b border-border bg-primary text-primary-foreground">
        <h1 className="text-xl font-black uppercase tracking-tighter">PromptGlass</h1>
        <p className="text-[10px] font-mono mt-1 opacity-70">LLM Request Inspector</p>
      </div>

      {isSelecting && (
        <div className="p-3 border-b border-border bg-secondary flex items-center justify-between gap-2">
          <span className="text-xs font-mono">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={cancelSelection}
              className="text-[10px] font-bold uppercase px-2 py-1 bg-background border border-border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="text-[10px] font-bold uppercase px-2 py-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="flex flex-col divide-y divide-border">
          {requests.map((req) => {
            const isSelected = selectedId === req.id;
            const isDiffTarget = diffTargetId === req.id;
            const isItemSelected = selectedIds.has(req.id);

            let itemClass = "group relative w-full text-left p-4 transition-colors flex flex-col gap-2";
            if (isItemSelected) {
              itemClass += " bg-primary/20 border-l-2 border-l-primary";
            } else if (isSelected) {
              itemClass += " bg-primary text-primary-foreground";
            } else if (isDiffTarget) {
              itemClass += " bg-secondary";
            } else {
              itemClass += " hover:bg-secondary text-muted-foreground hover:text-foreground";
            }

            return (
              <button
                key={req.id}
                onClick={() => !isSelecting && onSelect(req.id)}
                className={itemClass}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isItemSelected}
                      onChange={() => {}}
                      onClick={(e) => toggleSelect(req.id, e)}
                      className="w-3 h-3 accent-primary cursor-pointer"
                    />
                    <span className="font-bold uppercase tracking-wider text-xs">{req.mode}</span>
                  </div>
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

                {!isSelecting && onDiffSelect && !isSelected && (
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
