
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Goal } from '@/lib/types';
import { useGoals } from '@/context/goals-context';
import { useAuditLog } from '@/context/audit-log-context';

export function GoalsTab() {
    const { goals, setGoals } = useGoals();
    const { toast } = useToast();
    const { logAction } = useAuditLog();

    const handleGoalChange = (id: string, field: 'target', value: string) => {
        const numericValue = parseInt(value, 10);
        if (isNaN(numericValue) || numericValue < 0) return;

        setGoals(goals.map(goal => 
            goal.id === id ? { ...goal, [field]: numericValue } : goal
        ));
    };
    
    const getGoalLabel = (type: Goal['type']) => {
        switch (type) {
            case 'Registrations': return 'Inscrições';
            case 'Enrollments': return 'Matrículas';
            case 'Engagement': return 'Engajamento';
            default: return type;
        }
    }

    const handleUpdateGoal = (goal: Goal) => {
        setGoals(goals); 
        const goalType = getGoalLabel(goal.type);
        logAction('Meta Atualizada', `Meta de ${goalType} atualizada para ${goal.target}.`);
        toast({
            title: "Meta Atualizada",
            description: `A meta de ${goalType} foi atualizada.`
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gerenciar Metas</CardTitle>
                <CardDescription>Defina e acompanhe as metas comerciais da sua equipe.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {goals.map(goal => (
                    <div key={goal.id} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 items-end gap-4 p-4 border rounded-lg bg-muted/10">
                        <div className="space-y-1.5">
                            <Label htmlFor={`goal-type-${goal.id}`} className="text-xs text-muted-foreground">Tipo</Label>
                            <Input id={`goal-type-${goal.id}`} value={getGoalLabel(goal.type)} readOnly className="bg-muted/50" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor={`goal-target-${goal.id}`} className="text-xs text-muted-foreground">Meta</Label>
                            <Input 
                                id={`goal-target-${goal.id}`} 
                                type="number" 
                                value={goal.target || 0}
                                onChange={(e) => handleGoalChange(goal.id, 'target', e.target.value)} 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor={`goal-achieved-${goal.id}`} className="text-xs text-muted-foreground">Alcançado</Label>
                            <Input 
                                id={`goal-achieved-${goal.id}`} 
                                type="number" 
                                value={goal.achieved || 0}
                                readOnly
                                className="bg-muted/50"
                             />
                        </div>
                        <Button onClick={() => handleUpdateGoal(goal)} className="w-full">Salvar Meta</Button>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export default GoalsTab;
