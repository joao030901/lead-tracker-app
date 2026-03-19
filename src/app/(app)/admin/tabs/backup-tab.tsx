
'use client';

import { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSpecialists } from '@/context/specialists-context';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download } from 'lucide-react';
import { useGoals } from '@/context/goals-context';
import { useAcademicPeriod } from '@/context/academic-period-context';
import { parseISO } from 'date-fns';
import { useHolidays } from '@/context/holidays-context';
import { useAgenda } from '@/context/agenda-context';
import { useTemplates } from '@/context/templates-context';
import { useCandidates } from '@/context/candidates-context';
import { usePaidBonuses } from '@/context/paid-bonuses-context';
import { useAuditLog } from '@/context/audit-log-context';
import { useLocation } from '@/context/location-context';
import { useLeads } from '@/context/leads-context';

export default function BackupTab() {
    const { specialists } = useSpecialists();
    const { goals } = useGoals();
    const { holidays } = useHolidays();
    const { tasks } = useAgenda();
    const { templates } = useTemplates();
    const { startDate, setStartDate, endDate, setEndDate } = useAcademicPeriod();
    const { paidBonuses, setPaidBonuses } = usePaidBonuses();
    const { candidates, setCandidates } = useCandidates();
    const { leads, setLeads } = useLeads();
    const { logs, logAction } = useAuditLog();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { location } = useLocation();

    const handleExport = () => {
        const backupData = {
            specialists,
            goals,
            holidays,
            tasks,
            templates,
            candidates,
            leads,
            paidBonuses,
            logs,
            academicPeriod: {
                startDate: startDate ? startDate.toISOString() : null,
                endDate: endDate ? endDate.toISOString() : null,
            },
            version: 1,
            location,
        };

        const dataStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `leadsuni_backup_${location}.json`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        logAction('Backup Exportado', 'Backup completo dos dados exportado.');
        toast({
            title: 'Backup Exportado',
            description: 'Seu arquivo de backup foi baixado com sucesso.',
        });
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File is not a valid text file.");
                
                const data = JSON.parse(text);

                if (!data.version || !data.specialists || !data.goals || !data.holidays || !data.academicPeriod) {
                    throw new Error("Arquivo de backup inválido ou corrompido.");
                }

                if (data.location !== location) {
                     throw new Error(`Este backup é da unidade "${data.location}". Você está na unidade "${location}".`);
                }
                
                tasks.splice(0, tasks.length, ...(data.tasks || []));
                templates.splice(0, templates.length, ...(data.templates || []));
                specialists.splice(0, specialists.length, ...(data.specialists || []));
                goals.splice(0, goals.length, ...(data.goals.map((g: any) => ({id: g.id, type: g.type, target: g.target})))); // reset achieved
                holidays.splice(0, holidays.length, ...(data.holidays || []));
                candidates.splice(0, candidates.length, ...(data.candidates || []));
                leads.splice(0, leads.length, ...(data.leads || []));
                
                setPaidBonuses(data.paidBonuses || {});
                
                const newStartDate = data.academicPeriod.startDate ? parseISO(data.academicPeriod.startDate) : undefined;
                const newEndDate = data.academicPeriod.endDate ? parseISO(data.academicPeriod.endDate) : undefined;
                setStartDate(newStartDate);
                setEndDate(newEndDate);

                logAction('Dados Importados', 'Dados restaurados a partir de um arquivo de backup.');
                toast({
                    title: 'Backup Importado',
                    description: 'Seus dados foram restaurados com sucesso!',
                });

            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'Erro na Importação',
                    description: error.message || 'Não foi possível ler o arquivo de backup.',
                });
            } finally {
                if(fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Backup e Restauração</CardTitle>
                <CardDescription>
                    Salve uma cópia de segurança dos seus dados ou restaure a partir de um arquivo.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Exporte todos os seus dados da unidade atual para um único arquivo JSON. Você pode importar este arquivo mais tarde para restaurar o estado da aplicação.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={handleExport} className="w-full sm:w-auto">
                        <Download className="mr-2 h-4 w-4" />
                        Exportar Backup
                    </Button>
                    <Button variant="outline" onClick={handleImportClick} className="w-full sm:w-auto">
                         <Upload className="mr-2 h-4 w-4" />
                        Importar Backup
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="application/json"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
