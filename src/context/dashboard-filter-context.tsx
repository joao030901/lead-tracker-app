'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useAcademicPeriod } from './academic-period-context';
import { DateRange } from 'react-day-picker';

interface DashboardFilterContextType {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  startDate: Date | null;
  endDate: Date | null;
}

const DashboardFilterContext = createContext<DashboardFilterContextType | undefined>(undefined);

export const DashboardFilterProvider = ({ children }: { children: ReactNode }) => {
  const { startDate: academicStart, endDate: academicEnd } = useAcademicPeriod();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const startDate = dateRange?.from ?? academicStart;
  const endDate = dateRange?.to ?? academicEnd ?? dateRange?.from ?? null;

  return (
    <DashboardFilterContext.Provider value={{ dateRange, setDateRange, startDate, endDate }}>
      {children}
    </DashboardFilterContext.Provider>
  );
};

export const useDashboardFilter = () => {
  const context = useContext(DashboardFilterContext);
  if (context === undefined) {
    throw new Error('useDashboardFilter must be used within a DashboardFilterProvider');
  }
  return context;
};
