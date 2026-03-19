'use client';

import { useState, useMemo } from 'react';
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
} from '@/components/ui/chart';
import { useCandidates } from '@/context/candidates-context';
import { useAcademicPeriod } from '@/context/academic-period-context';
import { isWithinInterval } from 'date-fns';
import { Button } from '@/components/ui/button';
import { safeParseDate } from '@/lib/utils';

const chartConfig = {
  value: {
    label: 'Candidatos',
    color: 'hsl(var(--chart-3))',
  },
};

export function EnrollmentByEntryMethodChart() {
  const { candidates } = useCandidates();
  const { startDate, endDate } = useAcademicPeriod();
  const [dataType, setDataType] = useState<'enrollments' | 'registrations' | 'engaged'>('enrollments');

  const chartData = useMemo(() => {
    if (!startDate || !endDate) return [];
    
    const filteredCandidates = candidates.filter(c => {
      const regDate = safeParseDate(c.registrationDate);
      return regDate && isWithinInterval(regDate, { start: startDate, end: endDate });
    });

    const dataCandidates = 
      dataType === 'enrollments' ? filteredCandidates.filter(c => c.status === 'Enrolled' || c.status === 'Engaged' || (c.status === 'Canceled' && c.enrollmentDate))
      : dataType === 'engaged' ? filteredCandidates.filter(c => c.firstPaymentPaid === true)
      : filteredCandidates;

    const dataByMethod: { [key: string]: number } = {};

    dataCandidates.forEach(candidate => {
        const method = candidate.entryMethod || 'Não informado';
        dataByMethod[method] = (dataByMethod[method] || 0) + 1;
    });

    const total = dataCandidates.length;

    return Object.entries(dataByMethod)
        .map(([method, count]) => ({ 
            name: method, 
            value: count,
            perc: total > 0 ? ((count / total) * 100).toFixed(1) : "0.0"
        }))
        .sort((a, b) => b.value - a.value);
  }, [candidates, startDate, endDate, dataType]);
  
  if (!startDate || !endDate || chartData.length === 0) {
    return (
        <Card className="h-full min-h-[300px]">
            <CardHeader>
                <CardTitle>Dados por Ingresso</CardTitle>
                <CardDescription>Defina um período letivo.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-sm italic">Sem dados de ingresso para o período.</p>
            </CardContent>
        </Card>
    )
  }

  const getTitle = () => {
    switch(dataType) {
        case 'enrollments': return 'Matrículas';
        case 'registrations': return 'Inscrições';
        case 'engaged': return 'Engajados';
        default: return 'Dados';
    }
  }

  return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pr-16">
              <div>
                <CardTitle className="text-lg">{getTitle()} por Ingresso</CardTitle>
                <CardDescription className="text-xs">Distribuição por método de entrada.</CardDescription>
              </div>
               <div className="flex gap-1 rounded-lg bg-muted p-1 w-full sm:w-auto overflow-x-auto">
                <Button size="sm" variant={dataType === 'registrations' ? 'default' : 'ghost'} onClick={() => setDataType('registrations')} className="flex-1 text-xs h-10 px-4 font-bold">Insc.</Button>
                <Button size="sm" variant={dataType === 'enrollments' ? 'default' : 'ghost'} onClick={() => setDataType('enrollments')} className="flex-1 text-xs h-10 px-4 font-bold">Matr.</Button>
                <Button size="sm" variant={dataType === 'engaged' ? 'default' : 'ghost'} onClick={() => setDataType('engaged')} className="flex-1 text-xs h-10 px-4 font-bold">Eng.</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-2">
            <ChartContainer config={chartConfig} className="h-full w-full min-h-[250px]">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ left: 10, right: 30, top: 0, bottom: 5 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.2} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    width={120}
                    style={{ fontSize: '11px', fontWeight: 500 }}
                  />
                  <XAxis type="number" style={{ fontSize: '11px' }} axisLine={false} tickLine={false} />
                  <ChartTooltip
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                    content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                                <div className="rounded-xl border bg-card p-3 text-card-foreground shadow-lg min-w-[180px]">
                                    <p className="font-bold text-sm mb-2 leading-tight">{label}</p>
                                    <div className="space-y-1.5 border-t border-border pt-2 pb-2">
                                        <p className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground">Quantidade:</span> 
                                            <span className="font-bold">{data.value}</span>
                                        </p>
                                        <p className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground">Representatividade:</span> 
                                            <span className="font-bold text-primary">{data.perc}%</span>
                                        </p>
                                    </div>
                                    <div className="mt-1 pt-2 border-t border-border">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold text-center">Filtro Ativo</span>
                                            <span className="font-bold text-primary text-sm text-center">{getTitle()}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="var(--color-value)"
                    radius={[0, 4, 4, 0]}
                    barSize={24}
                  />
                </BarChart>
            </ChartContainer>
        </CardContent>
      </Card>
  );
}
