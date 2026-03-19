
'use client';

import { useState, useMemo, FC } from 'react';
import { Button } from '@/components/ui/button';
import {
  addMonths, 
  subMonths, 
  format, 
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isToday,
  addDays,
  addWeeks,
  startOfMonth,
  endOfMonth,
  getWeek,
  getYear,
  getMonth,
  setMonth,
  setYear,
  parseISO,
  isWithinInterval,
  eachDayOfInterval,
  isWeekend,
  eachMonthOfInterval,
  startOfDay,
  endOfDay,
  isSameDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PlusCircle, ChevronLeft, ChevronRight, CalendarIcon, XIcon, Loader2 } from 'lucide-react';
import { useAgenda } from '@/context/agenda-context';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import dynamic from 'next/dynamic';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useAcademicPeriod } from '@/context/academic-period-context';
import { useCandidates } from '@/context/candidates-context';
import { useGoals } from '@/context/goals-context';
import { useHolidays } from '@/context/holidays-context';

const LoadingComponent = () => (
    <div className="flex items-center justify-center p-8 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
);

const CalendarGrid = dynamic(() => import('./components/calendar-grid'), { loading: LoadingComponent });
const DayView = dynamic(() => import('./components/day-view'), { loading: LoadingComponent });
const SidePanels = dynamic(() => import('./components/side-panels'), { loading: LoadingComponent });
const NewTaskSheet = dynamic(() => import('./components/new-task-sheet'), { ssr: false });

type View = 'day' | 'week' | 'month';

