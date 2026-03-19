
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSpecialists } from '@/context/specialists-context';
import { useCandidates } from '@/context/candidates-context';
import { usePaidBonuses } from '@/context/paid-bonuses-context';
import { useAuditLog } from '@/context/audit-log-context';
import { Award, Download, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid } from 'date-fns';
import { DatePicker } from '@/components/ui/date-picker';
import { PaymentCycle } from '@/lib/types';


const initialCycles: PaymentCycle[] = Array(5).fill(null).map(() => ({ date: null, specialistValues: {} }));

export default function BonificationTab() {
    const { specialists } = useSpecialists();
    const { candidates } = useCandidates();
    const { paidBonuses, setPaidBonuses } = usePaidBonuses();
    const { logAction } = useAuditLog();
    const { toast } = useToast();
    const [isBonusMultiplierActive, setIsBonusMultiplierActive] = useState(paidBonuses?.isMetaBonusActive || false);

    const paymentCycles = useMemo(() => paidBonuses?.paymentCycles || initialCycles, [paidBonuses]);

    const BONIFICATION_INSCRIPTION = 15;
    const BONIFICATION_ENROLLMENT = 15;

     const handleCycleChange = (cycleIndex: number, field: 'date', value: Date | undefined) => {
        const newCycles = [...paymentCycles];
        newCycles[cycleIndex] = { ...newCycles[cycleIndex], [field]: value ? value.toISOString() : null };
        setPaidBonuses(prev => ({ ...prev, paymentCycles: newCycles }));
    };

    const handleCycleValueChange = (cycleIndex: number, specialistName: string, value: string) => {
        const newCycles = [...paymentCycles];
        const numericValue = Number(value);
        
        const updatedSpecialistValues = {
            ...(newCycles[cycleIndex].specialistValues || {}),
            [specialistName]: isNaN(numericValue) || numericValue < 0 ? 0 : numericValue
        };

        newCycles[cycleIndex] = { ...newCycles[cycleIndex], specialistValues: updatedSpecialistValues };
        setPaidBonuses(prev => ({ ...prev, paymentCycles: newCycles }));
    }

    const logCycleChange = (cycleIndex: number) => {
        const cycle = paymentCycles[cycleIndex];
        if (!cycle) return;
        const totalValue = Object.values(cycle.specialistValues || {}).reduce((sum, val) => sum + val, 0);
        logAction('Ciclo de Pagamento Atualizado', `Ciclo ${cycleIndex + 1} atualizado. Valor total: R$ ${totalValue}.`);
    };

    const handleBonusMultiplierToggle = (isActive: boolean) => {
      setIsBonusMultiplierActive(isActive);
      setPaidBonuses(prev => ({ ...prev, isMetaBonusActive: isActive }));
      logAction('Meta de Bônus Atualizada', `O bônus de meta foi ${isActive ? 'ativado' : 'desativado'} para todos.`);
    }
    
    const bonificationData = useMemo(() => {
        const qualifiedCandidates = candidates.filter(c => c.firstPaymentPaid === true);

        if (!specialists.length) {
            return [];
        }

        return specialists.map(specialist => {
            let bonus = 0;
            qualifiedCandidates.forEach(candidate => {
                if (candidate.registrationLoginName === specialist.name) {
                    bonus += BONIFICATION_INSCRIPTION;
                }
                if (candidate.specialist === specialist.name) {
                    bonus += BONIFICATION_ENROLLMENT;
                }
            });

            const metaMultiplier = isBonusMultiplierActive ? 2 : 1;
            const totalBonus = bonus * metaMultiplier;

            const totalPaid = paymentCycles.reduce((acc, cycle) => {
                return acc + (cycle.specialistValues?.[specialist.name] || 0);
            }, 0);
            
            const remainingBonus = totalBonus - totalPaid;

            return {
                specialistName: specialist.name,
                totalBonus,
                totalPaid,
                remainingBonus,
            };
        }).sort((a,b) => b.totalBonus - a.totalBonus);

    }, [specialists, candidates, paymentCycles, isBonusMultiplierActive]);
    
    const handleExportBonificationDetails = () => {
        const paidCandidates = candidates.filter(c => c.firstPaymentPaid === true);
        if (paidCandidates.length === 0) {
            toast({
                title: 'Nenhum dado para exportar',
                description: 'Não há candidatos com pagamento para gerar o relatório de bonificação.'
            });
            return;
        }

        const reportData = paidCandidates.map(candidate => {
            const inscriptionSpecialist = candidate.registrationLoginName || '';
            const enrollmentSpecialist = candidate.specialist || '';
            
            const inscriptionBonus = inscriptionSpecialist ? BONIFICATION_INSCRIPTION : 0;
            const enrollmentBonus = enrollmentSpecialist ? BONIFICATION_ENROLLMENT : 0;

            return {
                'Candidato': candidate.name,
                'Especialista Inscrição': inscriptionSpecialist,
                'Especialista Matrícula': enrollmentSpecialist,
                'Bônus Inscrição': inscriptionBonus,
                'Bônus Matrícula': enrollmentBonus,
            };
        });

        const csv = Papa.unparse(reportData, {
            delimiter: ';',
            header: true,
            columns: ['Candidato', 'Especialista Inscrição', 'Especialista Matrícula', 'Bônus Inscrição', 'Bônus Matrícula']
        });
        
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `relatorio_bonificacao_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: 'Relatório Exportado', description: 'O detalhamento da bonificação foi baixado.' });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle>Bonificação de Colaboradores</CardTitle>
                        <CardDescription>
                            Cálculo de bônus por inscrição e matrícula qualificada (1ª mensalidade paga).
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                         <div className="flex items-center gap-2">
                                <TrendingUp className={cn("h-5 w-5", isBonusMultiplierActive ? "text-green-500" : "text-muted-foreground")} />
                                <Label htmlFor="meta-geral" className="font-normal">Ativar Bônus de Meta (x2)</Label>
                                <Switch
                                    id="meta-geral"
                                    checked={isBonusMultiplierActive}
                                    onCheckedChange={handleBonusMultiplierToggle}
                                />
                            </div>
                        <Button onClick={handleExportBonificationDetails} variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Exportar Detalhes
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold text-lg mb-2">Ciclos de Pagamento</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 p-4 border rounded-lg">
                        {paymentCycles.map((cycle, index) => (
                             <div key={index} className="space-y-2">
                                <Label className="text-sm font-medium">Data do Ciclo {index + 1}</Label>
                                 <DatePicker
                                    value={cycle.date ? parseISO(cycle.date) : undefined}
                                    onSelect={(date) => handleCycleChange(index, 'date', date)}
                                />
                            </div>
                        ))}
                    </div>
                </div>


                {bonificationData.length > 0 ? bonificationData.map(data => (
                    <div key={data.specialistName} className="p-4 border rounded-lg space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <h3 className="font-semibold text-lg">{data.specialistName}</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                            <div className="bg-muted p-3 rounded-md">
                                <p className="text-sm text-muted-foreground">Total Acumulado (Bruto)</p>
                                <p className="text-2xl font-bold">{data.totalBonus.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                            </div>
                            <div className="bg-muted p-3 rounded-md">
                                <p className="text-sm text-muted-foreground">Total Pago</p>
                                <p className="text-2xl font-bold text-red-600">{data.totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                            </div>
                             <div className="bg-muted p-3 rounded-md col-span-1 md:col-span-2 lg:col-span-2">
                                <p className="text-sm text-muted-foreground">Saldo Restante</p>
                                <p className="text-2xl font-bold text-green-600">{data.remainingBonus.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium mb-2">Valores Pagos por Ciclo</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                               {paymentCycles.map((cycle, index) => (
                                    <div key={index} className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Ciclo {index + 1} ({cycle.date && isValid(parseISO(cycle.date)) ? format(parseISO(cycle.date), 'dd/MM/yy') : 'N/D'})</Label>
                                        <Input
                                            type="number"
                                            placeholder="Valor"
                                            value={cycle.specialistValues?.[data.specialistName] || ''}
                                            onChange={(e) => handleCycleValueChange(index, data.specialistName, e.target.value)}
                                            onBlur={() => logCycleChange(index)}
                                            />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )) : (
                     <div className="flex items-center justify-center min-h-[200px]">
                        <p className="text-muted-foreground italic">Nenhum bônus a ser calculado.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
