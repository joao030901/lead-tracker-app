'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Award, BarChart2, Calendar, Download, History, MessageSquare, Users, GitCompareArrows } from 'lucide-react';

import SpecialistsTab from './tabs/specialists-tab';
import HolidaysTab from './tabs/holidays-tab';
import AcademicPeriodTab from './tabs/academic-period-tab';
import BonificationTab from './tabs/bonification-tab';
import TemplatesTab from './tabs/templates-tab';
import BackupTab from './tabs/backup-tab';
import AuditLogTab from './tabs/audit-log-tab';
import CompareTab from './tabs/compare-tab';
import GoalsTab from './tabs/goals-tab';

export default function AdminPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-4xl font-headline font-bold tracking-tight text-primary">
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground text-lg">
            Gerencie os dados e configurações principais da sua aplicação.
          </p>
        </header>

        <Tabs defaultValue="goals" className="w-full">
          <TabsList className="flex flex-wrap h-auto bg-muted/50 border shadow-sm p-1 rounded-xl gap-0.5 mb-8 w-full justify-start lg:flex-nowrap">
            <TabsTrigger value="goals" className="flex-1 lg:flex-none justify-center gap-1.5 px-3 py-2 rounded-lg transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
              <BarChart2 className="h-3.5 w-3.5" />Metas
            </TabsTrigger>
            <TabsTrigger value="specialists" className="flex-1 lg:flex-none justify-center gap-1.5 px-3 py-2 rounded-lg transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
              <Users className="h-3.5 w-3.5" />Especialistas
            </TabsTrigger>
            <TabsTrigger value="holidays" className="flex-1 lg:flex-none justify-center gap-1.5 px-3 py-2 rounded-lg transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
              <Calendar className="h-3.5 w-3.5" />Feriados
            </TabsTrigger>
            <TabsTrigger value="period" className="flex-1 lg:flex-none justify-center gap-1.5 px-3 py-2 rounded-lg transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
              <Calendar className="h-3.5 w-3.5" />Período
            </TabsTrigger>
            <TabsTrigger value="bonification" className="flex-1 lg:flex-none justify-center gap-1.5 px-3 py-2 rounded-lg transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
              <Award className="h-3.5 w-3.5" />Bonificação
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex-1 lg:flex-none justify-center gap-1.5 px-3 py-2 rounded-lg transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
              <MessageSquare className="h-3.5 w-3.5" />Modelos
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex-1 lg:flex-none justify-center gap-1.5 px-3 py-2 rounded-lg transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
              <GitCompareArrows className="h-3.5 w-3.5" />Resumo e Comparativo
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex-1 lg:flex-none justify-center gap-1.5 px-3 py-2 rounded-lg transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
              <Download className="h-3.5 w-3.5" />Backup
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex-1 lg:flex-none justify-center gap-1.5 px-3 py-2 rounded-lg transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
              <History className="h-3.5 w-3.5" />Auditoria
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="goals" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <GoalsTab />
          </TabsContent>
          <TabsContent value="specialists" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <SpecialistsTab />
          </TabsContent>
          <TabsContent value="holidays" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <HolidaysTab />
          </TabsContent>
          <TabsContent value="period" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <AcademicPeriodTab />
          </TabsContent>
          <TabsContent value="bonification" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <BonificationTab />
          </TabsContent>
          <TabsContent value="templates" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <TemplatesTab />
          </TabsContent>
          <TabsContent value="summary" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <CompareTab />
          </TabsContent>
          <TabsContent value="backup" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <BackupTab />
          </TabsContent>
          <TabsContent value="logs" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <AuditLogTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
