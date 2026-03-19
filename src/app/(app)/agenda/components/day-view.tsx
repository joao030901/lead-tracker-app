
'use client';

import { useMemo, FC } from 'react';
import { useAgenda } from '@/context/agenda-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Info } from 'lucide-react';
import { format, isSameDay, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import type { AgendaTask } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const priorityClasses = {
    high: 'border-l-4 border-red-500',
    medium: 'border-l-4 border-yellow-500',
    low: 'border-l-4 border-blue-500',
};

const TaskItemWrapper: FC<{ task: AgendaTask; children: React.ReactNode }> = ({ task, children }) => {
  if (task.candidateId) {
    return <Link href={`/candidates/${task.candidateId}`}>{children}</Link>;
  }
  if (task.leadId) {
    return <Link href={`/leads/${task.leadId}`}>{children}</Link>;
  }
  return <>{children}</>;
};

interface DayViewProps {
    currentDate: Date;
}

export default function DayView({ currentDate }: DayViewProps) {
  const { tasks, setTasks } = useAgenda();
  const { toast } = useToast();

  const handleToggleComplete = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };
  
  const handleRemoveTask = (taskId: string) => {
    const taskToRemove = tasks.find(t => t.id === taskId);
    if (taskToRemove) {
      setTasks(tasks.filter(t => t.id !== taskId));
      toast({
        title: 'Tarefa Removida',
        description: `"${taskToRemove.title}" foi removida da sua agenda.`,
      });
    }
  };


  const tasksForDay = useMemo(() => {
    return tasks
      .filter(task => {
        try {
          const taskDate = parse(task.date, 'yyyy-MM-dd', new Date());
          return isSameDay(taskDate, currentDate);
        } catch {
          return false;
        }
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [tasks, currentDate]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividades do Dia</CardTitle>
        <CardDescription>{format(currentDate, "PPP", { locale: ptBR })}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 min-h-[400px]">
        {tasksForDay.length > 0 ? tasksForDay.map(task => (
          <TaskItemWrapper key={task.id} task={task}>
            <div className={cn("flex items-start gap-3 p-3 rounded-lg bg-muted/40 cursor-pointer", priorityClasses[task.priority], {'hover:bg-muted/80': task.candidateId || task.leadId})}>
              {!task.isInformational ? (
                <Checkbox 
                    id={`task-${task.id}`} 
                    checked={task.completed} 
                    onCheckedChange={(e) => e.stopPropagation()} 
                    onClick={(e) => handleToggleComplete(e, task.id)} 
                    className="mt-1" 
                />
              ) : (
                <div className="mt-1 h-4 w-4 shrink-0 flex items-center justify-center text-primary">
                    <Info className="h-4 w-4" />
                </div>
              )}
              <div className="flex-1">
                <label htmlFor={`task-${task.id}`} className={cn("font-medium cursor-pointer", {"line-through text-muted-foreground": task.completed})}>
                  {task.title}
                </label>
                <p className={cn("text-sm text-muted-foreground", {"line-through": task.completed})}>{task.time}</p>
                {task.description && (
                  <p className={cn("text-xs text-muted-foreground/80 mt-1", {"line-through": task.completed})}>{task.description}</p>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveTask(task.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </TaskItemWrapper>
        )) : (
          <div className="text-center text-muted-foreground py-8">Nenhuma tarefa para este dia.</div>
        )}
      </CardContent>
    </Card>
  );
}
