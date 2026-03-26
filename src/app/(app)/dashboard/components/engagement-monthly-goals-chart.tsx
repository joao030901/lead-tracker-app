"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { useCandidates } from "@/context/candidates-context"
import {
  eachMonthOfInterval,
  endOfMonth,
  format,
  isWithinInterval,
  eachDayOfInterval,
  isWeekend,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { useDashboardFilter } from "@/context/dashboard-filter-context"
import { useMemo } from "react"
import { useGoals } from "@/context/goals-context"
import { useHolidays } from "@/context/holidays-context"
import { cn, safeParseDate } from "@/lib/utils"

const chartConfig = {
  monthlyTarget: {
    label: "Meta",
    color: "hsl(var(--chart-5) / 0.4)",
  },
  achieved: {
    label: "Alcançado",
    color: "hsl(var(--chart-5))",
  },
}

export function EngagementMonthlyGoalsChart() {
  const { candidates } = useCandidates()
  const { goals } = useGoals()
  const { startDate, endDate } = useDashboardFilter()
  const { holidays } = useHolidays()

  const chartData = useMemo(() => {
    const engagementGoal = goals.find((g) => g.type === "Engagement");
    if (!startDate || !endDate || !engagementGoal || engagementGoal.target === 0 || startDate > endDate) return []

    const holidayDates = holidays.map(h => safeParseDate(h.date)?.setHours(0, 0, 0, 0)).filter(Boolean) as number[];
    const isWorkingDay = (day: Date): boolean => {
      if (isWeekend(day)) return false;
      const dayTime = day.getTime();
      return !holidayDates.some(holidayTime => holidayTime === dayTime);
    }
    
    const monthsInPeriod = eachMonthOfInterval({ start: startDate, end: endDate });
    const totalWorkingDaysInPeriod = eachDayOfInterval({ start: startDate, end: endDate }).filter(isWorkingDay).length;
    
    if (totalWorkingDaysInPeriod === 0) return [];
    
    let remainingGoal = engagementGoal.target;
    let remainingWorkingDays = totalWorkingDaysInPeriod;
    const data = [];

    for (const monthStart of monthsInPeriod) {
        const actualMonthStart = monthStart < startDate ? startDate : monthStart;
        const actualMonthEnd = endOfMonth(monthStart) > endDate ? endDate : endOfMonth(monthStart);
        
        if (actualMonthStart > actualMonthEnd) continue;

        const workingDaysInMonth = eachDayOfInterval({ start: actualMonthStart, end: actualMonthEnd }).filter(isWorkingDay).length;
        
        const dailyGoalRate = remainingWorkingDays > 0 ? remainingGoal / remainingWorkingDays : 0;
        const monthlyTarget = Math.max(0, Math.round(dailyGoalRate * workingDaysInMonth));

        const achievedThisMonth = candidates.filter((c) => {
            if (c.firstPaymentPaid !== true || !c.enrollmentDate) return false
            const enrDate = safeParseDate(c.enrollmentDate);
            return enrDate && isWithinInterval(enrDate, { start: actualMonthStart, end: actualMonthEnd });
        }).length
        
        const monthName = format(monthStart, "MMMM", { locale: ptBR })
        data.push({
            month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
            monthlyTarget,
            achieved: achievedThisMonth,
        });

        remainingGoal = Math.max(0, remainingGoal - achievedThisMonth);
        remainingWorkingDays -= workingDaysInMonth;
    }
    return data;

  }, [candidates, goals, startDate, endDate, holidays]);

  if (!startDate || !endDate || chartData.length === 0) {
    return (
      <Card className="h-full min-h-[300px]">
        <CardHeader>
          <CardTitle>Engajados: Meta vs. Real</CardTitle>
          <CardDescription>Defina um período letivo.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-xs italic">Aguardando dados ou período letivo.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Engajados Mensais: Meta vs. Real</CardTitle>
        <CardDescription className="text-xs">
         Alunos com 1ª parcela paga proporcionalmente.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-2">
        <ChartContainer config={chartConfig} className="h-full w-full min-h-[250px]">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
                style={{ fontSize: '10px', fontWeight: 500 }}
              />
              <YAxis style={{ fontSize: '10px', fontWeight: 500 }} axisLine={false} tickLine={false} />
              <ChartTooltip cursor={false} content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const perf = data.monthlyTarget > 0 ? ((data.achieved / data.monthlyTarget) * 100).toFixed(1) : "0.0";
                        return (
                            <div className="rounded-xl border bg-card p-3 text-card-foreground shadow-lg min-w-[180px]">
                                <p className="font-bold text-sm mb-2 leading-tight">{label}</p>
                                <div className="space-y-1.5 border-t border-border pt-2 pb-2">
                                    <p className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Meta Engajamento:</span> 
                                        <span className="font-bold">{data.monthlyTarget}</span>
                                    </p>
                                    <p className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Alcançado:</span> 
                                        <span className="font-bold text-chart-5">{data.achieved}</span>
                                    </p>
                                </div>
                                <div className="mt-1 pt-2 border-t border-border">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold text-center">Performance</span>
                                        <span className={cn("font-bold text-base text-center", Number(perf) >= 100 ? "text-green-600" : "text-destructive")}>{perf}%</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    return null;
                }} />
              <ChartLegend content={<ChartLegendContent className="mt-2 text-[11px]" />} />
              <Bar dataKey="monthlyTarget" fill="var(--color-monthlyTarget)" radius={[2, 2, 0, 0]} barSize={30} />
              <Bar dataKey="achieved" fill="var(--color-achieved)" radius={[2, 2, 0, 0]} barSize={30} />
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
