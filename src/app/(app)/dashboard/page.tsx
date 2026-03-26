
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, UserCheck, Target, TrendingUp, Briefcase, 
  TrendingDown, Contact, UserMinus, BadgePercent,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { StatsCard } from './components/stats-card';
import { EnrollmentChart } from './components/enrollment-chart';
import { ConversionRateChart } from './components/conversion-rate-chart';
import { useCandidates } from '@/context/candidates-context';
import { 
  isAfter, isWithinInterval, 
  differenceInMonths, eachDayOfInterval, isWeekend, 
  startOfToday, startOfMonth, endOfMonth, isSameDay 
} from 'date-fns';
import { SpecialistRankingChart } from './components/specialist-ranking-chart';
import { useDashboardFilter, DashboardFilterProvider } from '@/context/dashboard-filter-context';
import { useGoals } from '@/context/goals-context';
import { MonthlyGoalsChart } from './components/monthly-goals-chart';
import { useHolidays } from '@/context/holidays-context';
import { CoursePerformanceChart } from './components/course-performance-chart';
import { EnrollmentByAgeChart } from './components/enrollment-by-age-chart';
import { PerformanceByCityChart } from './components/performance-by-city-chart';
import { GoalsChart } from './components/goals-chart';
import { EnrollmentOverTimeChart } from './components/enrollment-over-time-chart';
import { EnrollmentByEntryMethodChart } from './components/enrollment-by-entry-method-chart';
import { useLeads } from '@/context/leads-context';
import { EngagementMonthlyGoalsChart } from './components/engagement-monthly-goals-chart';
import { Button } from '@/components/ui/button';
import { safeParseDate } from '@/lib/utils';

const CARD_IDS = [
  'over-time',
  'goals',
  'enrollment-vs-reg',
  'monthly-goals',
  'engagement-goals',
  'specialist-ranking',
  'entry-method',
  'age-distribution',
  'city-performance',
  'course-performance'
];

