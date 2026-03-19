
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, Users, UserCheck, Percent, GitCompareArrows, Loader2, BarChart3, Building, XCircle, Info, FileDown } from 'lucide-react';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';
import { usePaidBonuses } from '@/context/paid-bonuses-context';
import type { Candidate, Goal } from '@/lib/types';
import { isWithinInterval, parseISO, format } from 'date-fns';
import { useLocation } from '@/context/location-context';
import { listLocations, readData } from '@/lib/actions';
import { safeParseDate, cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PoloStats {
  name: string;
  registrations: number;
  enrollments: number;
  engaged: number;
  conversionRate: number;
  engagementRate: number;
}

interface LocationStats {
  name: string;
  registrations: {
    achieved: number;
    target: number;
    percentage: number;
  };
  enrollments: {
    achieved: number;
    target: number;
    percentage: number;
  };
  engagement: {
    achieved: number;
    target: number;
    percentage: number;
    rate: number;
  };
  conversionRate: number;
}

const formatLocationName = (name: string) => {
    return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export default function CompareTab() {
  const [externalData, setExternalData] = useState<any[]>([]);
  const [localStats, setLocalStats] = useState<LocationStats[]>([]);
  const [isLoadingLocal, setIsLoadingLocal] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { paidBonuses, setPaidBonuses } = usePaidBonuses();
  const goals = paidBonuses.comparisonGoals || {};
  const { location: currentLocation } = useLocation();

  useEffect(() => {
    const fetchAllLocalStats = async () => {
      setIsLoadingLocal(true);
      try {
        const locations = await listLocations();
        const allStats = await Promise.all(
          locations.map(async (loc) => {
            const [candidates, goalsData, academicPeriod] = await Promise.all([
              readData<Candidate[]>('candidates.json', [], loc),
              readData<Goal[]>('goals.json', [], loc),
              readData<{ startDate: string | null, endDate: string | null }>('academic-period.json', { startDate: null, endDate: null }, loc),
            ]);

            const { startDate, endDate } = academicPeriod;
            
            let filteredCandidates = candidates;
            if(startDate && endDate) {
                 const start = parseISO(startDate);
                 const end = parseISO(endDate);
                 filteredCandidates = candidates.filter(c => {
                    const regDate = safeParseDate(c.registrationDate);
                    return regDate && isWithinInterval(regDate, { start, end });
                 });
            }

            const registrationsGoal = goalsData.find(g => g.type === 'Registrations');
            const enrollmentsGoal = goalsData.find(g => g.type === 'Enrollments');
            const engagementGoal = goalsData.find(g => g.type === 'Engagement');
            
            const achievedRegistrations = filteredCandidates.length;
            const targetRegistrations = registrationsGoal?.target || 0;
            const registrationPercentage = targetRegistrations > 0 ? (achievedRegistrations / targetRegistrations) * 100 : 0;
            
            const achievedEnrollments = filteredCandidates.filter(c => c.enrollmentDate && (c.status === 'Enrolled' || c.status === 'Engaged' || (c.status === 'Canceled' && c.enrollmentDate))).length;
            const targetEnrollments = enrollmentsGoal?.target || 0;
            const enrollmentPercentage = targetEnrollments > 0 ? (achievedEnrollments / targetEnrollments) * 100 : 0;

            const achievedEngagement = filteredCandidates.filter(c => c.enrollmentDate && c.firstPaymentPaid === true).length;
            const targetEngagement = engagementGoal?.target || 0;
            const engagementPercentage = targetEngagement > 0 ? (achievedEngagement / targetEngagement) * 100 : 0;

            const conversionRate = achievedRegistrations > 0 ? (achievedEnrollments / achievedRegistrations) * 100 : 0;
            const engagementRate = achievedEnrollments > 0 ? (achievedEngagement / achievedEnrollments) * 100 : 0;

            return {
              name: formatLocationName(loc),
              registrations: {
                achieved: achievedRegistrations,
                target: targetRegistrations,
                percentage: registrationPercentage,
              },
              enrollments: {
                achieved: achievedEnrollments,
                target: targetEnrollments,
                percentage: enrollmentPercentage,
              },
              engagement: {
                achieved: achievedEngagement,
                target: targetEngagement,
                percentage: engagementPercentage,
                rate: engagementRate,
              },
              conversionRate,
            };
          })
        );
        setLocalStats(allStats);
      } catch (error) {
        console.error("Failed to fetch local summary stats:", error);
      } finally {
        setIsLoadingLocal(false);
      }
    };

    fetchAllLocalStats();
  }, []);

  useEffect(() => {
    if (currentLocation) {
      const storedData = localStorage.getItem(`compare_data_${currentLocation}`);
      if (storedData) {
        try {
          setExternalData(JSON.parse(storedData));
        } catch (error) {
          localStorage.removeItem(`compare_data_${currentLocation}`);
        }
      }
    }
  }, [currentLocation]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          setExternalData(results.data);
          if (currentLocation) {
            localStorage.setItem(`compare_data_${currentLocation}`, JSON.stringify(results.data));
          }
          toast({ title: 'Arquivo carregado', description: `${results.data.length} linhas processadas.` });
        }
      });
    }
  };
  
  const poloStats = useMemo(() => {
    if (externalData.length === 0) return [];
    const stats: { [key: string]: PoloStats } = {};

    externalData.forEach(row => {
      const polo = row[11];
      const status = row[25];
      const engagedStatus = row[74];

      if (!polo || polo === 'NOME_DO_POLO' || polo.trim() === '') return;
      if (!stats[polo]) stats[polo] = { name: polo, registrations: 0, enrollments: 0, engaged: 0, conversionRate: 0, engagementRate: 0 };

      stats[polo].registrations++;

      const isEnrolled = status && typeof status === 'string' && (status.toLowerCase().includes('matrícula') || status.toLowerCase().includes('matriculado') || status.toLowerCase().includes('ativa') || status.toLowerCase() === 's') && !status.toLowerCase().includes('cancelad');
      
      const isEngaged = engagedStatus && typeof engagedStatus === 'string' && engagedStatus.toLowerCase() === 's';

      if (isEnrolled) {
        stats[polo].enrollments++;
        if (isEngaged) {
            stats[polo].engaged++;
        }
      } else if (isEngaged) {
        stats[polo].enrollments++;
        stats[polo].engaged++;
      }
    });

    return Object.values(stats).map(stat => ({
        ...stat,
        conversionRate: stat.registrations > 0 ? (stat.enrollments / stat.registrations) * 100 : 0,
        engagementRate: stat.enrollments > 0 ? (stat.engaged / stat.enrollments) * 100 : 0,
    })).sort((a, b) => {
        const goalsA = goals[a.name] || { registrations: 0, enrollments: 0, engaged: 0 };
        const goalsB = goals[b.name] || { registrations: 0, enrollments: 0, engaged: 0 };
        const perfA = goalsA.enrollments > 0 ? a.enrollments / goalsA.enrollments : 0;
        const perfB = goalsB.enrollments > 0 ? b.enrollments / goalsB.enrollments : 0;
        return perfB - perfA || b.enrollments - a.enrollments;
    });
  }, [externalData, goals]);
  
  const totals = useMemo(() => {
    const totalRegs = poloStats.reduce((acc, curr) => acc + curr.registrations, 0);
    const totalEnrs = poloStats.reduce((acc, curr) => acc + curr.enrollments, 0);
    const totalEng = poloStats.reduce((acc, curr) => acc + curr.engaged, 0);
    return { registrations: totalRegs, enrollments: totalEnrs, engaged: totalEng };
  }, [poloStats]);

  const handleGoalChange = (polo: string, type: 'registrations' | 'enrollments' | 'engaged', value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    const newGoals = { ...goals, [polo]: { ...(goals[polo] || { registrations: 0, enrollments: 0, engaged: 0 }), [type]: num } };
    setPaidBonuses(prev => ({ ...prev, comparisonGoals: newGoals }));
  };
  
  const handleExportPDF = () => {
    if (poloStats.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Importe um arquivo CSV para gerar o ranking.",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape' });
    
    doc.setFontSize(18);
    doc.text("Ranking de Desempenho Externo", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Exportado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);

    const head = [['Pos.', 'Unidade', 'Inscr.', 'Meta', '%', 'Matr.', 'Meta', '%', 'Engaj.', 'Meta', '%']];
    const body = poloStats.map((stat, index) => {
      const poloGoal = goals[stat.name] || { registrations: 0, enrollments: 0, engaged: 0 };
      
      const registrationGoal = poloGoal.registrations || 0;
      const registrationPercentage = registrationGoal > 0 ? (stat.registrations / registrationGoal) * 100 : 0;

      const enrollmentGoal = poloGoal.enrollments || 0;
      const enrollmentPercentage = enrollmentGoal > 0 ? (stat.enrollments / enrollmentGoal) * 100 : 0;
      
      const engagementGoal = poloGoal.engaged || 0;
      const engagementPercentage = engagementGoal > 0 ? (stat.engaged / engagementGoal) * 100 : 0;

      return [
        index + 1,
        stat.name,
        stat.registrations,
        registrationGoal,
        `${registrationPercentage.toFixed(1)}%`,
        stat.enrollments,
        enrollmentGoal,
        `${enrollmentPercentage.toFixed(1)}%`,
        stat.engaged,
        engagementGoal,
        `${engagementPercentage.toFixed(1)}%`,
      ];
    });

    autoTable(doc, {
      head: head,
      body: body,
      startY: 35,
      headStyles: { fillColor: [34, 153, 108], fontSize: 8, halign: 'center' },
      styles: { fontSize: 7, cellPadding: 1.5, halign: 'center' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        1: { halign: 'left' }
      }
    });

    doc.save(`ranking_desempenho_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast({ title: 'Ranking PDF Exportado', description: 'O ranking de desempenho foi baixado como PDF.' });
  };


  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
                <CardTitle className="text-2xl flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" /> {externalData.length > 0 ? "Comparativo de Desempenho Externo" : "Resumo Geral das Unidades Locais"}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    {externalData.length > 0 ? "Análise baseada na planilha importada manualmente." : "Consolidado de inscrições e matrículas registradas nas unidades deste sistema."}
                </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                {externalData.length > 0 && (
                    <Button onClick={() => { setExternalData([]); if (currentLocation) localStorage.removeItem(`compare_data_${currentLocation}`); }} variant="ghost" size="sm" className="text-destructive h-8 text-xs order-4 sm:order-1"><XCircle className="mr-2 h-3.5 w-3.5" /> Limpar</Button>
                )}
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" className="h-8 text-xs order-1 sm:order-2"><Upload className="mr-2 h-3.5 w-3.5 text-primary"/> Importar CSV</Button>
                {externalData.length > 0 && (
                   <div className="flex gap-2 order-2 sm:order-3">
                       <Button onClick={handleExportPDF} variant="outline" size="sm" className="h-8 text-xs">
                           <FileDown className="mr-2 h-3.5 w-3.5 text-primary" />
                           Baixar PDF
                       </Button>
                   </div>
                )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".csv" />
        </div>
      </CardHeader>

      <CardContent className="px-0">
         {externalData.length === 0 ? (
             isLoadingLocal ? <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {localStats.map((stat) => (
                        <Card key={stat.name} className="overflow-hidden border-primary/10 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="bg-primary/5 pb-4"><div className="flex items-center gap-2"><Building className="h-4 w-4 text-primary" /><CardTitle className="text-lg">{stat.name}</CardTitle></div></CardHeader>
                            <CardContent className="space-y-5 pt-6">
                                <div>
                                    <div className="flex justify-between items-baseline mb-1"><span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2"><Users className="h-3 w-3"/> Inscrições</span><span className="text-sm font-bold">{stat.registrations.achieved} / {stat.registrations.target}</span></div>
                                    <Progress value={stat.registrations.percentage} indicatorClassName="bg-chart-1" className="h-2" />
                                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">{stat.registrations.percentage.toFixed(1)}% da meta</p>
                                </div>
                                <div>
                                    <div className="flex justify-between items-baseline mb-1"><span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2"><UserCheck className="h-3 w-3"/> Matrículas</span><span className="text-sm font-bold">{stat.enrollments.achieved} / {stat.enrollments.target}</span></div>
                                    <Progress value={stat.enrollments.percentage} indicatorClassName="bg-chart-2" className="h-2" />
                                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">{stat.enrollments.percentage.toFixed(1)}% da meta</p>
                                </div>
                                <div>
                                    <div className="flex justify-between items-baseline mb-1"><span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2"><Percent className="h-3 w-3"/> Engajamento</span><span className="text-sm font-bold">{stat.engagement.achieved} / {stat.engagement.target}</span></div>
                                    <Progress value={stat.engagement.percentage} indicatorClassName="bg-chart-5" className="h-2"/>
                                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">{stat.engagement.percentage.toFixed(1)}% da meta</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                                    <div className="bg-muted/30 p-2 rounded-lg text-center"><span className="text-[10px] font-bold text-muted-foreground uppercase block">Conv.</span><p className="text-lg font-black text-primary">{stat.conversionRate.toFixed(1)}%</p></div>
                                    <div className="bg-muted/30 p-2 rounded-lg text-center"><span className="text-[10px] font-bold text-muted-foreground uppercase block">Engaj.</span><p className="text-lg font-black text-chart-5">{stat.engagement.rate.toFixed(1)}%</p></div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
             )
         ) : (
             <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="bg-blue-500/5 border-blue-500/20"><CardContent className="p-4 flex items-center gap-4"><div className="p-2 bg-blue-500/10 rounded-lg text-blue-600"><Users className="h-5 w-5" /></div><div><p className="text-[10px] font-bold uppercase text-muted-foreground">Inscrições</p><p className="text-2xl font-black">{totals.registrations}</p></div></CardContent></Card>
                    <Card className="bg-emerald-500/5 border-emerald-500/20"><CardContent className="p-4 flex items-center gap-4"><div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600"><UserCheck className="h-5 w-5" /></div><div><p className="text-[10px] font-bold uppercase text-muted-foreground">Matrículas</p><p className="text-2xl font-black">{totals.enrollments}</p></div></CardContent></Card>
                    <Card className="bg-amber-500/5 border-amber-500/20"><CardContent className="p-4 flex items-center gap-4"><div className="p-2 bg-amber-500/10 rounded-lg text-amber-600"><Percent className="h-5 w-5" /></div><div><p className="text-[10px] font-bold uppercase text-muted-foreground">Engajados</p><p className="text-2xl font-black">{totals.engaged}</p></div></CardContent></Card>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {poloStats.map((stat, index) => {
                        const pg = goals[stat.name] || { registrations: 0, enrollments: 0, engaged: 0 };
                        const regPerc = pg.registrations > 0 ? (stat.registrations/pg.registrations)*100 : 0;
                        const enrPerc = pg.enrollments > 0 ? (stat.enrollments/pg.enrollments)*100 : 0;
                        const engPerc = pg.engaged && pg.engaged > 0 ? (stat.engaged/pg.engaged)*100 : 0;

                        return (
                            <Card key={stat.name} className="shadow-sm hover:shadow-md transition-shadow overflow-hidden border-primary/10">
                                <CardHeader className="bg-primary/5 pb-4">
                                    <div className="flex items-center justify-between mb-4"><Badge variant="secondary" className="font-bold text-lg px-3 rounded-lg bg-primary text-primary-foreground">#{index + 1}</Badge><CardTitle className="text-xl flex-1 ml-4 truncate">{stat.name}</CardTitle></div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="space-y-1"><Label className="text-[9px] font-bold uppercase text-muted-foreground">Meta Inscr.</Label><Input type="number" value={pg.registrations || ''} onChange={(e) => handleGoalChange(stat.name, 'registrations', e.target.value)} className="h-8 text-xs font-bold" /></div>
                                        <div className="space-y-1"><Label className="text-[9px] font-bold uppercase text-muted-foreground">Meta Matr.</Label><Input type="number" value={pg.enrollments || ''} onChange={(e) => handleGoalChange(stat.name, 'enrollments', e.target.value)} className="h-8 text-xs font-bold" /></div>
                                        <div className="space-y-1"><Label className="text-[9px] font-bold uppercase text-muted-foreground">Meta Engaj.</Label><Input type="number" value={pg.engaged || ''} onChange={(e) => handleGoalChange(stat.name, 'engaged', e.target.value)} className="h-8 text-xs font-bold" /></div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-5 pt-6">
                                    <div><div className="flex justify-between text-[10px] mb-1 font-bold uppercase text-muted-foreground"><span>Inscrições</span><span>{stat.registrations} / {pg.registrations}</span></div><Progress value={regPerc} indicatorClassName="bg-chart-1" className="h-2" /><p className="text-[10px] text-muted-foreground mt-1 font-medium">{regPerc.toFixed(1)}% da meta</p></div>
                                    <div><div className="flex justify-between text-[10px] mb-1 font-bold uppercase text-muted-foreground"><span>Matrículas</span><span>{stat.enrollments} / {pg.enrollments}</span></div><Progress value={enrPerc} indicatorClassName="bg-chart-2" className="h-2" /><p className="text-[10px] text-muted-foreground mt-1 font-medium">{enrPerc.toFixed(1)}% da meta</p></div>
                                    <div><div className="flex justify-between text-[10px] mb-1 font-bold uppercase text-muted-foreground"><span>Engajados</span><span>{stat.engaged} / {pg.engaged || 0}</span></div><Progress value={engPerc} indicatorClassName="bg-chart-5" className="h-2" /><p className="text-[10px] text-muted-foreground mt-1 font-medium">{engPerc.toFixed(1)}% da meta</p></div>
                                    
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                                        <div className="bg-muted/30 p-2 rounded-lg text-center">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Conv.</span>
                                            <p className="text-lg font-black text-primary">{stat.conversionRate.toFixed(1)}%</p>
                                        </div>
                                        <div className="bg-muted/30 p-2 rounded-lg text-center">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Engaj.</span>
                                            <p className="text-lg font-black text-chart-5">{stat.engagementRate.toFixed(1)}%</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
             </div>
         )}
      </CardContent>
    </Card>
  );
}
