'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer, ChartTooltip, ChartLegend, ChartLegendContent,
} from '@/components/ui/chart';
import { useCandidates } from '@/context/candidates-context';
import { useMemo } from 'react';
import { useAcademicPeriod } from '@/context/academic-period-context';
import { isWithinInterval } from 'date-fns';
import { safeParseDate } from '@/lib/utils';

const chartConfig = {
  registrations: {
    label: 'Inscrições',
    color: 'hsl(var(--chart-1))',
  },
  enrollments: {
    label: 'Matrículas',
    color: 'hsl(var(--chart-2))',
  },
  engaged: {
    label: 'Engajados',
    color: 'hsl(var(--chart-5))',
  },
};

export function PerformanceByCityChart() {
  const { candidates } = useCandidates();
  const { startDate, endDate } = useAcademicPeriod();

  const chartData = useMemo(() => {
    if (!startDate || !endDate) return [];
    
    const filteredCandidates = candidates.filter(c => {
        const regDate = safeParseDate(c.registrationDate);
        return regDate && isWithinInterval(regDate, { start: startDate, end: endDate });
    });

    const performanceByCity: { [key: string]: { registrations: number, enrollments: number, engaged: number } } = {};

    const candidatesWithCity = filteredCandidates.filter(candidate => candidate.city);

    candidatesWithCity.forEach(candidate => {
        const city = candidate.city!; 
        if (!performanceByCity[city]) {
            performanceByCity[city] = { registrations: 0, enrollments: 0, engaged: 0 };
        }
        performanceByCity[city].registrations += 1;
        
        let isEnrolledInPeriod = false;
        if (candidate.status === 'Enrolled' || candidate.status === 'Engaged' || (candidate.status === 'Canceled' && candidate.enrollmentDate)) {
            if(candidate.enrollmentDate) {
                const enrollmentDate = safeParseDate(candidate.enrollmentDate);
                if (enrollmentDate && isWithinInterval(enrollmentDate, { start: startDate, end: endDate })) {
                    performanceByCity[city].enrollments += 1;
                    isEnrolledInPeriod = true;
                }
            }
        }
        
        if (isEnrolledInPeriod && (candidate.firstPaymentPaid === true || candidate.status === 'Engaged')) {
            performanceByCity[city].engaged += 1;
        }
    });

    return Object.entries(performanceByCity)
        .map(([city, data]) => {
            const conversionRate = data.registrations > 0 ? (data.enrollments / data.registrations) * 100 : 0;
            const engagementRate = data.enrollments > 0 ? (data.engaged / data.enrollments) * 100 : 0;
            return {
                name: city,
                ...data,
                conversionRate: conversionRate.toFixed(1),
                engagementRate: engagementRate.toFixed(1),
            }
        })
        .sort((a, b) => b.registrations - a.registrations)
        .slice(0, 10);
  }, [candidates, startDate, endDate]);

  if (!startDate || !endDate || chartData.length === 0) {
    return (
        <Card className="h-full min-h-[300px]">
            <CardHeader>
                <CardTitle>Top 10 Cidades</CardTitle>
                <CardDescription>Defina um período letivo.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-sm italic">Sem dados de cidades registrados.</p>
            </CardContent>
        </Card>
    )
  }

  return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Top 10 Cidades</CardTitle>
          <CardDescription className="text-xs truncate">
            Desempenho por volume de inscritos.
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
                    width={180}
                    style={{ fontSize: '10px', fontWeight: 600 }}
                    tickFormatter={(value) => value.length > 25 ? value.substring(0, 23) + '...' : value}
                  />
                  <XAxis type="number" style={{ fontSize: '10px' }} axisLine={false} tickLine={false} />
                  <ChartTooltip
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                    content={({ active, payload, label }) => {
                           if (active && payload && payload.length) {
                                return (
                                    <div className="bg-zinc-950 text-zinc-50 border border-zinc-800 p-3 rounded-xl shadow-2xl min-w-[180px]">
                                        <p className="font-bold text-sm mb-2 leading-tight">{label}</p>
                                        <div className="space-y-1.5 border-t border-zinc-800 pt-2 pb-2">
                                            <p className="flex justify-between items-center text-xs">
                                                <span className="text-zinc-400">Inscrições:</span> 
                                                <span className="font-bold text-emerald-400">{payload[0].value}</span>
                                            </p>
                                            <p className="flex justify-between items-center text-xs">
                                                <span className="text-zinc-400">Matrículas:</span> 
                                                <span className="font-bold text-blue-400">{payload[1].value}</span>
                                            </p>
                                            <p className="flex justify-between items-center text-xs">
                                                <span className="text-zinc-400">Engajados:</span> 
                                                <span className="font-bold text-amber-400">{payload[2].value}</span>
                                            </p>
                                        </div>
                                        <div className="mt-1 pt-2 border-t border-zinc-800 grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] text-zinc-500 uppercase font-bold">Conv.</span>
                                                <span className="font-bold text-emerald-500 text-sm">{payload[0].payload.conversionRate}%</span>
                                            </div>
                                            <div className="flex flex-col gap-0.5 text-right">
                                                <span className="text-[10px] text-zinc-500 uppercase font-bold">Engaj.</span>
                                                <span className="font-bold text-amber-500 text-sm">{payload[0].payload.engagementRate}%</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                  />
                  <ChartLegend content={<ChartLegendContent className="mt-2 text-[11px]" />} />
                  <Bar dataKey="registrations" fill="var(--color-registrations)" radius={[0, 2, 2, 0]} barSize={18} />
                  <Bar dataKey="enrollments" fill="var(--color-enrollments)" radius={[0, 2, 2, 0]} barSize={18} />
                  <Bar dataKey="engaged" fill="var(--color-engaged)" radius={[0, 2, 2, 0]} barSize={18} />
                </BarChart>
            </ChartContainer>
        </CardContent>
      </Card>
  );
}
