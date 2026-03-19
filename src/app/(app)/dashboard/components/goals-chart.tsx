'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useGoals } from '@/context/goals-context';

export function GoalsChart() {
  const { goals } = useGoals();
  const registrationGoal = goals.find(g => g.type === 'Registrations');
  const enrollmentGoal = goals.find(g => g.type === 'Enrollments');
  const engagementGoal = goals.find(g => g.type === 'Engagement');
  
  const registrationProgress = registrationGoal && registrationGoal.target > 0 
    ? (registrationGoal.achieved / registrationGoal.target) * 100 
    : 0;
  
  const enrollmentProgress = enrollmentGoal && enrollmentGoal.target > 0
    ? (enrollmentGoal.achieved / enrollmentGoal.target) * 100
    : 0;

  const engagementProgress = engagementGoal && engagementGoal.target > 0
    ? (engagementGoal.achieved / engagementGoal.target) * 100
    : 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Progresso das Metas</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">Período letivo em tempo real.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 flex flex-col justify-center p-6">
        {registrationGoal && (
            <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                    <span className="text-sm font-bold">Inscrições</span>
                    <span className="text-xs font-medium text-muted-foreground">{registrationGoal.achieved} / {registrationGoal.target}</span>
                </div>
                 <div className="relative">
                    <Progress value={registrationProgress} className="h-8 bg-secondary shadow-inner" indicatorClassName="bg-chart-1" />
                    <div className="absolute inset-0 flex items-center px-3">
                        <span className="text-xs font-black text-white drop-shadow-md">{registrationProgress.toFixed(1)}%</span>
                    </div>
                </div>
            </div>
        )}
        {enrollmentGoal && (
             <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                    <span className="text-sm font-bold">Matrículas</span>
                    <span className="text-xs font-medium text-muted-foreground">{enrollmentGoal.achieved} / {enrollmentGoal.target}</span>
                </div>
                <div className="relative">
                    <Progress value={enrollmentProgress} className="h-8 bg-secondary shadow-inner" indicatorClassName="bg-chart-2" />
                    <div className="absolute inset-0 flex items-center px-3">
                        <span className="text-xs font-black text-white drop-shadow-md">{enrollmentProgress.toFixed(1)}%</span>
                    </div>
                </div>
            </div>
        )}
         {engagementGoal && (
             <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                    <span className="text-sm font-bold">Engajamento</span>
                    <span className="text-xs font-medium text-muted-foreground">{engagementGoal.achieved} / {engagementGoal.target}</span>
                </div>
                <div className="relative">
                    <Progress value={engagementProgress} className="h-8 bg-secondary shadow-inner" indicatorClassName="bg-chart-5" />
                    <div className="absolute inset-0 flex items-center px-3">
                        <span className="text-xs font-black text-white drop-shadow-md">{engagementProgress.toFixed(1)}%</span>
                    </div>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
