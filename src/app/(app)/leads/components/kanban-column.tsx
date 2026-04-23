import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Lead } from '@/lib/types';
import { KanbanCard } from './kanban-card';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  id: string;
  title: string;
  leads: Lead[];
  onWhatsAppClick: (lead: Lead) => void;
  onCardClick: (lead: Lead) => void;
  accentColorClass: string;
}

export function KanbanColumn({ id, title, leads, onWhatsAppClick, onCardClick, accentColorClass }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div className="flex flex-col w-80 shrink-0 h-full">
      <div className={cn("flex items-center justify-between mb-3 px-1", accentColorClass)}>
        <h3 className="font-bold text-sm tracking-widest uppercase">{title}</h3>
        <span className="text-xs font-semibold bg-background/50 rounded-full px-2 py-0.5 border border-border/50">
          {leads.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 bg-muted/20 rounded-2xl p-3 overflow-y-auto border border-border/30 transition-colors duration-200",
          isOver && "bg-muted/40 border-primary/30 ring-1 ring-primary/20",
          "scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/30"
        )}
      >
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          <div className="min-h-[150px] w-full h-full pb-10">
            {leads.map((lead) => (
              <KanbanCard 
                key={lead.id} 
                lead={lead} 
                onWhatsAppClick={onWhatsAppClick}
                onClick={onCardClick}
              />
            ))}
            {leads.length === 0 && (
                <div className="h-full flex items-center justify-center">
                   <p className="text-xs text-muted-foreground/50 font-semibold uppercase tracking-widest text-center border-2 border-dashed border-border/50 p-4 rounded-xl">Solte Aqui</p>
                </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
