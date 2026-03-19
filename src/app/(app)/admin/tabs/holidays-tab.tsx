
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { RefreshCw, Calendar } from 'lucide-react';
import type { Holiday } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { useHolidays } from '@/context/holidays-context';
import { useAuditLog } from '@/context/audit-log-context';
import { DatePicker } from '@/components/ui/date-picker';
import { ptBR } from 'date-fns/locale';

export default function HolidaysTab() {
    const { holidays, setHolidays } = useHolidays();
    const { logAction } = useAuditLog();
    const [newHolidayName, setNewHolidayName] = useState('');
    const [newHolidayDate, setNewHolidayDate] = useState<Date | undefined>();
    const [isFetching, setIsFetching] = useState(false);
    const { toast } = useToast();

    const handleAddHoliday = () => {
        if (!newHolidayName.trim() || !newHolidayDate) {
             toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Nome e data do feriado são obrigatórios.',
            });
            return;
        }
        const newHoliday: Holiday = {
            id: uuidv4(),
            name: newHolidayName,
            date: format(newHolidayDate, 'yyyy-MM-dd'),
        };
        const updatedHolidays = [...holidays, newHoliday].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setHolidays(updatedHolidays);
        logAction('Feriado Adicionado', `Adicionado feriado: ${newHoliday.name} em ${format(newHolidayDate, 'dd/MM/yyyy')}`);
        setNewHolidayName('');
        setNewHolidayDate(undefined);
        toast({
            title: 'Feriado Adicionado',
            description: `"${newHoliday.name}" foi adicionado.`,
        });
    };

    const handleRemoveHoliday = (id: string) => {
        const holidayToRemove = holidays.find(h => h.id === id);
        if (!holidayToRemove) return;
        const updatedHolidays = holidays.filter(h => h.id !== id);
        setHolidays(updatedHolidays);
        logAction('Feriado Removido', `Removido feriado: ${holidayToRemove.name}`);
         toast({
            title: 'Feriado Removido',
            description: `"${holidayToRemove?.name}" foi removido.`,
        });
    };
    
    const handleFetchNationalHolidays = async () => {
        setIsFetching(true);
        const year = new Date().getFullYear();
        try {
            const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
            if (!response.ok) {
                throw new Error('Falha ao buscar feriados.');
            }
            const nationalHolidays: {date: string, name: string}[] = await response.json();
            
            const newHolidays = nationalHolidays
                .filter(nh => !holidays.some(h => h.date === nh.date))
                .map(nh => ({
                    id: uuidv4(),
                    name: nh.name,
                    date: nh.date
                }));

            if (newHolidays.length === 0) {
                 toast({
                    title: 'Nenhum novo feriado',
                    description: 'Sua lista de feriados já está atualizada.',
                });
                return;
            }
            
            const updatedHolidays = [...holidays, ...newHolidays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setHolidays(updatedHolidays);
            logAction('Sincronização de Feriados', `Sincronizados ${newHolidays.length} feriados nacionais.`);

            toast({
                title: 'Feriados Sincronizados',
                description: `${newHolidays.length} feriados nacionais foram adicionados.`,
            });

        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro na Sincronização',
                description: (error as Error).message || 'Não foi possível buscar os feriados nacionais.',
            });
        } finally {
            setIsFetching(false);
        }
    };


    return (
        <Card>
            <CardHeader>
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle>Gerenciar Feriados</CardTitle>
                        <CardDescription>Defina os dias não úteis para cálculos precisos.</CardDescription>
                    </div>
                    <Button onClick={handleFetchNationalHolidays} disabled={isFetching} variant="outline" className="w-full sm:w-auto">
                        <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                        Sincronizar Feriados
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {holidays.map(holiday => (
                    <div key={holiday.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg gap-2">
                        <div className="flex-1 min-w-[150px]">
                            <p className="font-medium">{holiday.name}</p>
                            <p className="text-sm text-muted-foreground">{format(parseISO(holiday.date), "dd/MM/yyyy", { locale: ptBR })}</p>
                        </div>
                         <Button variant="destructive" size="sm" onClick={() => handleRemoveHoliday(holiday.id)} className="shrink-0 self-end sm:self-center">
                            Remover
                        </Button>
                    </div>
                ))}
                 <div className="flex flex-col sm:flex-row items-end gap-2 pt-4 border-t">
                    <div className="flex-1 w-full">
                        <Label htmlFor="new-holiday-name">Nome do Feriado</Label>
                        <Input id="new-holiday-name" value={newHolidayName} onChange={e => setNewHolidayName(e.target.value)} placeholder="ex. Aniversário da Cidade" />
                    </div>
                     <div className="flex-1 w-full">
                        <Label htmlFor="new-holiday-date">Data</Label>
                        <DatePicker value={newHolidayDate} onSelect={setNewHolidayDate} />
                    </div>
                    <Button onClick={handleAddHoliday} className="w-full sm:w-auto mt-2 sm:mt-0">Adicionar Feriado</Button>
                 </div>
            </CardContent>
        </Card>
    )
}
