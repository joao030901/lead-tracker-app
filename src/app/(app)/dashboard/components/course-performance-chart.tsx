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
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { useCandidates } from '@/context/candidates-context';
import { useDashboardFilter } from '@/context/dashboard-filter-context';
import { isWithinInterval } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { cn, safeParseDate } from '@/lib/utils';

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

const formatCourseName = (course: string) => {
    return course || '';
};

export function CoursePerformanceChart() {
  const { candidates } = useCandidates();
  const { startDate, endDate } = useDashboardFilter();
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const filteredCandidates = useMemo(() => {
    if (!startDate || !endDate) return candidates;
    return candidates.filter(c => {
      const regDate = safeParseDate(c.registrationDate);
      return regDate && isWithinInterval(regDate, { start: startDate, end: endDate });
    });
  }, [candidates, startDate, endDate]);

  const allCourses = useMemo(() => {
    const courses = new Set(filteredCandidates.map(c => c.course));
    return Array.from(courses).sort();
  }, [filteredCandidates]);

  const chartData = useMemo(() => {
    const dataCandidates = selectedCourses.length > 0
        ? filteredCandidates.filter(c => selectedCourses.includes(c.course))
        : filteredCandidates;

    const sourceCourses = selectedCourses.length > 0 ? selectedCourses : allCourses;

    const performanceByCourse = sourceCourses.map(course => {
      const courseCandidates = dataCandidates.filter(c => c.course === course);
      const registrations = courseCandidates.length;
      const enrollments = courseCandidates.filter(c => (c.status === 'Enrolled' || c.status === 'Engaged' || (c.status === 'Canceled' && c.enrollmentDate))).length;
      const engaged = courseCandidates.filter(c => c.firstPaymentPaid === true || c.status === 'Engaged').length;
      const conversionRate = registrations > 0 ? (enrollments / registrations) * 100 : 0;
      const engagementRate = enrollments > 0 ? (engaged / enrollments) * 100 : 0;
      
      const displayName = formatCourseName(course);

      return {
        name: displayName,
        fullName: course,
        registrations,
        enrollments,
        engaged,
        conversionRate: conversionRate.toFixed(1),
        engagementRate: engagementRate.toFixed(1),
      };
    });

    return performanceByCourse
        .sort((a,b) => b.registrations - a.registrations)
        .slice(0, 10);
        
  }, [filteredCandidates, selectedCourses, allCourses]);

  const handleSelectCourse = (course: string) => {
    setSelectedCourses(prev => 
      prev.includes(course) 
        ? prev.filter(c => c !== course)
        : [...prev, course]
    )
  }

  if (!startDate || !endDate) {
    return (
        <Card className="h-full min-h-[300px]">
            <CardHeader>
                <CardTitle>Desempenho por Curso</CardTitle>
                <CardDescription>Defina um período letivo na aba Admin.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-full">
                <p className="text-muted-foreground italic text-sm">Selecione o período letivo.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pr-16">
            <div>
                <CardTitle className="text-lg">Desempenho por Curso</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                    Análise segmentada (Top 10).
                </CardDescription>
            </div>
             <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full md:w-[200px] justify-between h-10 text-sm font-semibold"
                    >
                    <span className="truncate">{selectedCourses.length > 0 ? `${selectedCourses.length} selecionados` : "Filtrar cursos"}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="end">
                    <Command>
                        <CommandInput placeholder="Buscar curso..." className="h-9 text-xs" />
                        <CommandList>
                            <CommandEmpty className="text-xs py-2">Nenhum curso.</CommandEmpty>
                            <CommandGroup className="max-h-[250px] overflow-y-auto">
                                {allCourses.map((course) => (
                                <CommandItem
                                    key={course}
                                    value={course}
                                    onSelect={() => handleSelectCourse(course)}
                                    className="text-[11px]"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-3 w-3",
                                            selectedCourses.includes(course) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {course}
                                </CommandItem>
                                ))}
                            </CommandGroup>
                            {selectedCourses.length > 0 && (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup>
                                        <CommandItem
                                            onSelect={() => setSelectedCourses([])}
                                            className="justify-center text-center text-xs font-bold text-rose-500 py-2"
                                        >
                                            Limpar filtros
                                        </CommandItem>
                                    </CommandGroup>
                                </>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-2">
        {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-full w-full min-h-[300px]">
                <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 5 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.2} />
                    <YAxis
                        dataKey="name"
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={5}
                        width={180}
                        style={{ fontSize: '11px', fontWeight: 600 }}
                    />
                    <XAxis type="number" style={{ fontSize: '10px' }} axisLine={false} tickLine={false} />
                    <ChartTooltip
                        cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                        content={({ active, payload, label }) => {
                           if (active && payload && payload.length) {
                                return (
                                    <div className="rounded-xl border bg-card p-3 text-card-foreground shadow-lg min-w-[200px]">
                                        <p className="font-bold text-sm mb-2 leading-tight">{payload[0].payload.fullName}</p>
                                        <div className="space-y-1.5 border-t border-border pt-2 pb-2">
                                            <p className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground">Inscrições:</span> 
                                                <span className="font-bold text-chart-1">{payload[0].value}</span>
                                            </p>
                                            <p className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground">Matrículas:</span> 
                                                <span className="font-bold text-chart-2">{payload[1].value}</span>
                                            </p>
                                            <p className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground">Engajados:</span> 
                                                <span className="font-bold text-chart-5">{payload[2].value}</span>
                                            </p>
                                        </div>
                                        <div className="mt-1 pt-2 border-t border-border grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Conversão</span>
                                                <span className="font-bold text-chart-2 text-sm">{payload[0].payload.conversionRate}%</span>
                                            </div>
                                            <div className="flex flex-col gap-0.5 text-right">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Engajam.</span>
                                                <span className="font-bold text-chart-5 text-sm">{payload[0].payload.engagementRate}%</span>
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
        ) : (
             <div className="flex h-full w-full items-center justify-center">
                <p className="text-muted-foreground text-xs italic">Sem dados registrados.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
