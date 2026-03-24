'use client';

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import type { Lead } from '@/lib/types';
import { saveData } from '@/lib/actions';
import { useLocation } from './location-context';
import { doc, onSnapshot } from 'firebase/firestore';
import { clientDb } from '@/lib/firebase';

interface LeadsContextType {
  leads: Lead[];
  setLeads: Dispatch<SetStateAction<Lead[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  filters: any;
  setFilters: (filters: any) => void;
}

const LeadsContext = createContext<LeadsContextType | undefined>(undefined);

export const LeadsProvider = ({ children, initialData }: { children: ReactNode, initialData: Lead[] }) => {
  const { location } = useLocation();
  const [leads, setLeads] = useState<Lead[]>(initialData);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({
    status: [],
    course: [],
    unit: [],
    date: undefined,
  });

  // Real-time synchronization
  useEffect(() => {
    if (!location) return;

    const docRef = doc(clientDb, 'locations', location, 'data', 'leads.json');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data().content as Lead[];
        setLeads(data);
      }
    });

    return () => unsubscribe();
  }, [location]);

  const setLeadsAndSave: Dispatch<SetStateAction<Lead[]>> = (value) => {
    if (!location) return;
    const newValue = typeof value === 'function' ? value(leads) : value;
    // We don't call setLeads here because onSnapshot will handle it
    saveData('leads', location, newValue, ['/leads']);
  };

  return (
    <LeadsContext.Provider value={{ 
        leads, 
        setLeads: setLeadsAndSave,
        selectedId,
        setSelectedId,
        filters,
        setFilters
    }}>
      {children}
    </LeadsContext.Provider>
  );
};

export const useLeads = () => {
  const context = useContext(LeadsContext);
  if (context === undefined) {
    throw new Error('useLeads must be used within a LeadsProvider');
  }
  return context;
};
