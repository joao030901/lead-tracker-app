'use client';

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import type { Specialist } from '@/lib/types';
import { saveData } from '@/lib/actions';
import { useLocation } from './location-context';

interface SpecialistsContextType {
  specialists: Specialist[];
  setSpecialists: Dispatch<SetStateAction<Specialist[]>>;
}

const SpecialistsContext = createContext<SpecialistsContextType | undefined>(undefined);

export const SpecialistsProvider = ({ children, initialData }: { children: ReactNode, initialData: Specialist[] }) => {
  const { location } = useLocation();
  const [specialists, setSpecialists] = useState<Specialist[]>(initialData);

  useEffect(() => {
    setSpecialists(initialData);
  }, [initialData])

  const setSpecialistsAndSave: Dispatch<SetStateAction<Specialist[]>> = (value) => {
    if (!location) return;
    const newValue = typeof value === 'function' ? value(specialists) : value;
    setSpecialists(newValue);
    saveData('specialists', location, newValue, ['/admin', '/dashboard', '/candidates']);
  };

  return (
    <SpecialistsContext.Provider value={{ specialists, setSpecialists: setSpecialistsAndSave }}>
      {children}
    </SpecialistsContext.Provider>
  );
};

export const useSpecialists = () => {
  const context = useContext(SpecialistsContext);
  if (context === undefined) {
    throw new Error('useSpecialists must be used within a SpecialistsProvider');
  }
  return context;
};
