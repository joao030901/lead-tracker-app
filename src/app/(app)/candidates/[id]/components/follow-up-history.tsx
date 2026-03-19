
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Trash2 } from 'lucide-react';
import { useCandidates } from '@/context/candidates-context';
import type { Candidate, FollowUpEntry } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAgenda } from '@/context/agenda-context';
import { v4 as uuidv4 } from 'uuid';

export default function FollowUpHistoryCard({ candidate }: { candidate: Candidate }) {
    const { setCandidates } = useCandidates();
    const { toast } = useToast();
    const [newNote, setNewNote] = useState('');
    const { setTasks } = useAgenda();

    const addFollowUpEntry = (entry: FollowUpEntry) => {
        const updatedHistory = [entry, ...(candidate.followUpHistory || [])];
        setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, followUpHistory: updatedHistory } : c));
    };

    const handleAddNote = () => {
        if (!newNote.trim()) {
            toast({ title: 'Anotação vazia', description: 'Escreva algo antes de adicionar.', variant: 'destructive' });
            return;
        }

        const newEntry: FollowUpEntry = {
            id: uuidv4(),
            date: new Date().toISOString(),
            note: newNote.trim(),
        };

        addFollowUpEntry(newEntry);
        setNewNote('');
        toast({ title: 'Anotação adicionada!' });
    };

    const handleRemoveNote = (noteId: string) => {
        const entryToRemove = (candidate.followUpHistory || []).find(entry => entry.id === noteId);
        const updatedHistory = (candidate.followUpHistory || []).filter(entry => entry.id !== noteId);
        setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, followUpHistory: updatedHistory } : c));

        if (entryToRemove?.agendaTaskId) {
            setTasks(prevTasks => prevTasks.filter(task => task.id !== entryToRemove.agendaTaskId));
        }

        toast({ title: 'Anotação removida!' });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ClipboardList />
                    Histórico de Acompanhamento
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="new-note">Nova Anotação</Label>
                    <Textarea
                        id="new-note"
                        placeholder="Adicione uma nova anotação sobre o contato..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        rows={3}
                    />
                    <Button onClick={handleAddNote}>Adicionar Anotação</Button>
                </div>
                <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                    {candidate.followUpHistory && candidate.followUpHistory.length > 0 ? (
                        candidate.followUpHistory.map(entry => (
                            <div key={entry.id} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30 text-sm">
                                <div className="flex-1">
                                    <p className="font-semibold text-xs text-muted-foreground">
                                        {format(parseISO(entry.date), 'dd/MM/yyyy HH:mm')}
                                    </p>
                                    <p className="mt-1">{entry.note}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveNote(entry.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhum histórico de acompanhamento.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
