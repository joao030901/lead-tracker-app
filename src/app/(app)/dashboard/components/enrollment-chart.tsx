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
  ChartLegendContent
} from '@/components/ui/chart';
import { useCandidates } from '@/context/candidates-context';
import { eachMonthOfInterval, endOfMonth, format, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDashboardFilter } from '@/context/dashboard-filter-context';
import { useMemo } from 'react';
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
};

export function EnrollmentChart() {
  const { candidates } = useCandidates();
  const { startDate, endDate } = useDashboardFilter();

  const chartData = useMemo(() => {
    if (!startDate || !endDate || startDate > endDate) return [];

    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    return months.map(monthStart => {
      const monthEnd = endOfMonth(monthStart);
      const monthName = format(monthStart, 'MMMM', { locale: ptBR });

      const registrations = candidates.filter(c => {
        const regDate = safeParseDate(c.registrationDate);
        return regDate && isWithinInterval(regDate, { start: monthStart, end: monthEnd });
      }).length;

      const enrollments = candidates.filter(c => {
        if (!c.enrollmentDate) return false;
        if (c.status !== 'Enrolled' && c.status !== 'Engaged' && !(c.status === 'Canceled' && c.enrollmentDate)) return false;
        const enrDate = safeParseDate(c.enrollmentDate);
        return enrDate && isWithinInterval(enrDate, { start: monthStart, end: monthEnd });
      }).length;
      
      const conv = registrations > 0 ? ((enrollments / registrations) * 100).toFixed(1) : "0.0";

      return {
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        registrations,
        enrollments,
        conversion: conv
      };
    });
  }, [candidates, startDate, endDate]);

  if (!startDate || !endDate || chartData.length === 0) {
    return (
      <Card className="h-full min-h-[300px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Inscrições vs. Matrículas</CardTitle>
          <CardDescription className="text-xs">Comparativo mensal comercial.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-sm italic">Aguardando dados para o período.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Inscrições vs. Matrículas</CardTitle>
        <CardDescription className="text-xs">Comparativo mensal comercial.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-2">
        <ChartContainer config={chartConfig} className="h-full w-full min-h-[250px]">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
                style={{ fontSize: '11px', fontWeight: 500 }}
              />
              <YAxis style={{ fontSize: '11px', fontWeight: 500 }} axisLine={false} tickLine={false} />
              <ChartTooltip
                cursor={false}
                content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                        return (
                            <div className="rounded-xl border bg-card p-3 text-card-foreground shadow-lg min-w-[180px]">
                                <p className="font-bold text-sm mb-2 leading-tight">{label}</p>
                                <div className="space-y-1.5 border-t border-border pt-2 pb-2">
                                    <p className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Inscrições:</span> 
                                        <span className="font-bold text-chart-1">{payload[0].value}</span>
                                    </p>
                                    <p className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Matrículas:</span> 
                                        <span className="font-bold text-chart-2">{payload[1].value}</span>
                                    </p>
                                </div>
                                <div className="mt-1 pt-2 border-t border-border">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold text-center">Conversão</span>
                                        <span className="font-bold text-chart-2 text-base text-center">{payload[0].payload.conversion}%</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    return null;
                }}
              />
              <ChartLegend content={<ChartLegendContent className="mt-2 text-[11px]" />} />
              <Bar dataKey="registrations" fill="var(--color-registrations)" radius={[2, 2, 0, 0]} barSize={30} />
              <Bar dataKey="enrollments" fill="var(--color-enrollments)" radius={[2, 2, 0, 0]} barSize={30} />
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
