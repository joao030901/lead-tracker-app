
'use client';

import { useMemo, FC } from 'react';
import { useAgenda } from '@/context/agenda-context';
import { useHolidays } from '@/context/holidays-context';
import { useGoals } from '@/context/goals-context';
import { useCandidates } from '@/context/candidates-context';
import { useAcademicPeriod } from '@/context/academic-period-context';
import { cn } from '@/lib/utils';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isToday,
  parse,
  format,
  isWeekend,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import { AgendaTask } from '@/lib/types';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, Info } from 'lucide-react';

const getHolidayIcon = (holidayName: string) => {
  const lowerCaseName = holidayName.toLowerCase();
  if (lowerCaseName.includes('carnaval')) return '🎭';
  if (lowerCaseName.includes('páscoa')) return '🐰';
  if (lowerCaseName.includes('natal')) return '🎄';
  if (lowerCaseName.includes('independência')) return '🇧🇷';
  if (lowerCaseName.includes('república')) return '🇧🇷';
  if (lowerCaseName.includes('trabalho')) return '🛠️';
  if (lowerCaseName.includes('finados')) return '🕯️';
  if (lowerCaseName.includes('confraternização') || lowerCaseName.includes('ano novo')) return '🎉';
  if (lowerCaseName.includes('consciência negra')) return '✊🏿';
  if (lowerCaseName.includes('aparecida')) return '🙏';
  if (lowerCaseName.includes('tiradentes')) return '🦷';
  return '🎉'; // Default holiday icon
};

const TaskItemWrapper: FC<{ task: AgendaTask; children: React.ReactNode }> = ({ task, children }) => {
  if (task.candidateId) {
    return <Link href={`/candidates/${task.candidateId}`}>{children}</Link>;
  }
  if (task.leadId) {
    return <Link href={`/leads/${task.leadId}`}>{children}</Link>;
  }
  return <>{children}</>;
};

interface CalendarGridProps {
    currentDate: Date;
    selectedDate: Date;
    onDayClick: (day: Date) => void;
    onDayDoubleClick: (day: Date) => void;
    view?: 'month' | 'week';
}

