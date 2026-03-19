
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

export function GoalsOverview() {
  const { goals } = useGoals();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metas Mensais</CardTitle>
        <CardDescription>
          Progresso das metas de inscrições e matrículas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal) => {
          const progress = goal.target > 0 ? (goal.achieved / goal.target) * 100 : 0;
          const remainingPercentage = Math.max(0, 100 - progress);
          const isAchieved = progress >= 100;

          return (
            <div key={goal.id}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">{goal.type === 'Registrations' ? 'Inscrições' : 'Matrículas'}</span>
                <span className="text-sm text-muted-foreground">
                  {goal.achieved} / {goal.target}
                </span>
              </div>
              <Progress value={progress} />
               <div className="text-xs text-muted-foreground mt-1">
                {isAchieved ? (
                  <span className='text-green-600 font-medium'>Meta alcançada!</span>
                ) : (
                  <span>Faltam {remainingPercentage.toFixed(1)}% para atingir a meta.</span>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