function DashboardContent() {
  const { candidates } = useCandidates();
  const { leads } = useLeads();
  const { goals } = useGoals();
  const { holidays } = useHolidays();
  const { startDate, endDate } = useDashboardFilter();
  
  const [cardOrder, setCardOrder] = useState<string[]>(CARD_IDS);

  useEffect(() => {
    const savedOrder = localStorage.getItem('dashboard_card_order');
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        const validOrder = parsed.filter((id: string) => CARD_IDS.includes(id));
        const missingIds = CARD_IDS.filter(id => !validOrder.includes(id));
        setCardOrder([...validOrder, ...missingIds]);
      } catch (e) {
        console.error("Erro ao carregar ordem do dashboard", e);
      }
    }
  }, []);

  const saveOrder = (newOrder: string[]) => {
    setCardOrder(newOrder);
    localStorage.setItem('dashboard_card_order', JSON.stringify(newOrder));
  };

  const moveCard = (index: number, direction: 'left' | 'right') => {
    const newOrder = [...cardOrder];
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < newOrder.length) {
      [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
      saveOrder(newOrder);
    }
  };

  const dashboardData = useMemo(() => {
    const now = new Date();
    const today = startOfToday();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);
    
    // Otimização: Feriados em Set para consulta O(1)
    const holidayTimestamps = new Set(holidays.map(h => safeParseDate(h.date)?.setHours(0, 0, 0, 0)).filter(Boolean) as number[]);
    const isWorkingDay = (day: Date) => !isWeekend(day) && !holidayTimestamps.has(day.setHours(0, 0, 0, 0));

    // Estatísticas acumuladores
    let totalRegistrations = 0;
    let totalEnrollments = 0;
    let engagedEnrollments = 0;
    let notEnrolledCount = 0;
    let registeredCandidatesCount = 0;
    let enrollmentsThisMonth = 0;

    if (startDate && endDate) {
        candidates.forEach(c => {
            const regDate = safeParseDate(c.registrationDate);
            const enrDate = safeParseDate(c.enrollmentDate || '');
            
            // Filtro por data de inscrição (Período do Dashboard)
            const isInRegPeriod = regDate && isWithinInterval(regDate, { start: startDate, end: endDate });
            if (isInRegPeriod) {
                totalRegistrations++;
                if (c.status === 'Registered') registeredCandidatesCount++;
                if (!c.enrollmentDate && c.status !== 'Canceled') notEnrolledCount++;
            }

            // Filtro por data de matrícula (Período do Dashboard)
            const isInEnrPeriod = enrDate && isWithinInterval(enrDate, { start: startDate, end: endDate });
            if (isInEnrPeriod && (c.status === 'Enrolled' || c.status === 'Engaged' || (c.status === 'Canceled' && c.enrollmentDate))) {
                totalEnrollments++;
                if (c.firstPaymentPaid) engagedEnrollments++;
            }

            // Matrículas no mês atual (Geral)
            if (enrDate && isWithinInterval(enrDate, { start: startOfCurrentMonth, end: endOfCurrentMonth })) {
                enrollmentsThisMonth++;
            }
        });
    }

    const conversionRate = totalRegistrations > 0 ? (totalEnrollments / totalRegistrations) * 100 : 0;
    
    const enrollmentGoal = goals.find(g => g.type === 'Enrollments');
    const enrollmentTarget = enrollmentGoal?.target || 0;
    const enrollmentProgress = enrollmentTarget > 0 ? (totalEnrollments / enrollmentTarget) * 100 : 0;

    const engagementGoal = goals.find(g => g.type === 'Engagement');
    const engagementTarget = engagementGoal?.target || 0;
    const engagementProgress = engagementTarget > 0 ? (engagedEnrollments / engagementTarget) * 100 : 0;
    
    const engagementConversionRate = totalEnrollments > 0 ? (engagedEnrollments / totalEnrollments) * 100 : 0;

    const totalLeadsCount = leads.length;
    const newLeadsCount = leads.filter(l => l.status === 'new').length;

    let workingDaysLeft = 0;
    if (endDate && isAfter(endDate, today)) {
        const remainingDays = eachDayOfInterval({ start: today, end: endDate });
        workingDaysLeft = remainingDays.filter(isWorkingDay).length;
    }
    
    let monthlyGoalAverages = { enrollments: 0 };
    let monthlyAchievedAverages = { enrollments: 0 };
    let monthlyEnrollmentPerformance = 0;

    if (startDate && endDate && enrollmentTarget > 0 && isAfter(endDate, startDate)) {
      const totalMonthsInPeriod = differenceInMonths(endDate, startDate) + 1;
      monthlyGoalAverages.enrollments = Math.ceil(enrollmentTarget / totalMonthsInPeriod);

      const calculationEndDate = isAfter(now, endDate) ? endDate : (isAfter(startDate, now) ? startDate : now);
      const monthsPassed = isAfter(calculationEndDate, startDate) ? differenceInMonths(calculationEndDate, startDate) + 1 : 1;
      monthlyAchievedAverages.enrollments = monthsPassed > 0 ? Math.round(totalEnrollments / monthsPassed) : 0;
      monthlyEnrollmentPerformance = monthlyGoalAverages.enrollments > 0 ? (monthlyAchievedAverages.enrollments / monthlyGoalAverages.enrollments) * 100 : 0;
    }
    
    return {
      totalRegistrations, totalEnrollments, engagedEnrollments, notEnrolledCount, conversionRate,
      newLeadsCount, registeredCandidatesCount, enrollmentsThisMonth, enrollmentProgress,
      engagementProgress, engagementConversionRate, workingDaysLeft, totalLeadsCount, monthlyGoalAverages,
      monthlyAchievedAverages, monthlyEnrollmentPerformance
    };
  }, [candidates, leads, startDate, endDate, holidays, goals]);

  const renderInteractiveCard = (id: string, index: number) => {
    const controls = (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 z-10">
        <Button 
          variant="secondary" 
          size="icon" 
          className="h-5 w-5 rounded-full shadow-sm border border-border/50" 
          onClick={() => moveCard(index, 'left')}
          disabled={index === 0}
        >
          <ChevronLeft className="h-2.5 w-2.5" />
        </Button>
        <Button 
          variant="secondary" 
          size="icon" 
          className="h-5 w-5 rounded-full shadow-sm border border-border/50" 
          onClick={() => moveCard(index, 'right')}
          disabled={index === cardOrder.length - 1}
        >
          <ChevronRight className="h-2.5 w-2.5" />
        </Button>
      </div>
    );

    const wrap = (children: React.ReactNode) => (
      <div key={id} className="relative group animate-in fade-in slide-in-from-bottom-1 duration-500 flex flex-col h-full overflow-hidden">
        {children}
        {controls}
      </div>
    );

    switch (id) {
      case 'over-time': return wrap(<EnrollmentOverTimeChart />);
      case 'goals': return wrap(<GoalsChart />);
      case 'enrollment-vs-reg': return wrap(<EnrollmentChart />);
      case 'monthly-goals': return wrap(<MonthlyGoalsChart />);
      case 'engagement-goals': return wrap(<EngagementMonthlyGoalsChart />);
      case 'specialist-ranking': return wrap(<SpecialistRankingChart />);
      case 'entry-method': return wrap(<EnrollmentByEntryMethodChart />);
      case 'age-distribution': return wrap(<EnrollmentByAgeChart />);
      case 'city-performance': return wrap(<PerformanceByCityChart />);
      case 'course-performance': return wrap(<CoursePerformanceChart />);
      default: return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
      <header className="mb-6">
        <h1 className="text-4xl font-headline font-bold tracking-tight text-primary">
          Dashboard Geral
        </h1>
        <p className="text-muted-foreground text-lg">
          Análise de desempenho comercial em tempo real.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Leads"
          value={dashboardData.totalLeadsCount.toString()}
          icon={Contact}
          color="indigo"
          description={`${dashboardData.newLeadsCount} novos leads aguardando contato.`}
        />
        <StatsCard
          title="Inscritos"
          value={dashboardData.registeredCandidatesCount.toString()}
          icon={Users}
          color="amber"
          description="Aguardando primeiro contato."
        />
        <StatsCard
          title="Matrículas"
          value={dashboardData.totalEnrollments.toString()}
          icon={UserCheck}
          color="emerald"
          description={`${dashboardData.enrollmentProgress.toFixed(1)}% da meta geral.`}
        />
        <StatsCard
          title="Conversão"
          value={`${dashboardData.conversionRate.toFixed(1)}%`}
          icon={Target}
          color="rose"
          description="Taxa de inscrição para matrícula."
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mt-3">
        <StatsCard
          title="Engajamento"
          value={`${dashboardData.engagementProgress.toFixed(1)}%`}
          icon={BadgePercent}
          color="sky"
          description={`${dashboardData.engagementConversionRate.toFixed(1)}% de matriculados estão pagos.`}
        />
        <StatsCard
          title="Pendentes"
          value={dashboardData.notEnrolledCount.toString()}
          icon={UserMinus}
          color="rose"
          description="Inscritos sem conversão final."
        />
        <StatsCard
          title="Dias Restantes"
          value={dashboardData.workingDaysLeft.toString()}
          icon={Briefcase}
          color="indigo"
          description="Dias úteis até o fim do período letivo."
        />
        <StatsCard
          title="Performance"
          value={`${dashboardData.monthlyEnrollmentPerformance.toFixed(0)}%`}
          icon={dashboardData.monthlyEnrollmentPerformance >= 100 ? TrendingUp : TrendingDown}
          color={dashboardData.monthlyEnrollmentPerformance >= 100 ? "emerald" : "rose"}
          description={`${dashboardData.monthlyAchievedAverages.enrollments}/${dashboardData.monthlyGoalAverages.enrollments} média/mês.`}
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mt-6 auto-rows-fr">
        {cardOrder.map((id, index) => renderInteractiveCard(id, index))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardFilterProvider>
      <DashboardContent />
    </DashboardFilterProvider>
  );
}
