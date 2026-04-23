
'use client';

import AppSidebar, { NotificationBell } from '@/components/app-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { CandidatesProvider } from '@/context/candidates-context';
import { StudentsProvider } from '@/context/students-context';
import { GoalsProvider } from '@/context/goals-context';
import { SpecialistsProvider } from '@/context/specialists-context';
import { AcademicPeriodProvider } from '@/context/academic-period-context';
import { HolidaysProvider } from '@/context/holidays-context';
import { AgendaProvider } from '@/context/agenda-context';
import { TemplatesProvider } from '@/context/templates-context';
import { PaidBonusesProvider } from '@/context/paid-bonuses-context';
import { AuditLogProvider } from '@/context/audit-log-context';
import { LeadsProvider } from '@/context/leads-context';
import { useLocation } from '@/context/location-context';
import { useEffect, useState } from 'react';
import type { Specialist, Goal, Holiday, AgendaTask, MessageTemplate, Candidate, Lead, AuditLogEntry, Student } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PaidBonusesData = {
  isMetaBonusActive?: boolean;
  paymentCycles?: {
    date: string | null;
    specialistValues: { [specialistName: string]: number };
  }[];
};

function Header({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "sticky top-0 z-40 h-16 shrink-0 border-b bg-background/80 backdrop-blur-xl md:hidden",
        className
      )}
      {...props}
    >
      <div className="flex h-full items-center justify-between px-4 sm:px-6 text-muted-foreground dark:text-primary-foreground">
        <SidebarTrigger />
        <NotificationBell />
      </div>
    </div>
  )
}

function AppLayoutContent({ children }: { children: React.ReactNode }) {
    const { location } = useLocation();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    const [specialists, setSpecialists] = useState<Specialist[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [tasks, setTasks] = useState<AgendaTask[]>([]);
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [paidBonuses, setPaidBonuses] = useState<PaidBonusesData>({});
    const [academicPeriod, setAcademicPeriod] = useState<{ startDate: string | null, endDate: string | null }>({ startDate: null, endDate: null });
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);

    useEffect(() => {
        if (!location) {
            router.push('/');
            return;
        }

        const loadData = async () => {
            setLoading(false);
        };

        loadData();

        loadData();
    }, [location, router]);
    

    if (loading || !location) {
        return (
            <div className="flex min-h-screen">
                 <div className="hidden md:flex flex-col p-4 bg-primary h-svh w-[18rem]">
                     <Skeleton className="h-10 w-full mb-6 bg-white/20" />
                     <div className="flex flex-col gap-2">
                        <Skeleton className="h-12 w-full bg-white/20" />
                        <Skeleton className="h-12 w-full bg-white/20" />
                        <Skeleton className="h-12 w-full bg-white/20" />
                        <Skeleton className="h-12 w-full bg-white/20" />
                     </div>
                 </div>
                 <main className="flex-1 p-8 space-y-8">
                     <div className='flex justify-between items-center'>
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-10 w-24" />
                     </div>
                     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Skeleton className="h-28" />
                        <Skeleton className="h-28" />
                        <Skeleton className="h-28" />
                        <Skeleton className="h-28" />
                     </div>
                      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                        <Skeleton className="h-80" />
                        <Skeleton className="h-80" />
                      </div>
                 </main>
            </div>
        )
    }

    return (
        <SidebarProvider>
            <AuditLogProvider initialData={logs}>
                <TemplatesProvider initialData={templates}>
                    <AgendaProvider initialData={tasks}>
                        <HolidaysProvider initialData={holidays}>
                            <AcademicPeriodProvider initialData={academicPeriod}>
                                <SpecialistsProvider initialData={specialists}>
                                    <LeadsProvider initialData={leads}>
                                        <StudentsProvider initialData={students}>
                                            <CandidatesProvider initialData={candidates}>
                                                    <GoalsProvider initialData={goals}>
                                                        <PaidBonusesProvider initialData={paidBonuses}>
                                                            <div className="flex bg-background relative overflow-hidden" style={{ height: '100dvh' }}>
                                                                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[140px] rounded-full pointer-events-none z-0" />
                                                                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-500/15 blur-[120px] rounded-full pointer-events-none z-0" />
                                                                <AppSidebar />
                                                                <div className="flex flex-col flex-1 min-w-0">
                                                                    <Header />
                                                                    <div className="flex-1 flex flex-col overflow-y-auto pb-4">
                                                                        <main className="flex-1 flex flex-col">
                                                                            {children}
                                                                        </main>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </PaidBonusesProvider>
                                                    </GoalsProvider>
                                            </CandidatesProvider>
                                        </StudentsProvider>
                                    </LeadsProvider>
                                </SpecialistsProvider>
                            </AcademicPeriodProvider>
                        </HolidaysProvider>
                    </AgendaProvider>
                </TemplatesProvider>
            </AuditLogProvider>
        </SidebarProvider>
    );
}


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    return <AppLayoutContent>{children}</AppLayoutContent>;
}
