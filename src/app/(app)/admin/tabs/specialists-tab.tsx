
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSpecialists } from '@/context/specialists-context';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Check, Edit, X } from 'lucide-react';
import type { Specialist } from '@/lib/types';
import { useAuditLog } from '@/context/audit-log-context';

export default function SpecialistsTab() {
    const { specialists, setSpecialists } = useSpecialists();
    const { logAction } = useAuditLog();
    const [newSpecialistName, setNewSpecialistName] = useState('');
    const [editingSpecialistId, setEditingSpecialistId] = useState<string | null>(null);
    const [editingSpecialistName, setEditingSpecialistName] = useState('');
    const { toast } = useToast();

    const handleAddSpecialist = () => {
        if (!newSpecialistName.trim()) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'O nome do especialista não pode estar vazio.',
            });
            return;
        }

        const newSpecialist: Specialist = {
            id: uuidv4(),
            name: newSpecialistName.trim(),
        };

        const updatedSpecialists = [...specialists, newSpecialist];
        setSpecialists(updatedSpecialists);
        logAction('Especialista Adicionado', `Adicionado especialista: ${newSpecialist.name}`);
        setNewSpecialistName('');
        toast({
            title: 'Especialista Adicionado',
            description: `"${newSpecialist.name}" foi adicionado à equipe.`,
        });
    };

    const handleRemoveSpecialist = (id: string) => {
        const specialistToRemove = specialists.find(s => s.id === id);
        if (!specialistToRemove) return;
        const updatedSpecialists = specialists.filter(s => s.id !== id);
        setSpecialists(updatedSpecialists);
        logAction('Especialista Removido', `Removido especialista: ${specialistToRemove.name}`);
        toast({
            title: 'Especialista Removido',
            description: `"${specialistToRemove?.name}" foi removido da equipe.`,
        });
    };

    const handleEditSpecialist = (id: string, currentName: string) => {
        setEditingSpecialistId(id);
        setEditingSpecialistName(currentName);
    };

    const handleCancelEdit = () => {
        setEditingSpecialistId(null);
        setEditingSpecialistName('');
    };

    const handleSaveEdit = (id: string) => {
        if (!editingSpecialistName.trim()) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'O nome do especialista não pode estar vazio.',
            });
            return;
        }
        const originalSpecialist = specialists.find(s => s.id === id);
        const updatedSpecialists = specialists.map(s => 
            s.id === id ? { ...s, name: editingSpecialistName.trim() } : s
        );
        setSpecialists(updatedSpecialists);
        logAction('Especialista Atualizado', `Nome do especialista alterado de "${originalSpecialist?.name}" para "${editingSpecialistName.trim()}"`);
        toast({
            title: 'Especialista Atualizado',
            description: 'O nome do especialista foi atualizado.',
        });

        handleCancelEdit();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gerenciar Especialistas</CardTitle>
                <CardDescription>Adicione, remova ou edite os colaboradores do sistema.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 {specialists.map(specialist => (
                    <div key={specialist.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3">
                        {editingSpecialistId === specialist.id ? (
                            <div className="flex items-center gap-2 flex-1 w-full">
                                <Input 
                                    value={editingSpecialistName}
                                    onChange={(e) => setEditingSpecialistName(e.target.value)}
                                    className="flex-1"
                                />
                                <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(specialist.id)}>
                                    <Check className="h-5 w-5 text-green-500" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                                    <X className="h-5 w-5 text-destructive" />
                                </Button>
                            </div>
                        ) : (
                            <>
                                <p className="font-medium flex-1">{specialist.name}</p>
                                <div className="flex items-center gap-2 self-end sm:self-center">
                                     <Button variant="outline" size="sm" onClick={() => handleEditSpecialist(specialist.id, specialist.name)}>
                                        <Edit className="h-4 w-4 sm:mr-2" />
                                        <span className="hidden sm:inline">Editar</span>
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleRemoveSpecialist(specialist.id)}>Remover</Button>
                                </div>
                            </>
                        )}
                    </div>
                 ))}
                 <div className="flex flex-col sm:flex-row items-end gap-2 pt-4 border-t">
                    <div className="flex-1 w-full">
                        <Label htmlFor="new-specialist">Nome do Novo Especialista</Label>
                        <Input 
                            id="new-specialist" 
                            placeholder="ex. Ana Costa" 
                            value={newSpecialistName}
                            onChange={(e) => setNewSpecialistName(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleAddSpecialist} className="w-full sm:w-auto mt-2 sm:mt-0">Adicionar Especialista</Button>
                 </div>
            </CardContent>
        </Card>
    );
}