const daysOfWeek = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export default function CalendarGrid({ 
  currentDate,
  selectedDate,
  onDayClick, 
  onDayDoubleClick,
  view = 'month'
}: CalendarGridProps) {
    const { tasks } = useAgenda();
    const { holidays } = useHolidays();
    const { goals } = useGoals();
    const { candidates } = useCandidates();
    const { startDate, endDate } = useAcademicPeriod();

    const dailyMetrics = useMemo(() => {
        const metrics: { [key: string]: { target: number, achieved: number } } = {};
        const enrollmentsGoal = goals.find((g) => g.type === "Enrollments");
        
        if (!startDate || !endDate || !enrollmentsGoal || enrollmentsGoal.target === 0 || startDate > endDate) {
            return metrics;
        }

        const holidayDates = holidays.map(h => parseISO(h.date).setHours(0, 0, 0, 0));
        const isWorkingDay = (day: Date): boolean => {
            if (isWeekend(day)) return false;
            const dayTime = day.getTime();
            return !holidayDates.some(holidayTime => holidayTime === dayTime);
        }

        const periodDays = eachDayOfInterval({ start: startDate, end: endDate });
        const totalWorkingDaysInPeriod = periodDays.filter(isWorkingDay).length;
        if (totalWorkingDaysInPeriod === 0) return metrics;

        const dailyAverageGoal = Math.ceil(enrollmentsGoal.target / totalWorkingDaysInPeriod);
        
        for (const day of periodDays) {
             const dayKey = format(day, 'yyyy-MM-dd');
             const enrollmentsOnDay = candidates.filter(c => {
                 if (!c.enrollmentDate) return false;
                 if (c.status !== 'Enrolled' && c.status !== 'Engaged' && !(c.status === 'Canceled' && c.enrollmentDate)) return false;
                 try {
                    const enrollmentDate = parseISO(c.enrollmentDate);
                    return isSameDay(enrollmentDate, day);
                 } catch { return false; }
            }).length;

            metrics[dayKey] = {
                target: isWorkingDay(day) ? dailyAverageGoal : 0,
                achieved: enrollmentsOnDay
            };
        }

        return metrics;

    }, [goals, candidates, startDate, endDate, holidays]);

    const calendarDays = useMemo(() => {
        let startOfCalendar: Date, endOfCalendar: Date;
    
        if (view === 'week') {
            startOfCalendar = startOfWeek(currentDate);
            endOfCalendar = endOfWeek(currentDate);
        } else { // month
            const firstDayOfMonth = startOfMonth(currentDate);
            const lastDayOfMonth = endOfMonth(currentDate);
            startOfCalendar = startOfWeek(firstDayOfMonth);
            endOfCalendar = endOfWeek(lastDayOfMonth);
        }
    
        const days = eachDayOfInterval({ start: startOfCalendar, end: endOfCalendar });
    
        return days.map(day => {
            const dayTasks = tasks.filter(task => isSameDay(parse(task.date, 'yyyy-MM-dd', new Date()), day));
            const dayHolidays = holidays.filter(holiday => isSameDay(parse(holiday.date, 'yyyy-MM-dd', new Date()), day));
            return { 
                day, 
                tasks: dayTasks.sort((a, b) => a.time.localeCompare(b.time)),
                holidays: dayHolidays,
                isCurrentMonth: view === 'month' ? isSameMonth(day, currentDate) : true
            };
        });
    }, [currentDate, tasks, holidays, view]);


    return (
        <div className="grid grid-cols-7 flex-1 bg-background border rounded-lg overflow-hidden">
            {daysOfWeek.map(day => (
                <div key={day} className="text-center font-bold p-2 capitalize bg-muted/50 border-b text-sm">
                {day}
                </div>
            ))}
            {calendarDays.map((dayData, index) => {
                const dayKey = format(dayData.day, 'yyyy-MM-dd');
                const metrics = dailyMetrics[dayKey];
                
                return (
                    <div
                        key={index}
                        className={cn(
                            "relative p-2 min-h-[80px] sm:min-h-[120px] flex flex-col border-t cursor-pointer hover:bg-muted/50",
                            {
                                'bg-card': dayData.isCurrentMonth,
                                'bg-muted/50 text-muted-foreground': !dayData.isCurrentMonth,
                                'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-primary': isSameDay(dayData.day, selectedDate),
                                'border-l-primary/50 border-l-4': isToday(dayData.day),
                                'border-r': (index + 1) % 7 !== 0,
                                'border-b': index < calendarDays.length - 7
                            }
                        )}
                        onClick={() => onDayClick(dayData.day)}
                        onDoubleClick={() => onDayDoubleClick(dayData.day)}
                    >
                        <div className="flex justify-between items-start">
                            <span 
                                className={cn("font-semibold flex items-center gap-1.5", { "text-primary font-bold": isToday(dayData.day) })}
                            >
                                {isToday(dayData.day) && <div className="h-2 w-2 rounded-full bg-primary" />}
                                {format(dayData.day, 'd')}
                            </span>
                            {metrics && metrics.target > 0 && dayData.isCurrentMonth && (
                                <div className={cn("text-[10px] font-bold rounded-full px-1.5 py-0.5", metrics.achieved >= metrics.target ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                                    {metrics.achieved}/{metrics.target}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 mt-1 space-y-1 overflow-y-auto">
                            {dayData.holidays.map(holiday => (
                                <Tooltip key={holiday.id}>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1.5 text-xs p-1 rounded-sm bg-purple-200/50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 truncate">
                                            <span>{getHolidayIcon(holiday.name)}</span>
                                            <span className='truncate font-medium'>{holiday.name}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{holiday.name}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                            {dayData.tasks.slice(0,3).map(task => (
                                <TaskItemWrapper key={task.id} task={task}>
                                    <div 
                                        className={cn('text-[10px] p-1 rounded-sm text-foreground/80 truncate flex items-center gap-1', {
                                            'bg-red-200/50 dark:bg-red-900/30': task.priority === 'high',
                                            'bg-yellow-200/50 dark:bg-yellow-900/30': task.priority === 'medium',
                                            'bg-blue-200/50 dark:bg-blue-900/30': task.priority === 'low',
                                            'hover:opacity-80': task.candidateId || task.leadId
                                        })}
                                    >
                                        {task.isInformational && <Info className="h-2.5 w-2.5 text-primary" />}
                                        <span className={cn("truncate", {"line-through text-muted-foreground": task.completed})}>{task.title}</span>
                                    </div>
                                </TaskItemWrapper>
                            ))}
                            {(dayData.tasks.length + dayData.holidays.length) > 3 && <div className="text-[9px] text-muted-foreground mt-1 font-bold">+ {(dayData.tasks.length + dayData.holidays.length) - 3} itens</div>}
                        </div>
                    </div>
                )
            })}
        </div>
    );
}
