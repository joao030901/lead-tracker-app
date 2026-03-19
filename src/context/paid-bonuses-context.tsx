
'use client';

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import { saveData } from '@/lib/actions';
import { useLocation } from './location-context';
import { PaidBonusesData } from '@/lib/types';


interface PaidBonusesContextType {
  paidBonuses: PaidBonusesData;
  setPaidBonuses: Dispatch<SetStateAction<PaidBonusesData>>;
}

const PaidBonusesContext = createContext<PaidBonusesContextType | undefined>(undefined);

export const PaidBonusesProvider = ({ children, initialData }: { children: ReactNode, initialData: PaidBonusesData }) => {
  const { location } = useLocation();
  const [paidBonuses, setPaidBonuses] = useState<PaidBonusesData>(initialData);

  useEffect(() => {
    setPaidBonuses(initialData);
  }, [initialData]);

  const setPaidBonusesAndSave: Dispatch<SetStateAction<PaidBonusesData>> = (value) => {
    if (!location) return;
    const newValue = typeof value === 'function' ? value(paidBonuses) : value;
    setPaidBonuses(newValue);
    saveData('paid-bonuses', location, newValue, ['/admin']);
  };

  return (
    <PaidBonusesContext.Provider value={{ paidBonuses, setPaidBonuses: setPaidBonusesAndSave }}>
      {children}
    </PaidBonusesContext.Provider>
  );
};

export const usePaidBonuses = () => {
  const context = useContext(PaidBonusesContext);
  if (context === undefined) {
    throw new Error('usePaidBonuses must be used within a PaidBonusesProvider');
  }
  return context;
};
