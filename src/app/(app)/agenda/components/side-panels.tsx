'use client';

import { useMemo, FC, useState } from 'react';
import { useAgenda } from '@/context/agenda-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, ArrowRight, PlusCircle, Info } from 'lucide-react';
import { format, isSameDay, parse, isWithinInterval, startOfDay, endOfDay, addDays, endOfWeek, endOfMonth, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import type { AgendaTask } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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

interface SidePanelsProps {
    onNewTaskClick: () => void;
    selectedDate?: Date;
    currentDate: Date;
    view: 'day' | 'week' | 'month';
}

export default function SidePanels({ onNewTaskClick, selectedDate, currentDate, view }: SidePanelsProps) {
  const { tasks, setTasks } = useAgenda();
  const { toast } = useToast();
  const [taskToRemove, setTaskToRemove] = useState<AgendaTask | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const handleToggleComplete = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const promptRemoveTask = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation(); 
    e.preventDefault();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      if (task.recurrenceGroupId) {
        setTaskToRemove(task);
        setIsAlertOpen(true);
      } else {
        handleRemoveTask(taskId, 'single');
      }
    }
  };

  const handleRemoveTask = (taskId: string, type: 'single' | 'all') => {
    const taskToRemove = tasks.find(t => t.id === taskId);
    if (!taskToRemove) return;

    let updatedTasks = tasks;
    let toastMessage = `"${taskToRemove.title}" foi removida da sua agenda.`;

    if (type === 'single' || !taskToRemove.recurrenceGroupId) {
        updatedTasks = tasks.filter((task) => task.id !== taskId);
    } else { // type === 'all'
        const taskDate = parse(taskToRemove.date, 'yyyy-MM-dd', new Date());
        updatedTasks = tasks.filter(task => 
            !(task.recurrenceGroupId === taskToRemove.recurrenceGroupId && 
              parse(task.date, 'yyyy-MM-dd', new Date()) >= taskDate)
        );
        toastMessage = `Todas as futuras ocorrências de "${taskToRemove.title}" foram removidas.`;
    }

    setTasks(updatedTasks);
    toast({
      title: 'Tarefa Removida',
      description: toastMessage,
    });
    
    setIsAlertOpen(false);
    setTaskToRemove(null);
  };

  const tasksForSideList = useMemo(() => {
    const dateForList = view === 'day' ? currentDate : selectedDate;
    if (!dateForList) return [];
    
    return tasks
      .filter(task => {
        try {
          const taskDate = parse(task.date, 'yyyy-MM-dd', new Date());
          return isSameDay(taskDate, dateForList);
        } catch {
          return false;
        }
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [tasks, selectedDate, currentDate, view]);
  
  const upcomingTasks = useMemo(() => {
    const today = startOfDay(new Date());
    let rangeStart = addDays(today, 1);
    let rangeEnd;

    if (view === 'day') {
      if (!currentDate || !isValid(currentDate)) return [];
      rangeStart = addDays(currentDate, 1);
      rangeEnd = endOfDay(rangeStart);
    } else if (view === 'week') {
      if (!currentDate || !isValid(currentDate)) return [];
      rangeStart = addDays(today, 1);
      rangeEnd = endOfWeek(currentDate);
    } else { // month
      if (!currentDate || !isValid(currentDate)) return [];
      rangeStart = addDays(today, 1);
      rangeEnd = endOfMonth(currentDate);
    }
  
    if (!rangeEnd || rangeStart > rangeEnd) return [];
    
    return tasks.filter(task => {
        try {
            const taskDate = parse(task.date, 'yyyy-MM-dd', new Date());
            return isValid(taskDate) && isWithinInterval(taskDate, { start: rangeStart, end: rangeEnd }) && !task.completed;
        } catch { return false; }
    }).sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime() || a.time.localeCompare(b.time));
  }, [tasks, currentDate, view]);
  
  return (
    <>
    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent aria-describedby={undefined}>
            <AlertDialogHeader>
            <AlertDialogTitle>Remover Atividade Recorrente</AlertDialogTitle>
            <AlertDialogDescription>
                Você quer remover apenas esta atividade ou todas as futuras ocorrências de "{taskToRemove?.title}"?
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-wrap gap-2">
            <AlertDialogCancel onClick={() => setIsAlertOpen(false)}>Cancelar</AlertDialogCancel>
            <Button variant="outline" onClick={() => taskToRemove && handleRemoveTask(taskToRemove.id, 'single')}>
                Remover Somente Esta
            </Button>
            <AlertDialogAction onClick={() => taskToRemove && handleRemoveTask(taskToRemove.id, 'all')}>
                Remover Todas as Futuras
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    <div className="lg:col-span-1 space-y-8">
        <Card>
          <CardHeader>
              <div>
                  <CardTitle>Atividades do Dia</CardTitle>
                  <CardDescription>
                      {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : 'Selecione um dia'}
                  </CardDescription>
              </div>
          </CardHeader>
           <div className="px-6 pb-4 border-b">
                <Button onClick={onNewTaskClick} className="w-full shadow-md">
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Criar atividade
                </Button>
            </div>
          <CardContent className="space-y-3 max-h-[400px] overflow-y-auto pt-6">
              {tasksForSideList.length > 0 ? tasksForSideList.map(task => (
                  <TaskItemWrapper key={task.id} task={task}>
                      <div className={cn("flex items-start gap-3 p-3 rounded-lg bg-muted/40 cursor-pointer transition-colors", priorityClasses[task.priority], {'hover:bg-muted/80': task.candidateId || task.leadId})}>
                          {!task.isInformational ? (
                            <Checkbox 
                                id={`sidelist-task-${task.id}`} 
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
                          <div className="flex-1 overflow-hidden">
                               <label htmlFor={`sidelist-task-${task.id}`} className={cn("font-medium cursor-pointer block truncate", {"line-through text-muted-foreground": task.completed})}>
                                  {task.title}
                              </label>
                              <p className={cn("text-xs text-muted-foreground", {"line-through": task.completed})}>
                                  {isValid(parse(task.date, 'yyyy-MM-dd', new Date())) ? format(parse(task.date, 'yyyy-MM-dd', new Date()), 'dd/MM') : ''} - {task.time}
                              </p>
                               {task.description && (
                                  <p className={cn("text-[10px] text-muted-foreground/80 mt-1 line-clamp-2", {"line-through": task.completed})}>{task.description}</p>
                              )}
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={(e) => promptRemoveTask(e, task.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                      </div>
                  </TaskItemWrapper>
              )) : (
                  <div className="text-center text-muted-foreground py-8">Nenhuma tarefa para este dia.</div>
              )}
          </CardContent>
      </Card>
      <Card>
          <CardHeader>
               <CardTitle className="flex items-center gap-2 text-lg">
                 <ArrowRight className="h-5 w-5 text-primary"/>
                  Próximas Atividades
              </CardTitle>
              <CardDescription>
                  Compromissos pendentes.
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
              {upcomingTasks.length > 0 ? upcomingTasks.map(task => (
                  <TaskItemWrapper key={task.id} task={task}>
                      <div className={cn("flex items-start gap-3 p-3 rounded-lg bg-muted/40 cursor-pointer transition-colors", priorityClasses[task.priority], {'hover:bg-muted/80': task.candidateId || task.leadId})}>
                          {!task.isInformational ? (
                            <Checkbox 
                                id={`upcoming-task-${task.id}`} 
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
                          <div className="flex-1 overflow-hidden">
                              <label htmlFor={`upcoming-task-${task.id}`} className={cn("font-medium cursor-pointer block truncate", {"line-through text-muted-foreground": task.completed})}>
                                  {task.title}
                              </label>
                              <p className={cn("text-xs text-muted-foreground", {"line-through": task.completed})}>
                                  {isValid(parse(task.date, 'yyyy-MM-dd', new Date())) ? format(parse(task.date, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy') : ''} - {task.time}
                              </p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={(e) => promptRemoveTask(e, task.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                      </div>
                  </TaskItemWrapper>
              )) : (
                  <div className="text-center text-muted-foreground py-8">Nenhuma atividade futura encontrada.</div>
              )}
          </CardContent>
      </Card>
    </div>
    </>
  );
}
