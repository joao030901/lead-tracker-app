
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAcademicPeriod } from '@/context/academic-period-context';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { DatePicker } from '@/components/ui/date-picker';
import { useAuditLog } from '@/context/audit-log-context';

export default function AcademicPeriodTab() {
    const { startDate, setStartDate, endDate, setEndDate } = useAcademicPeriod();
    const { logAction } = useAuditLog();
    const { toast } = useToast();

    const handleSave = () => {
        if (startDate && endDate && startDate > endDate) {
            toast({
                variant: 'destructive',
                title: 'Erro de Validação',
                description: 'A data de início não pode ser posterior à data de fim.',
            });
            return;
        }
        
        // The save is triggered by the context's useEffect
        
        const period = `${startDate ? format(startDate, 'dd/MM/yyyy') : 'N/A'} a ${endDate ? format(endDate, 'dd/MM/yyyy') : 'N/A'}`;
        logAction('Período Letivo Atualizado', `Período letivo atualizado para: ${period}`);
        toast({
            title: 'Período Salvo',
            description: 'O período letivo foi salvo com sucesso.',
        });
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Período Letivo</CardTitle>
                <CardDescription>
                    Defina o período para filtrar os dados nos dashboards.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="start-date">Data de Início</Label>
                        <DatePicker value={startDate} onSelect={setStartDate} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="end-date">Data de Fim</Label>
                        <DatePicker value={endDate} onSelect={setEndDate} />
                    </div>
                </div>
                <Button onClick={handleSave}>Salvar Período</Button>
            </CardContent>
        </Card>
    );
}
