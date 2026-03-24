
'use client';

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import { saveData } from '@/lib/actions';
import { parseISO } from 'date-fns';
import { useLocation } from './location-context';

interface AcademicPeriodContextType {
  startDate: Date | null;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | null;
  setEndDate: (date: Date | undefined) => void;
}

const AcademicPeriodContext = createContext<AcademicPeriodContextType | undefined>(undefined);

type PeriodData = { startDate: string | null; endDate: string | null };

import { doc, onSnapshot } from 'firebase/firestore';
import { clientDb } from '@/lib/firebase';

export const AcademicPeriodProvider = ({ children, initialData }: { children: ReactNode, initialData: PeriodData }) => {
  const { location } = useLocation();
  const [startDate, setStartDate] = useState<Date | null>(initialData.startDate ? parseISO(initialData.startDate) : null);
  const [endDate, setEndDate] = useState<Date | null>(initialData.endDate ? parseISO(initialData.endDate) : null);

  // Real-time synchronization
  useEffect(() => {
    if (!location) return;

    const docRef = doc(clientDb, 'locations', location, 'data', 'academic-period.json');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data().content as PeriodData;
        setStartDate(data.startDate ? parseISO(data.startDate) : null);
        setEndDate(data.endDate ? parseISO(data.endDate) : null);
      }
    });

    return () => unsubscribe();
  }, [location]);

  const handleSetStartDate = (date: Date | undefined) => {
    const newStartDate = date || null;
    setStartDate(newStartDate);
    if (!location) return;
    saveData('academic-period', location, { startDate: newStartDate?.toISOString() || null, endDate: endDate?.toISOString() || null }, ['/admin', '/dashboard']);
  }
  
  const handleSetEndDate = (date: Date | undefined) => {
    const newEndDate = date || null;
    setEndDate(newEndDate);
    if (!location) return;
    saveData('academic-period', location, { startDate: startDate?.toISOString() || null, endDate: newEndDate?.toISOString() || null }, ['/admin', '/dashboard']);
  }

  return (
    <AcademicPeriodContext.Provider value={{ startDate, setStartDate: handleSetStartDate, endDate, setEndDate: handleSetEndDate }}>
      {children}
    </AcademicPeriodContext.Provider>
  );
};

export const useAcademicPeriod = () => {
  const context = useContext(AcademicPeriodContext);
  if (context === undefined) {
    throw new Error('useAcademicPeriod must be used within a AcademicPeriodProvider');
  }
  return context;
};
