'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { useCandidates } from '@/context/candidates-context';
import { useSpecialists } from '@/context/specialists-context';
import { useMemo } from 'react';
import { useDashboardFilter } from '@/context/dashboard-filter-context';
import { isWithinInterval } from 'date-fns';
import { safeParseDate, cn } from '@/lib/utils';

const chartConfig = {
  enrollments: {
    label: 'Matrículas',
    color: 'hsl(var(--chart-2))',
  },
  engaged: {
    label: 'Matrículas Engajadas',
    color: 'hsl(var(--chart-5))',
  },
};

export function SpecialistRankingChart() {
  const { candidates } = useCandidates();
  const { specialists } = useSpecialists();
  const { startDate, endDate } = useDashboardFilter();

  const { chartData, teamContributionPercentage } = useMemo(() => {
    if (!startDate || !endDate) return { chartData: [], teamContributionPercentage: 0 };
    
    const specialistNames = specialists.map(s => s.name);

    const periodCandidates = candidates.filter(c => {
      if (!c.enrollmentDate) return false;
      if (c.status !== 'Enrolled' && c.status !== 'Engaged' && !(c.status === 'Canceled' && c.enrollmentDate)) return false;
      const enrDate = safeParseDate(c.enrollmentDate);
      return enrDate && isWithinInterval(enrDate, { start: startDate, end: endDate });
    });
    
    const totalEnrollments = periodCandidates.length;
    if (totalEnrollments === 0) return { chartData: [], teamContributionPercentage: 0 };

    let teamEnrollments = 0;

    const performance = specialists.map(specialist => {
      const enrollmentsBySpecialist = periodCandidates.filter(
        c => c.specialist === specialist.name
      );
      
      const engagedEnrollmentsBySpecialist = periodCandidates.filter(
        c => c.specialist === specialist.name && c.firstPaymentPaid === true
      );

      teamEnrollments += enrollmentsBySpecialist.length;

      return {
        name: specialist.name.split(' ')[0],
        fullName: specialist.name,
        enrollments: enrollmentsBySpecialist.length,
        engaged: engagedEnrollmentsBySpecialist.length,
      };
    });

    const externalCandidates = periodCandidates.filter(
        c => c.specialist && !specialistNames.includes(c.specialist)
    );
    
    const externalPerformance: { [key: string]: { enrollments: number, engaged: number } } = {};
    externalCandidates.forEach(c => {
        if(c.specialist) {
            if (!externalPerformance[c.specialist]) {
              externalPerformance[c.specialist] = { enrollments: 0, engaged: 0 };
            }
            externalPerformance[c.specialist].enrollments++;
            if (c.firstPaymentPaid === true) {
              externalPerformance[c.specialist].engaged++;
            }
        }
    });

    const dataWithContribution = [...performance];
    Object.entries(externalPerformance).forEach(([name, data]) => {
      if (data.enrollments > 0) {
        dataWithContribution.push({
            name: `${name.split(' ')[0]}`,
            fullName: `${name}`,
            enrollments: data.enrollments,
            engaged: data.engaged,
        } as any);
      }
    });

    const finalData = dataWithContribution.map(p => {
        const contribution = totalEnrollments > 0 ? (p.enrollments / totalEnrollments) * 100 : 0;
        const engagementRate = p.enrollments > 0 ? (p.engaged / p.enrollments) * 100 : 0;
        return {
            ...p,
            contribution,
            engagementRate,
        }
    });
    
    const finalChartData = finalData
        .filter(p => p.enrollments > 5)
        .sort((a, b) => b.enrollments - a.enrollments);
        
    const calculatedTeamContribution = totalEnrollments > 0 ? (teamEnrollments / totalEnrollments) * 100 : 0;

    return { chartData: finalChartData, teamContributionPercentage: calculatedTeamContribution };

  }, [candidates, specialists, startDate, endDate]);

  if (!startDate || !endDate || chartData.length === 0) {
    return (
        <Card className="h-full min-h-[300px]">
            <CardHeader>
                <CardTitle>Ranking de Especialistas</CardTitle>
                <CardDescription>Apenas com mais de 5 matrículas.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-sm italic">Sem especialistas acima de 5 matrículas no período.</p>
            </CardContent>
        </Card>
    )
  }

  return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Ranking de Especialistas</CardTitle>
          <CardDescription className="text-xs">
            Exibindo apenas acima de 5 matrículas. Contribuição equipe: <strong>{teamContributionPercentage.toFixed(1)}%</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 p-2">
            <ChartContainer config={chartConfig} className="h-full w-full min-h-[300px]">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ right: 30, left: 0, top: 0, bottom: 5 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.2} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={5}
                    width={120}
                    style={{ fontSize: '11px', fontWeight: 600 }}
                  />
                  <XAxis dataKey="enrollments" type="number" style={{ fontSize: '10px' }} axisLine={false} tickLine={false} />
                  <ChartTooltip
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                    content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                                <div className="rounded-xl border bg-card p-3 text-card-foreground shadow-lg min-w-[200px]">
                                    <p className="font-bold text-sm mb-2 leading-tight">{data.fullName}</p>
                                    <div className="space-y-1.5 border-t border-border pt-2 pb-2">
                                        <p className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground">Matrículas:</span> 
                                            <span className="font-bold text-chart-2">{data.enrollments}</span>
                                        </p>
                                        <p className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground">Engajadas:</span> 
                                            <span className="font-bold text-chart-5">{data.engaged}</span>
                                        </p>
                                    </div>
                                    <div className="mt-1 pt-2 border-t border-border grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold">Engajam.</span>
                                            <span className="font-bold text-chart-5 text-sm">{data.engagementRate.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5 text-right">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold">Contrib.</span>
                                            <span className="font-bold text-primary text-sm">{data.contribution.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    }}
                  />
                  <Bar dataKey="enrollments" fill="var(--color-enrollments)" radius={[0, 2, 2, 0]} barSize={18} />
                  <Bar dataKey="engaged" fill="var(--color-engaged)" radius={[0, 2, 2, 0]} barSize={18} />
                </BarChart>
            </ChartContainer>
        </CardContent>
      </Card>
  );
}
