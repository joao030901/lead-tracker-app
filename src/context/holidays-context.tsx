'use client';

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import type { Holiday } from '@/lib/types';
import { saveData } from '@/lib/actions';
import { useLocation } from './location-context';

interface HolidaysContextType {
  holidays: Holiday[];
  setHolidays: Dispatch<SetStateAction<Holiday[]>>;
}

const HolidaysContext = createContext<HolidaysContextType | undefined>(undefined);

export const HolidaysProvider = ({ children, initialData }: { children: ReactNode, initialData: Holiday[] }) => {
  const { location } = useLocation();
  const [holidays, setHolidays] = useState<Holiday[]>(initialData);

  useEffect(() => {
    setHolidays(initialData);
  },[initialData]);

  const setHolidaysAndSave: Dispatch<SetStateAction<Holiday[]>> = (value) => {
    if (!location) return;
    const newValue = typeof value === 'function' ? value(holidays) : value;
    setHolidays(newValue);
    saveData('holidays', location, newValue, ['/admin', '/dashboard']);
  };

  return (
    <HolidaysContext.Provider value={{ holidays, setHolidays: setHolidaysAndSave }}>
      {children}
    </HolidaysContext.Provider>
  );
};

export const useHolidays = () => {
  const context = useContext(HolidaysContext);
  if (context === undefined) {
    throw new Error('useHolidays must be used within a HolidaysProvider');
  }
  return context;
};
