'use client';

import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';
import { Lead } from '@/lib/types';
import { fillTemplate, formatPhoneNumberForWhatsApp } from '@/lib/utils';
import { useTemplates } from '@/context/templates-context';
import { useLeads } from '@/context/leads-context';

interface KanbanBoardProps {
  filteredLeads: Lead[];
  onCardClick: (lead: Lead) => void;
}

const COLUMNS = [
  { id: 'new', title: 'Novo', accent: 'text-blue-500' },
  { id: 'contacted', title: 'Contatado', accent: 'text-amber-500' },
  { id: 'converted', title: 'Convertido', accent: 'text-emerald-500' },
  { id: 'discarded', title: 'Descartado', accent: 'text-rose-500' },
];

export function KanbanBoard({ filteredLeads, onCardClick }: KanbanBoardProps) {
  const { setLeads } = useLeads();
  const { templates } = useTemplates();
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleWhatsAppClick = (lead: Lead) => {
      // Usar a primeira template padrão ou enviar mensagem genérica se não houver template.
      let message = `Olá, ${lead.name.split(' ')[0]}! Tudo bem? Vi que você demonstrou interesse corporativo... vamos conversar?`;
      if (templates.length > 0) {
          message = fillTemplate(templates[0].content, lead as any);
      }
      window.open(`https://wa.me/${formatPhoneNumberForWhatsApp(lead.phone)}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const lead = filteredLeads.find(l => l.id === active.id) || null;
    setActiveLead(lead);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveALead = active.data.current?.id !== undefined;
    const isOverALead = over.data.current?.id !== undefined;

    if (!isActiveALead) return;

    // Moving between columns
    if (isActiveALead && !isOverALead) {
        setLeads((leads) => {
            const activeIndex = leads.findIndex((l) => l.id === activeId);
            const activeLead = leads[activeIndex];
            if (activeLead.status !== overId) {
                const updated = [...leads];
                updated[activeIndex] = { ...activeLead, status: overId as Lead['status'] };
                return updated;
            }
            return leads;
        });
    }

    // Moving vertically in same or different column over another lead
    if (isActiveALead && isOverALead) {
        setLeads((leads) => {
            const activeIndex = leads.findIndex((l) => l.id === activeId);
            const overIndex = leads.findIndex((l) => l.id === overId);
            const activeLead = leads[activeIndex];
            const overLead = leads[overIndex];

            if (activeLead.status !== overLead.status) {
                 const updated = [...leads];
                 updated[activeIndex] = { ...activeLead, status: overLead.status };
                 return arrayMove(updated, activeIndex, overIndex);
            }
            
            return arrayMove(leads, activeIndex, overIndex);
        });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveLead(null);
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }),
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 h-[calc(100vh-280px)] overflow-x-auto pb-6 pt-2">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            accentColorClass={col.accent}
            leads={filteredLeads.filter(l => l.status === col.id)}
            onWhatsAppClick={handleWhatsAppClick}
            onCardClick={onCardClick}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeLead ? (
          <div className="opacity-90 scale-105 rotate-2">
             <KanbanCard lead={activeLead} onWhatsAppClick={handleWhatsAppClick} onClick={onCardClick} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
