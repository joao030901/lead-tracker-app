'use client';

import { useState, useMemo } from 'react';
import { Pie, PieChart, Cell, Legend } from 'recharts';
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
import { isWithinInterval, differenceInYears } from 'date-fns';
import { Button } from '@/components/ui/button';
import { safeParseDate } from '@/lib/utils';

const ageRangesOrder = ['Menor que 18', '18-24 anos', '25-34 anos', '35-44 anos', '45-54 anos', '55+ anos'];

const chartConfig = {
  "age-under-18": { label: 'Menor que 18', color: 'hsl(var(--chart-4))' },
  "age-18-24": { label: '18-24 anos', color: 'hsl(var(--chart-1))' },
  "age-25-34": { label: '25-34 anos', color: 'hsl(var(--chart-2))' },
  "age-35-44": { label: '35-44 anos', color: 'hsl(var(--chart-3))' },
  "age-45-54": { label: '45-54 anos', color: 'hsl(var(--chart-5))' },
  "age-55-plus": { label: '55+ anos', color: 'hsl(var(--destructive))' },
};


const getAgeRange = (birthDate: Date): string => {
    const age = differenceInYears(new Date(), birthDate);
    if (age <= 17) return 'Menor que 18';
    if (age >= 18 && age <= 24) return '18-24 anos';
    if (age >= 25 && age <= 34) return '25-34 anos';
    if (age >= 35 && age <= 44) return '35-44 anos';
    if (age >= 45 && age <= 54) return '45-54 anos';
    return '55+ anos';
}

const ageRangeToKey = (ageRange: string): string => {
  if (ageRange === 'Menor que 18') return 'age-under-18';
  if (ageRange === '18-24 anos') return 'age-18-24';
  if (ageRange === '25-34 anos') return 'age-25-34';
  if (ageRange === '35-44 anos') return 'age-35-44';
  if (ageRange === '45-54 anos') return 'age-45-54';
  if (ageRange === '55+ anos') return 'age-55-plus';
  return ageRange.toLowerCase().replace(/[^a-z0-9]/g, '-');
};

export function EnrollmentByAgeChart() {
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

    const ageData: { [key: string]: number } = {};

    dataCandidates.forEach(candidate => {
      const birthDate = safeParseDate(candidate.birthDate);
      if (birthDate) {
        const ageRange = getAgeRange(birthDate);
        ageData[ageRange] = (ageData[ageRange] || 0) + 1;
      }
    });
    
    return Object.keys(ageData).map(ageRange => {
      const key = ageRangeToKey(ageRange);
      return {
        name: key,
        label: ageRange,
        value: ageData[ageRange],
        fill: `var(--color-${key})`
      }
    }).sort((a,b) => ageRangesOrder.indexOf(a.label) - ageRangesOrder.indexOf(b.label));
  }, [candidates, startDate, endDate, dataType]);

  if (!startDate || !endDate || chartData.length === 0) {
    return (
        <Card className="h-full min-h-[300px]">
            <CardHeader>
                <CardTitle>Dados por Faixa Etária</CardTitle>
                <CardDescription>Defina um período letivo para ver a distribuição.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-full">
                <p className="text-muted-foreground italic text-sm">Sem dados de idade para o período.</p>
            </CardContent>
        </Card>
    )
  }
  
  const getTitle = () => {
      switch (dataType) {
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
                <CardTitle className="text-lg">{getTitle()} por Idade</CardTitle>
                <CardDescription className="text-xs">Distribuição percentual por faixa etária.</CardDescription>
            </div>
            <div className="flex gap-1 rounded-lg bg-muted p-1 w-full sm:w-auto">
                <Button size="sm" variant={dataType === 'registrations' ? 'default' : 'ghost'} onClick={() => setDataType('registrations')} className="flex-1 text-xs h-10 px-3 font-bold">Insc.</Button>
                <Button size="sm" variant={dataType === 'enrollments' ? 'default' : 'ghost'} onClick={() => setDataType('enrollments')} className="flex-1 text-xs h-10 px-3 font-bold">Matr.</Button>
                <Button size="sm" variant={dataType === 'engaged' ? 'default' : 'ghost'} onClick={() => setDataType('engaged')} className="flex-1 text-xs h-10 px-3 font-bold">Eng.</Button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 py-2 flex items-center justify-center">
        <ChartContainer config={chartConfig} className="h-full w-full min-h-[250px]">
          <PieChart>
            <ChartTooltip
                cursor={false}
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const totalVal = chartData.reduce((acc, curr) => acc + curr.value, 0);
                        return (
                            <div className="rounded-xl border bg-card p-3 text-card-foreground shadow-lg min-w-[180px]">
                                <p className="font-bold text-sm mb-2 leading-tight">{data.label}</p>
                                <div className="space-y-1.5 border-t border-border pt-2 pb-2">
                                    <p className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Total:</span> 
                                        <span className="font-bold">{data.value}</span>
                                    </p>
                                    <p className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Participação:</span> 
                                        <span className="font-bold text-primary">{((Number(data.value) / totalVal) * 100).toFixed(1)}%</span>
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
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={50}
              paddingAngle={2}
              labelLine={false}
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
              ))}
            </Pie>
            <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={(value, entry) => {
                    const configEntry = chartConfig[value as keyof typeof chartConfig];
                    return configEntry ? configEntry.label : value;
                }}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
