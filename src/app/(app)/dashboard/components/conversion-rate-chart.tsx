'use client';

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
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
} from '@/components/ui/chart';
import { useCandidates } from '@/context/candidates-context';
import { eachMonthOfInterval, endOfMonth, format, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAcademicPeriod } from '@/context/academic-period-context';
import { useMemo } from 'react';
import { safeParseDate } from '@/lib/utils';

const chartConfig = {
  rate: {
    label: 'Taxa de Conversão',
    color: 'hsl(var(--chart-2))',
  },
};

export function ConversionRateChart() {
  const { candidates } = useCandidates();
  const { startDate, endDate } = useAcademicPeriod();

  const chartData = useMemo(() => {
    if (!startDate || !endDate || startDate > endDate) return [];

    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    return months.map(monthStart => {
      const monthEnd = endOfMonth(monthStart);
      const monthName = format(monthStart, 'MMMM', { locale: ptBR });

      const registrationsInMonth = candidates.filter(c => {
        const regDate = safeParseDate(c.registrationDate);
        return regDate && isWithinInterval(regDate, { start: monthStart, end: monthEnd });
      }).length;

      const enrollmentsInMonth = candidates.filter(c => {
        if (!c.enrollmentDate) return false;
        if (c.status !== 'Enrolled' && c.status !== 'Engaged' && !(c.status === 'Canceled' && c.enrollmentDate)) return false;
        const enrDate = safeParseDate(c.enrollmentDate);
        return enrDate && isWithinInterval(enrDate, { start: monthStart, end: monthEnd });
      }).length;
      
      const rate = registrationsInMonth > 0
        ? (enrollmentsInMonth / registrationsInMonth) * 100
        : 0;

      return {
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        rate: parseFloat(rate.toFixed(1)),
        regs: registrationsInMonth,
        enrs: enrollmentsInMonth,
      };
    });
  }, [candidates, startDate, endDate]);

  if (!startDate || !endDate || chartData.length === 0) {
    return (
      <Card className="h-full flex flex-col min-h-[300px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Taxa de Conversão Mensal (%)</CardTitle>
          <CardDescription className="text-xs">Conversão de inscritos em matrículas.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center p-2">
          <p className="text-muted-foreground text-xs italic">Sem dados suficientes para o período.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Taxa de Conversão Mensal (%)</CardTitle>
        <CardDescription className="text-xs">Conversão de inscritos em matrículas.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-2">
        <ChartContainer config={chartConfig} className="h-full w-full min-h-[250px]">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={(value) => value.slice(0, 3)}
              style={{ fontSize: '11px', fontWeight: 500 }}
            />
            <YAxis suffix="%" style={{ fontSize: '11px', fontWeight: 500 }} axisLine={false} tickLine={false} />
            <ChartTooltip
              cursor={false}
              content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                          <div className="rounded-xl border bg-card p-3 text-card-foreground shadow-lg min-w-[180px]">
                              <p className="font-bold text-sm mb-2 leading-tight">{label}</p>
                              <div className="space-y-1.5 border-t border-border pt-2 pb-2">
                                  <p className="flex justify-between items-center text-xs">
                                      <span className="text-muted-foreground">Inscrições:</span> 
                                      <span className="font-bold">{data.regs}</span>
                                  </p>
                                  <p className="flex justify-between items-center text-xs">
                                      <span className="text-muted-foreground">Matrículas:</span> 
                                      <span className="font-bold">{data.enrs}</span>
                                  </p>
                              </div>
                              <div className="mt-1 pt-2 border-t border-border">
                                  <div className="flex flex-col gap-0.5">
                                      <span className="text-[10px] text-muted-foreground uppercase font-bold text-center">Taxa de Conversão</span>
                                      <span className="font-bold text-chart-2 text-base text-center">{data.rate}%</span>
                                  </div>
                              </div>
                          </div>
                      );
                  }
                  return null;
              }}
            />
            <Line
              dataKey="rate"
              type="monotone"
              stroke="var(--color-rate)"
              strokeWidth={3}
              dot={{ r: 4, fill: "var(--color-rate)", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
