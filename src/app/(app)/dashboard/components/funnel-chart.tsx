'use client';

import { useMemo } from 'react';
import { Funnel, FunnelChart as RechartsFunnelChart, Tooltip, LabelList, Cell } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
} from '@/components/ui/chart';
import { useDashboardFilter } from '@/context/dashboard-filter-context';
import { useCandidates } from '@/context/candidates-context';
import { isWithinInterval } from 'date-fns';
import { safeParseDate } from '@/lib/utils';

const chartConfig = {
  inscritos: {
    label: 'Inscritos',
    color: 'hsl(var(--chart-1))',
  },
  matriculados: {
    label: 'Matriculados',
    color: 'hsl(var(--chart-2))',
  },
  engajados: {
    label: 'Engajados',
    color: 'hsl(var(--chart-5))',
  },
  cancelados: {
    label: 'Cancelados',
    color: 'hsl(var(--destructive))',
  },
};

export function FunnelChart() {
  const { candidates } = useCandidates();
  const { startDate, endDate } = useDashboardFilter();

  const { chartData, totalCanceled } = useMemo(() => {
    if (!startDate || !endDate) return { chartData: [], totalCanceled: 0 };

    const filteredCandidates = candidates.filter(c => {
      const regDate = safeParseDate(c.registrationDate);
      return regDate && isWithinInterval(regDate, { start: startDate, end: endDate });
    });

    const totalRegistered = filteredCandidates.length;

    const enrolledCandidates = filteredCandidates.filter(c => {
        if (!c.enrollmentDate) return false;
        const enrDate = safeParseDate(c.enrollmentDate);
        return enrDate && isWithinInterval(enrDate, { start: startDate, end: endDate }) && 
               (c.status === 'Enrolled' || c.status === 'Engaged' || (c.status === 'Canceled' && c.enrollmentDate));
    });
    
    const totalEnrolled = enrolledCandidates.length;
    const totalEngaged = enrolledCandidates.filter(c => c.firstPaymentPaid === true).length;
    const canceledCount = enrolledCandidates.filter(c => c.status === 'Canceled').length;

    const data = [
      {
        value: totalRegistered,
        name: 'Inscritos',
        fill: 'var(--color-inscritos)',
        key: 'inscritos'
      },
      {
        value: totalEnrolled,
        name: 'Matriculados',
        fill: 'var(--color-matriculados)',
        key: 'matriculados'
      },
      {
        value: totalEngaged,
        name: 'Engajados',
        fill: 'var(--color-engajados)',
        key: 'engajados'
      }
    ];

    const processedData = data.map((item, i) => {
        let conversion = 100;
        let label = "Base Total";

        if (i > 0) {
            const prevValue = data[i-1].value;
            const refValue = item.name === 'Engajados' ? totalEnrolled : prevValue;
            label = item.name === 'Engajados' ? "Taxa de Engajamento" : "Conversão da Etapa";
            conversion = refValue > 0 ? (item.value / refValue) * 100 : 0;
        }

        return {
            ...item,
            conversion: parseFloat(conversion.toFixed(1)),
            conversionLabel: label
        };
    });

    return { chartData: processedData, totalCanceled: canceledCount };
  }, [candidates, startDate, endDate]);
  

   if (!startDate || !endDate || chartData.length === 0 || chartData[0].value === 0) {
    return (
        <Card className="h-full flex flex-col min-h-[300px]">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Funil de Conversão Comercial</CardTitle>
                <CardDescription className="text-xs">Defina um período letivo para análise.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground italic text-xs">Sem dados suficientes para gerar o funil.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Funil de Conversão Comercial</CardTitle>
        <CardDescription className="text-xs">
            Jornada do candidato. Perdas após matrícula: <strong className="text-destructive font-bold">{totalCanceled}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-4 flex items-center justify-center overflow-hidden">
        <ChartContainer config={chartConfig} className="h-full w-full min-h-[300px]">
            <RechartsFunnelChart margin={{ top: 20, right: 120, left: 20, bottom: 20 }}>
                <Tooltip
                    cursor={false}
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                                <div className="bg-zinc-950 text-zinc-50 border border-zinc-800 p-3 rounded-xl shadow-2xl min-w-[180px]">
                                    <p className="font-bold text-sm mb-2 leading-tight">{data.name}</p>
                                    <div className="space-y-1.5 border-t border-zinc-800 pt-2 pb-2">
                                        <p className="flex justify-between items-center text-xs">
                                            <span className="text-zinc-400">Quantidade:</span> 
                                            <span className="font-bold text-zinc-300">{data.value}</span>
                                        </p>
                                    </div>
                                    <div className="mt-1 pt-2 border-t border-zinc-800">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[10px] text-zinc-500 uppercase font-bold text-center">{data.conversionLabel}</span>
                                            <span className="font-bold text-emerald-500 text-base text-center">{data.conversion}%</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    }}
                />
                <Funnel dataKey="value" data={chartData} isAnimationActive>
                    <LabelList
                        position="right"
                        dataKey="name" 
                        fill="currentColor"
                        className="font-black"
                        style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '-0.02em' }}
                    />
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                    ))}
                </Funnel>
            </RechartsFunnelChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

    
