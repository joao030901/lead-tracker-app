

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BellPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { useAgenda } from '@/context/agenda-context';
import { useCandidates } from '@/context/candidates-context';
import type { Candidate, AgendaTask, FollowUpEntry } from '@/lib/types';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export default function ScheduleReminderCard({ candidate }: { candidate: Candidate }) {
    const { setTasks } = useAgenda();
    const { setCandidates } = useCandidates();
    const { toast } = useToast();
    const [reminderDate, setReminderDate] = useState<Date>();
    const [reminderTime, setReminderTime] = useState('');
    const [reminderTitle, setReminderTitle] = useState(`Follow-up com ${candidate.name}`);
    const [reminderDescription, setReminderDescription] = useState('');

    const addFollowUpEntry = (entry: FollowUpEntry) => {
        const updatedHistory = [entry, ...(candidate.followUpHistory || [])];
        setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, followUpHistory: updatedHistory } : c));
    };

    const handleScheduleReminder = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reminderDate || !reminderTitle) {
            toast({
                title: 'Erro',
                description: 'Por favor, preencha a data e o título do lembrete.',
                variant: 'destructive',
            });
            return;
        }
        
        const formattedDate = format(reminderDate, 'dd/MM/yyyy');
        const timePart = reminderTime || 'o dia todo';

        const newTask: AgendaTask = {
            id: uuidv4(),
            date: format(reminderDate, 'yyyy-MM-dd'),
            title: reminderTitle,
            time: reminderTime || 'Dia todo',
            description: reminderDescription,
            priority: 'medium',
            completed: false,
            candidateId: candidate.id,
        };
        setTasks(prevTasks => [...prevTasks, newTask]);
        
        let note = `Lembrete agendado para ${formattedDate} (${timePart}): "${reminderTitle}"`;
        if (reminderDescription) {
            note += ` - Descrição: ${reminderDescription}`;
        }
        const newFollowUpEntry: FollowUpEntry = {
            id: uuidv4(),
            date: new Date().toISOString(),
            note: note,
            agendaTaskId: newTask.id,
        };
        addFollowUpEntry(newFollowUpEntry);

        // Reset form
        setReminderDate(undefined);
        setReminderTime('');
        setReminderTitle(`Follow-up com ${candidate.name}`);
        setReminderDescription('');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BellPlus />
                    Agendar Lembrete
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleScheduleReminder} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="reminder-title">Título do Lembrete</Label>
                        <Input
                            id="reminder-title"
                            value={reminderTitle}
                            onChange={(e) => setReminderTitle(e.target.value)}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="reminder-description">Descrição (opcional)</Label>
                        <Textarea
                            id="reminder-description"
                            value={reminderDescription}
                            onChange={(e) => setReminderDescription(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="reminder-date">Data</Label>
                            <DatePicker value={reminderDate} onSelect={setReminderDate} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reminder-time">Hora (opcional)</Label>
                            <Input
                                id="reminder-time"
                                type="time"
                                value={reminderTime}
                                onChange={(e) => setReminderTime(e.target.value)}
                            />
                        </div>
                    </div>
                    <Button type="submit" className="w-full">
                        Agendar na Agenda
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