function MonthPicker({
  date,
  setDate,
  fromDate,
  toDate,
}: {
  date: Date | undefined,
  setDate: (date: Date | undefined) => void,
  fromDate?: Date,
  toDate?: Date,
}) {
  const [currentYear, setCurrentYear] = useState(date ? getYear(date) : getYear(new Date()));

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <Button onClick={() => setCurrentYear(currentYear - 1)} variant="outline" size="icon" className='h-7 w-7'>
          &lt;
        </Button>
        <div className="font-bold">{currentYear}</div>
        <Button onClick={() => setCurrentYear(currentYear + 1)} variant="outline" size="icon" className='h-7 w-7'>
          &gt;
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-2">
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
            >
              {format(monthDate, "MMM", { locale: ptBR })}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<View>('month');
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const { startDate, endDate } = useAcademicPeriod();
  const { candidates } = useCandidates();
  const { goals } = useGoals();
  const { holidays } = useHolidays();

  const summaryData = useMemo(() => {
    const enrollmentsGoal = goals.find(g => g.type === 'Enrollments');
    
    if (!startDate || !endDate || !enrollmentsGoal || enrollmentsGoal.target === 0 || startDate > endDate) {
      return { target: 0, achieved: 0, isOutOfPeriod: true, title: 'Resumo' };
    }
    
    const holidayDates = holidays.map(h => parseISO(h.date).setHours(0, 0, 0, 0));
    const isWorkingDay = (day: Date): boolean => {
        if (isWeekend(day)) return false;
        const dayTime = day.getTime();
        return !holidayDates.some(holidayTime => holidayTime === dayTime);
    }
    
    const totalWorkingDaysInPeriod = eachDayOfInterval({ start: startDate, end: endDate }).filter(isWorkingDay).length;
    if (totalWorkingDaysInPeriod === 0) return { target: 0, achieved: 0, isOutOfPeriod: false, title: 'Resumo' };

    let interval, title;
    switch(view) {
        case 'day':
            interval = { start: startOfDay(currentDate), end: endOfDay(currentDate) };
            title = 'Resumo do Dia';
            break;
        case 'week':
            interval = { start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) };
            title = 'Resumo da Semana';
            break;
        case 'month':
        default:
            interval = { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
            title = 'Resumo do Mês';
            break;
    }
    
    const viewStartDate = interval.start < startDate ? startDate : interval.start;
    const viewEndDate = interval.end > endDate ? endDate : interval.end;

    if (viewStartDate > viewEndDate) {
      return { target: 0, achieved: 0, isOutOfPeriod: true, title };
    }
    
    const achieved = candidates.filter(c => {
      if (!c.enrollmentDate) return false;
      if (c.status !== 'Enrolled' && c.status !== 'Engaged' && !(c.status === 'Canceled' && c.enrollmentDate)) return false;
      try {
        const enrollmentDate = parseISO(c.enrollmentDate);
        return isWithinInterval(enrollmentDate, { start: viewStartDate, end: viewEndDate });
      } catch { return false; }
    }).length;
    
    // Proportional target calculation
    let remainingGoal = enrollmentsGoal.target;
    let remainingWorkingDays = totalWorkingDaysInPeriod;
    
    const preViewPeriodEnd = addDays(viewStartDate, -1);

    if (preViewPeriodEnd >= startDate) {
      const preViewDays = eachDayOfInterval({ start: startDate, end: preViewPeriodEnd });
      preViewDays.forEach(day => {
        const achievedOnDay = candidates.filter(c => {
            if (!c.enrollmentDate) return false;
            if (c.status !== 'Enrolled' && c.status !== 'Engaged' && !(c.status === 'Canceled' && c.enrollmentDate)) return false;
            try {
                return isSameDay(parseISO(c.enrollmentDate), day);
            } catch { return false; }
        }).length;
        remainingGoal -= achievedOnDay;
        if(isWorkingDay(day)) remainingWorkingDays--;
      });
    }
    
    const workingDaysInView = eachDayOfInterval({ start: viewStartDate, end: viewEndDate }).filter(isWorkingDay).length;
    const dailyRate = remainingWorkingDays > 0 ? remainingGoal / remainingWorkingDays : 0;
    const target = Math.max(0, Math.round(dailyRate * workingDaysInView));

    return { target, achieved, isOutOfPeriod: false, title };

  }, [currentDate, view, goals, candidates, startDate, endDate, holidays]);

  const handlePrev = () => {
    if (view === 'day') setCurrentDate(prev => addDays(prev, -1));
    if (view === 'week') setCurrentDate(prev => addWeeks(prev, -1));
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (view === 'day') setCurrentDate(prev => addDays(prev, 1));
    if (view === 'week') setCurrentDate(prev => addWeeks(prev, 1));
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
  };
  
  const handleGoToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  }

  const handleOpenNewTaskSheet = (day: Date) => {
    setSelectedDate(day);
    setIsSheetOpen(true);
  }
  
  const handleSelectDay = (day: Date) => {
    setSelectedDate(day);
    if(view !== 'month') {
        setCurrentDate(day);
    }
  }

  const handleSetSelectedDate = (date: Date | undefined) => {
    if (date) {
        setSelectedDate(date);
        setCurrentDate(date);
    }
    setIsPickerOpen(false);
  }
  
  const getHeaderTitle = () => {
    if (view === 'day') return format(currentDate, "PPP", { locale: ptBR });
    if (view === 'week') {
        const start = startOfWeek(currentDate);
        const end = endOfWeek(currentDate);
        if (isSameMonth(start, end)) {
          return `${format(start, 'd')} - ${format(end, "d 'de' MMMM, yyyy", { locale: ptBR })}`;
        }
        return `${format(start, "d 'de' MMM", { locale: ptBR })} - ${format(end, "d 'de' MMM, yyyy", { locale: ptBR })}`;
    }
    return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
  }

  const getDatePickerButtonLabel = () => {
    if (!selectedDate) return <span>Selecione uma data</span>;
    if (view === 'day') return format(selectedDate, "dd MMM yyyy", { locale: ptBR });
    if (view === 'week') return `Semana ${getWeek(selectedDate, { weekStartsOn: 1 })}`;
    if (view === 'month') return format(selectedDate, "MMMM yyyy", { locale: ptBR });
    return <span>Selecione uma data</span>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      <NewTaskSheet 
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        selectedDate={selectedDate}
      />
      <div className="flex flex-col gap-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
             <div className="flex items-center gap-4">
                <h1 className="text-4xl font-bold font-headline tracking-tight text-primary capitalize">
                    {getHeaderTitle()}
                </h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrev}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleNext}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                     <Button variant="outline" onClick={handleGoToToday}>Hoje</Button>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="flex gap-1 rounded-md bg-muted p-1">
                    <Button size="sm" variant={view === 'day' ? 'default' : 'ghost'} onClick={() => setView('day')}>Dia</Button>
                    <Button size="sm" variant={view === 'week' ? 'default' : 'ghost'} onClick={() => setView('week')}>Semana</Button>
                    <Button size="sm" variant={view === 'month' ? 'default' : 'ghost'} onClick={() => setView('month')}>Mês</Button>
                </div>
                 <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-auto justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {getDatePickerButtonLabel()}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      {view === 'month' ? (
                          <MonthPicker 
                            date={currentDate}
                            setDate={handleSetSelectedDate}
                            fromDate={startDate || undefined}
                            toDate={endDate || undefined}
                          />
                      ) : (
                          <Calendar
                            mode="single"
                            selected={currentDate}
                            onSelect={handleSetSelectedDate}
                            initialFocus
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
                    <Button variant="ghost" size="icon" onClick={() => setSelectedDate(new Date())}>
                        <XIcon className="h-4 w-4 text-muted-foreground" />
                    </Button>
                )}
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {view === 'month' && (
              <CalendarGrid 
                  currentDate={currentDate}
                  selectedDate={selectedDate}
                  onDayClick={handleSelectDay} 
                  onDayDoubleClick={handleOpenNewTaskSheet} 
              />
            )}
              {view === 'week' && (
                <CalendarGrid 
                    currentDate={currentDate}
                    selectedDate={selectedDate}
                    onDayClick={handleSelectDay} 
                    onDayDoubleClick={handleOpenNewTaskSheet}
                    view="week"
                />
              )}
              {view === 'day' && (
                  <DayView currentDate={currentDate} />
              )}
              <div className="mt-4 p-4 border rounded-lg bg-card text-card-foreground">
                  <h4 className="font-semibold text-lg">{summaryData.title}</h4>
                  <div className="flex justify-between items-center mt-2">
                      <span className="text-muted-foreground">Meta de Matrículas:</span>
                      <span className="font-bold text-lg">{summaryData.target}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                      <span className="text-muted-foreground">Matrículas Realizadas:</span>
                      <span
                        className={cn(
                          'font-bold text-lg',
                          summaryData.target > 0 && summaryData.achieved >= summaryData.target
                            ? 'text-green-600'
                            : summaryData.target > 0 ? 'text-red-600' : 'text-foreground'
                        )}
                      >
                        {summaryData.achieved}
                      </span>
                  </div>
                  {summaryData.isOutOfPeriod && summaryData.target === 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Este período está fora do período letivo ativo. A meta não é calculada.
                    </p>
                  )}
              </div>
            </div>
            
            <SidePanels onNewTaskClick={() => handleOpenNewTaskSheet(selectedDate)} selectedDate={selectedDate} view={view} currentDate={currentDate} />
        </div>
      </div>
    </div>
  );
}
