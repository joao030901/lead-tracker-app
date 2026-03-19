
'use client';

import { useEffect, useState } from 'react';
import { listLocations, readData } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Users, UserCheck, Percent, GitCompareArrows } from 'lucide-react';
import type { Candidate, Goal } from '@/lib/types';
import { isWithinInterval, parseISO } from 'date-fns';

interface LocationStats {
  name: string;
  registrations: {
    achieved: number;
    target: number;
    percentage: number;
  };
  enrollments: {
    achieved: number;
    target: number;
    percentage: number;
  };
  conversionRate: number;
  engagement: {
    achieved: number;
    target: number;
    percentage: number;
    rate: number;
  };
}

const formatLocationName = (name: string) => {
    return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export default function SummaryPage() {
  const [stats, setStats] = useState<LocationStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllStats = async () => {
      setIsLoading(true);
      try {
        const locations = await listLocations();
        const allStats = await Promise.all(
          locations.map(async (location) => {
            const [candidates, goals, academicPeriod] = await Promise.all([
              readData<Candidate[]>('candidates.json', [], location),
              readData<Goal[]>('goals.json', [], location),
              readData<{ startDate: string | null, endDate: string | null }>('academic-period.json', { startDate: null, endDate: null }, location),
            ]);

            const { startDate, endDate } = academicPeriod;
            
            let filteredCandidates = candidates;
            if(startDate && endDate) {
                 const start = parseISO(startDate);
                 const end = parseISO(endDate);
                 filteredCandidates = candidates.filter(c => {
                    try {
                        const regDate = parseISO(c.registrationDate);
                        return isWithinInterval(regDate, { start, end });
                    } catch { return false; }
                 });
            }

            const registrationsGoal = goals.find(g => g.type === 'Registrations');
            const enrollmentsGoal = goals.find(g => g.type === 'Enrollments');
            const engagementGoal = goals.find(g => g.type === 'Engagement');
            
            const achievedRegistrations = filteredCandidates.length;
            const targetRegistrations = registrationsGoal?.target || 1;
            const registrationPercentage = (achievedRegistrations / targetRegistrations) * 100;
            
            const achievedEnrollments = filteredCandidates.filter(c => c.enrollmentDate).length;
            const targetEnrollments = enrollmentsGoal?.target || 1;
            const enrollmentPercentage = (achievedEnrollments / targetEnrollments) * 100;

            const achievedEngagement = filteredCandidates.filter(c => c.enrollmentDate && c.firstPaymentPaid === true).length;
            const targetEngagement = engagementGoal?.target || 1;
            const engagementPercentage = (achievedEngagement / targetEngagement) * 100;


            const conversionRate = achievedRegistrations > 0 ? (achievedEnrollments / achievedRegistrations) * 100 : 0;
            const engagementRate = achievedEnrollments > 0 ? (achievedEngagement / achievedEnrollments) * 100 : 0;


            return {
              name: formatLocationName(location),
              registrations: {
                achieved: achievedRegistrations,
                target: registrationsGoal?.target || 0,
                percentage: registrationPercentage,
              },
              enrollments: {
                achieved: achievedEnrollments,
                target: enrollmentsGoal?.target || 0,
                percentage: enrollmentPercentage,
              },
              engagement: {
                achieved: achievedEngagement,
                target: engagementGoal?.target || 0,
                percentage: engagementPercentage,
                rate: engagementRate,
              },
              conversionRate,
            };
          })
        );
        setStats(allStats);
      } catch (error) {
        console.error("Failed to fetch summary stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Resumo Geral das Unidades</CardTitle>
            <CardDescription>Compare o desempenho de todas as unidades em um só lugar.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
            <Card key={stat.name}>
            <CardHeader>
                <CardTitle className="text-xl">{stat.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm font-medium flex items-center gap-2"><Users className="h-4 w-4"/> Inscrições</span>
                        <span className="text-sm font-semibold">{stat.registrations.achieved} / {stat.registrations.target}</span>
                    </div>
                    <Progress value={stat.registrations.percentage} indicatorClassName="bg-chart-1" />
                    <p className="text-xs text-muted-foreground mt-1">{stat.registrations.percentage.toFixed(1)}% da meta</p>
                </div>
                 <div>
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm font-medium flex items-center gap-2"><UserCheck className="h-4 w-4"/> Matrículas</span>
                        <span className="text-sm font-semibold">{stat.enrollments.achieved} / {stat.enrollments.target}</span>
                    </div>
                    <Progress value={stat.enrollments.percentage} indicatorClassName="bg-chart-2"/>
                    <p className="text-xs text-muted-foreground mt-1">{stat.enrollments.percentage.toFixed(1)}% da meta</p>
                </div>
                <div>
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm font-medium flex items-center gap-2"><Percent className="h-4 w-4"/> Engajamento</span>
                        <span className="text-sm font-semibold">{stat.engagement.achieved} / {stat.engagement.target}</span>
                    </div>
                    <Progress value={stat.engagement.percentage} indicatorClassName="bg-chart-5"/>
                    <p className="text-xs text-muted-foreground mt-1">{stat.engagement.percentage.toFixed(1)}% da meta</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div className="text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <GitCompareArrows className="h-4 w-4" />
                            <span>Conv.</span>
                        </div>
                        <p className="text-lg font-bold">{stat.conversionRate.toFixed(1)}%</p>
                    </div>
                     <div className="text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Percent className="h-4 w-4" />
                            <span>Engaj.</span>
                        </div>
                        <p className="text-lg font-bold">{stat.engagement.rate.toFixed(1)}%</p>
                    </div>
                </div>
            </CardContent>
            </Card>
        ))}
        </CardContent>
    </Card>
  );
}
