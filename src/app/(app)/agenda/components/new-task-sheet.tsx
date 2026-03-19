'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { AgendaTask } from '@/lib/types';
import { format, addDays, addWeeks, addMonths, isWeekend, isBefore, isSameDay } from 'date-fns';
import { PlusCircle, Info } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useAgenda } from '@/context/agenda-context';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useAcademicPeriod } from '@/context/academic-period-context';

interface NewTaskSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    selectedDate: Date;
}

export default function NewTaskSheet({ isOpen, onOpenChange, selectedDate }: NewTaskSheetProps) {
    const { setTasks } = useAgenda();
    const { endDate } = useAcademicPeriod();
    const { toast } = useToast();
    
    const [taskDate, setTaskDate] = useState<Date | undefined>(selectedDate);
    const [taskTitle, setTaskTitle] = useState('');
    const [taskTime, setTaskTime] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [taskRecurrence, setTaskRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'intercalated'>('none');
    const [isInformational, setIsInformational] = useState(false);
    const [skipWeekends, setSkipWeekends] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTaskDate(selectedDate);
        }
    }, [isOpen, selectedDate]);

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskTitle || !taskDate) {
          toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'Por favor, preencha o título e a data da tarefa.',
          });
          return;
        }
    
        const newTasks: AgendaTask[] = [];
        const baseTask = {
            title: taskTitle,
            description: taskDescription,
            time: taskTime || 'Dia todo',
            priority: taskPriority,
            completed: false,
            isInformational,
        };
        
        const recurrenceGroupId = taskRecurrence !== 'none' ? uuidv4() : undefined;
    
        if (!skipWeekends || !isWeekend(taskDate)) {
            newTasks.push({
                ...baseTask,
                id: uuidv4(),
                date: format(taskDate, 'yyyy-MM-dd'),
                recurrenceGroupId,
            });
        }
    
        if (taskRecurrence !== 'none' && endDate) {
            let currentDateIterator = new Date(taskDate);
            const limitDate = new Date(endDate);

            while (isBefore(currentDateIterator, limitDate) || isSameDay(currentDateIterator, limitDate)) {
                switch (taskRecurrence) {
                    case 'daily':
                        currentDateIterator = addDays(currentDateIterator, 1);
                        break;
                    case 'intercalated':
                        currentDateIterator = addDays(currentDateIterator, 2);
                        break;
                    case 'weekly':
                        currentDateIterator = addWeeks(currentDateIterator, 1);
                        break;
                    case 'monthly':
                        currentDateIterator = addMonths(currentDateIterator, 1);
                        break;
                }

                if (isBefore(currentDateIterator, limitDate) || isSameDay(currentDateIterator, limitDate)) {
                    if (!skipWeekends || !isWeekend(currentDateIterator)) {
                        newTasks.push({
                            ...baseTask,
                            id: uuidv4(),
                            date: format(currentDateIterator, 'yyyy-MM-dd'),
                            recurrenceGroupId,
                        });
                    }
                } else {
                    break;
                }
            }
        }
    
        setTasks(prevTasks => [...prevTasks, ...newTasks]);
        
        toast({
          title: 'Tarefa Adicionada',
          description: taskRecurrence !== 'none' ? `"${taskTitle}" e suas repetições foram adicionadas.` : `"${taskTitle}" foi adicionado.`,
        });
    
        setTaskTitle('');
        setTaskTime('');
        setTaskDescription('');
        setTaskRecurrence('none');
        setIsInformational(false);
        setSkipWeekends(false);
        onOpenChange(false);
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col" aria-describedby={undefined}>
                <SheetHeader className="p-6 pb-2">
                    <SheetTitle>Adicionar Nova Atividade</SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1">
                    <form onSubmit={handleAddTask} className="space-y-4 p-6 pt-2 pb-10">
                        <div className="space-y-1.5">
                            <Label htmlFor="task-date">Data Inicial</Label>
                            <DatePicker value={taskDate} onSelect={setTaskDate} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="task-title">Título</Label>
                            <Input id="task-title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Ex: Ligar para o lead X" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="task-description">Descrição (opcional)</Label>
                            <Textarea id="task-description" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} placeholder="Detalhes da tarefa" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="task-time">Horário (opcional)</Label>
                            <Input id="task-time" type="time" value={taskTime} onChange={(e) => setTaskTime(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="task-priority">Prioridade</Label>
                            <Select value={taskPriority} onValueChange={(v) => setTaskPriority(v as any)}>
                                <SelectTrigger id="task-priority">
                                    <SelectValue placeholder="Selecione a prioridade" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Baixa</SelectItem>
                                    <SelectItem value="medium">Média</SelectItem>
                                    <SelectItem value="high">Alta</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="task-recurrence">Recorrência (até fim do período)</Label>
                            <Select value={taskRecurrence} onValueChange={(v) => setTaskRecurrence(v as any)}>
                                <SelectTrigger id="task-recurrence">
                                    <SelectValue placeholder="Selecione a recorrência" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Não repetir</SelectItem>
                                    <SelectItem value="daily">Diariamente</SelectItem>
                                    <SelectItem value="intercalated">Dia sim, dia não (intercalado)</SelectItem>
                                    <SelectItem value="weekly">Semanalmente</SelectItem>
                                    <SelectItem value="monthly">Mensalmente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg bg-primary/5 border-primary/20">
                                <Label htmlFor="task-informational" className="flex flex-col gap-1 cursor-pointer">
                                    <span className="flex items-center gap-2 font-bold text-primary"><Info className="h-4 w-4" /> Apenas Informativo</span>
                                    <span className="text-[10px] font-normal text-muted-foreground leading-tight">Não requer marcação de conclusão. Aparecerá apenas como evento no calendário.</span>
                                </Label>
                                <Switch
                                    id="task-informational"
                                    checked={isInformational}
                                    onCheckedChange={setIsInformational}
                                />
                            </div>

                            {taskRecurrence !== 'none' && (
                                <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg bg-muted/20">
                                    <Label htmlFor="skip-weekends" className="flex flex-col gap-1 cursor-pointer">
                                        <span>Ignorar finais de semana</span>
                                        <span className="text-[10px] font-normal text-muted-foreground">Não agendar tarefas aos sábados e domingos.</span>
                                    </Label>
                                    <Switch
                                        id="skip-weekends"
                                        checked={skipWeekends}
                                        onCheckedChange={setSkipWeekends}
                                    />
                                </div>
                            )}
                        </div>

                        <Button type="submit" className="w-full !mt-8 shadow-lg shadow-primary/20">
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Adicionar Atividade
                        </Button>
                    </form>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
