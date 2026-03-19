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
import { Button } from '@/components/ui/button';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, XIcon } from 'lucide-react';
import { useCandidates } from '@/context/candidates-context';
import { useAcademicPeriod } from '@/context/academic-period-context';
import { useGoals } from '@/context/goals-context';
import { useHolidays } from '@/context/holidays-context';
import { 
  format, 
  isWithinInterval, 
  eachDayOfInterval, 
  eachWeekOfInterval, 
  eachMonthOfInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWeekend,
  getWeek,
  getMonth,
  getYear,
  setMonth,
  setYear,
  addDays,
  isSameDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, safeParseDate } from '@/lib/utils';

const chartConfig = {
  target: {
    label: "Meta",
    color: "hsl(var(--chart-1) / 0.2)",
  },
  enrollments: {
    label: 'Matrículas',
    color: 'hsl(var(--chart-1))',
  },
};

type View = 'day' | 'week' | 'month';

function MonthPicker({
  date,
  setDate,
  fromDate,
  toDate,
}: {
  date: Date | undefined,
  setDate: (date: Date | undefined) => void,
  fromDate?: Date | null,
  toDate?: Date | null,
}) {
  const [currentYear, setCurrentYear] = useState(date ? getYear(date) : getYear(new Date()));

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <Button onClick={() => setCurrentYear(currentYear - 1)} variant="outline" size="icon" className='h-7 w-7'>
          &lt;
        </Button>
        <div className="font-bold text-xs">{currentYear}</div>
        <Button onClick={() => setCurrentYear(currentYear + 1)} variant="outline" size="icon" className='h-7 w-7'>
          &gt;
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: 12 }).map((_, i) => {
          const monthDate = setYear(setMonth(new Date(), i), currentYear);
          const isDisabled = (fromDate && monthDate < startOfMonth(fromDate)) || (toDate && monthDate > endOfMonth(toDate));
          return (
            <Button
              key={i}
              variant={date && getMonth(date) === i && getYear(date) === currentYear ? "default" : "outline"}
              size="sm"
              disabled={isDisabled}
              onClick={() => {
                setDate(monthDate);
              }}
              className="text-[10px] h-7 px-1"
            >
              {format(monthDate, "MMM", { locale: ptBR })}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export function EnrollmentOverTimeChart() {
  const { candidates } = useCandidates();
  const { startDate, endDate } = useAcademicPeriod();
  const { goals } = useGoals();
  const { holidays } = useHolidays();
  const [view, setView] = useState<View>('month');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  
  const holidayDates = useMemo(() => holidays.map(h => safeParseDate(h.date)?.setHours(0, 0, 0, 0)).filter(Boolean) as number[], [holidays]);
  const isWorkingDay = (day: Date): boolean => {
      if (isWeekend(day)) return false;
      const dayTime = day.getTime();
      return !holidayDates.some(holidayTime => holidayTime === dayTime);
  }

  const chartData = useMemo(() => {
    const enrollmentsGoal = goals.find(g => g.type === 'Enrollments');
    if (!startDate || !endDate || !enrollmentsGoal || enrollmentsGoal.target === 0 || startDate > endDate) return [];

    let viewStartDate = startDate;
    let viewEndDate = endDate;

    if (selectedDate) {
        if (view === 'day') {
            viewStartDate = selectedDate;
            viewEndDate = selectedDate;
        } else if (view === 'week') {
            viewStartDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
            viewEndDate = endOfWeek(selectedDate, { weekStartsOn: 1 });
        } else if (view === 'month') {
            viewStartDate = startOfMonth(selectedDate);
            viewEndDate = endOfMonth(selectedDate);
        }
    }
    
    let interval;
    let formatLabel: (date: Date) => string;
    let getPeriodInterval: (date: Date) => { start: Date, end: Date };

    switch (view) {
      case 'day':
        interval = eachDayOfInterval({ start: viewStartDate, end: viewEndDate });
        formatLabel = (d) => format(d, 'dd/MM');
        getPeriodInterval = (d) => ({ start: d, end: d });
        break;
      case 'week':
        interval = eachWeekOfInterval({ start: viewStartDate, end: viewEndDate }, { weekStartsOn: 1 });
        formatLabel = (d) => `Sem ${format(d, 'w')}`;
        getPeriodInterval = (d) => ({ start: startOfWeek(d, {weekStartsOn: 1}), end: endOfWeek(d, {weekStartsOn: 1})});
        break;
      case 'month':
      default:
        interval = eachMonthOfInterval({ start: viewStartDate, end: viewEndDate });
        formatLabel = (d) => format(d, 'MMM', { locale: ptBR });
        getPeriodInterval = (d) => ({ start: startOfMonth(d), end: endOfMonth(d) });
        break;
    }

    let remainingGoal = enrollmentsGoal.target;
    let remainingWorkingDays = eachDayOfInterval({ start: startDate, end: endDate }).filter(isWorkingDay).length;
    
    if (viewStartDate > startDate) {
        const prePeriodEnd = addDays(viewStartDate, -1);
        if (prePeriodEnd >= startDate) {
            const prePeriodDays = eachDayOfInterval({ start: startDate, end: prePeriodEnd });
            prePeriodDays.forEach(day => {
                const enrollmentsOnDay = candidates.filter(c => {
                    if (!c.enrollmentDate) return false;
                    if (c.status !== 'Enrolled' && c.status !== 'Engaged' && !(c.status === 'Canceled' && c.enrollmentDate)) return false;
                    const enrDate = safeParseDate(c.enrollmentDate);
                    return enrDate && isSameDay(enrDate, day);
                }).length;
                remainingGoal -= enrollmentsOnDay;
                if (isWorkingDay(day)) {
                    remainingWorkingDays--;
                }
            });
        }
    }

    if(remainingWorkingDays <= 0 && interval.length > 1) return [];
    
    return interval.map(periodStart => {
        const period = getPeriodInterval(periodStart);
        const actualPeriodStart = period.start < startDate ? startDate : period.start;
        const actualPeriodEnd = period.end > endDate ? endDate : period.end;
        if (actualPeriodStart > actualPeriodEnd) return null;

        const workingDaysInPeriod = eachDayOfInterval({start: actualPeriodStart, end: actualPeriodEnd}).filter(isWorkingDay).length;
        
        const dailyGoal = remainingWorkingDays > 0 ? remainingGoal / remainingWorkingDays : 0;
        const target = Math.max(0, dailyGoal * workingDaysInPeriod);

        const enrollments = candidates.filter(c => {
          if (!c.enrollmentDate) return false;
          if (c.status !== 'Enrolled' && c.status !== 'Engaged' && !(c.status === 'Canceled' && c.enrollmentDate)) return false;
          const enrDate = safeParseDate(c.enrollmentDate);
          return enrDate && isWithinInterval(enrDate, {start: actualPeriodStart, end: actualPeriodEnd});
        }).length;
        
        remainingGoal -= enrollments;
        remainingWorkingDays -= workingDaysInPeriod;
        
        return {
            name: formatLabel(periodStart),
            enrollments,
            target: Math.round(target),
        };
    }).filter(Boolean) as {name: string, enrollments: number, target: number}[];

  }, [candidates, startDate, endDate, view, selectedDate, goals, isWorkingDay]);

  const handleSetSelectedDate = (date: Date | undefined) => {
    setSelectedDate(date);
    setIsPickerOpen(false);
  }
  
  if (!startDate || !endDate || chartData.length === 0) {
    return (
      <Card className="h-full min-h-[300px]">
        <CardHeader>
          <CardTitle>Matrículas no Tempo</CardTitle>
          <CardDescription>Defina o período letivo ou filtre uma data.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-sm italic">Sem dados registrados para este período.</p>
        </CardContent>
      </Card>
    );
  }

  const getDatePickerButtonLabel = () => {
    if (!selectedDate) return <span>Filtrar período</span>;
    if (view === 'day') return format(selectedDate, "dd MMM yyyy", { locale: ptBR });
    if (view === 'week') return `Semana ${getWeek(selectedDate, { weekStartsOn: 1 })}`;
    if (view === 'month') return format(selectedDate, "MMMM yyyy", { locale: ptBR });
    return <span>Selecione</span>
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pr-16">
            <div>
                <CardTitle className="text-lg">Matrículas no Tempo</CardTitle>
                <CardDescription className="text-xs">
                Proporcional ao período letivo.
                </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex gap-1 rounded-lg bg-muted p-1">
                    <Button size="sm" variant={view === 'day' ? 'secondary' : 'ghost'} onClick={() => setView('day')} className="h-8 px-3 text-xs font-bold">Dia</Button>
                    <Button size="sm" variant={view === 'week' ? 'secondary' : 'ghost'} onClick={() => setView('week')} className="h-8 px-3 text-xs font-bold">Sem</Button>
                    <Button size="sm" variant={view === 'month' ? 'secondary' : 'ghost'} onClick={() => setView('month')} className="h-8 px-3 text-xs font-bold">Mês</Button>
                </div>
                 <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "h-10 px-3 justify-start text-left font-bold text-sm w-full md:w-auto",
                        !selectedDate && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span className="truncate">{getDatePickerButtonLabel()}</span>
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      {view === 'month' ? (
                          <MonthPicker 
                            date={selectedDate}
                            setDate={handleSetSelectedDate}
                            fromDate={startDate}
                            toDate={endDate}
                          />
                      ) : (
                          <CalendarPicker
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleSetSelectedDate}
                            initialFocus
                            locale={ptBR}
                            showWeekNumber={view === 'week'}
                            onWeekNumberClick={(weekNumber, week) => {
                                if (view === 'week') {
                                    handleSetSelectedDate(week[0]);
                                }
                            }}
                            disabled={{ before: startDate || undefined, after: endDate || undefined }}
                        />
                      )}
                    </PopoverContent>
                </Popover>
                {selectedDate && (
                    <Button variant="ghost" size="icon" onClick={() => setSelectedDate(undefined)} className="h-8 w-8 text-destructive">
                        <XIcon className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-2">
          <ChartContainer config={chartConfig} className="h-full w-full min-h-[300px]">
              <BarChart data={chartData} margin={{ left: 0, right: 20, top: 10, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  style={{ fontSize: '11px', fontWeight: 600 }}
                />
                <YAxis allowDecimals={false} style={{ fontSize: '11px', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <ChartTooltip
                  cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const perf = data.target > 0 ? ((data.enrollments / data.target) * 100).toFixed(1) : "0.0";
                        return (
                            <div className="rounded-xl border bg-card p-3 text-card-foreground shadow-lg min-w-[180px]">
                                <p className="font-bold text-sm mb-2 leading-tight">{label}</p>
                                <div className="space-y-1.5 border-t border-border pt-2 pb-2">
                                    <p className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Meta Período:</span> 
                                        <span className="font-bold">{data.target}</span>
                                    </p>
                                    <p className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Realizado:</span> 
                                        <span className="font-bold text-chart-1">{data.enrollments}</span>
                                    </p>
                                </div>
                                <div className="mt-1 pt-2 border-t border-border">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold text-center">Aproveitamento</span>
                                        <span className={cn("font-bold text-base text-center", Number(perf) >= 100 ? "text-green-600" : "text-destructive")}>{perf}%</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    return null;
                }}
                />
                 <ChartLegend content={<ChartLegendContent className="mt-2 text-[11px]" />} />
                <Bar dataKey="target" fill="var(--color-target)" radius={[2, 2, 0, 0]} stackId="a" barSize={30} />
                <Bar dataKey="enrollments" fill="var(--color-enrollments)" radius={[2, 2, 0, 0]} stackId="a" barSize={30} />
              </BarChart>
          </ChartContainer>
      </CardContent>
    </Card>
  );
}
