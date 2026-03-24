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

import { doc, onSnapshot } from 'firebase/firestore';
import { clientDb } from '@/lib/firebase';

export const SpecialistsProvider = ({ children, initialData }: { children: ReactNode, initialData: Specialist[] }) => {
  const { location } = useLocation();
  const [specialists, setSpecialists] = useState<Specialist[]>(initialData);

  // Real-time synchronization
  useEffect(() => {
    if (!location) return;

    const docRef = doc(clientDb, 'locations', location, 'data', 'specialists.json');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data().content as Specialist[];
        setSpecialists(data);
      }
    });

    return () => unsubscribe();
  }, [location]);

  const setSpecialistsAndSave: Dispatch<SetStateAction<Specialist[]>> = (value) => {
    if (!location) return;
    const newValue = typeof value === 'function' ? value(specialists) : value;
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
