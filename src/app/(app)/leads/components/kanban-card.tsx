import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lead } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MessageCircle, Book, GripVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface KanbanCardProps {
  lead: Lead;
  onWhatsAppClick: (lead: Lead) => void;
  onClick: (lead: Lead) => void;
}

export function KanbanCard({ lead, onWhatsAppClick, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id, data: { ...lead } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const statusColors = {
    new: 'border-blue-500/30 bg-blue-500/5',
    contacted: 'border-amber-500/30 bg-amber-500/5',
    converted: 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    discarded: 'border-rose-500/30 bg-rose-500/5',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative flex flex-col rounded-xl border p-4 mb-3 backdrop-blur-md transition-all group overflow-hidden bg-card/60 hover:border-primary/50 cursor-pointer",
        statusColors[lead.status as keyof typeof statusColors] || 'border-border bg-card/50',
        isDragging && "opacity-60 scale-105 z-50 shadow-2xl ring-2 ring-primary cursor-grabbing"
      )}
      onClick={() => onClick(lead)}
    >
      <div className="absolute top-0 bottom-0 left-0 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:bg-white/5" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
      </div>

      <div className="pl-6">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-sm tracking-tight text-foreground truncate pr-2">
              {lead.name}
            </h4>
            {lead.createdAt && (
                <span className="text-[10px] font-semibold text-muted-foreground/80 shrink-0">
                    {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: false, locale: ptBR })}
                </span>
            )}
          </div>

          <div className="space-y-1.5 mb-4">
            <div className="flex items-center text-xs text-muted-foreground">
              <Book className="mr-1.5 h-3 w-3 shrink-0 opacity-70" />
              <span className="truncate">{lead.course || 'Sem Curso'}</span>
            </div>
            {lead.unit && (
              <div className="flex items-center text-xs text-muted-foreground">
                <div className="mr-1.5 h-3 w-3 shrink-0 rounded-full border border-current opacity-70 flex items-center justify-center text-[8px] font-bold">U</div>
                <span className="truncate">{lead.unit}</span>
              </div>
            )}
          </div>

          <div className="border-t border-border/50 pt-3 flex justify-between items-center">
            <p className="text-xs font-semibold tabular-nums text-foreground/80">
                {lead.phone}
            </p>
            <Button 
                size="sm" 
                variant="ghost"
                className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm z-10"
                onClick={(e) => {
                    e.stopPropagation();
                    onWhatsAppClick(lead);
                }}
            >
                <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
      </div>
    </div>
  );
}
