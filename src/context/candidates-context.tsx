
'use client';

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import type { Candidate } from '@/lib/types';
import { saveData } from '@/lib/actions';
import { useLocation } from './location-context';

interface CandidatesContextType {
  candidates: Candidate[];
  setCandidates: Dispatch<SetStateAction<Candidate[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  filters: any;
  setFilters: (filters: any) => void;
}

const CandidatesContext = createContext<CandidatesContextType | undefined>(undefined);

export const CandidatesProvider = ({ children, initialData }: { children: ReactNode, initialData: Candidate[] }) => {
  const { location } = useLocation();
  const [candidates, setCandidates] = useState<Candidate[]>(initialData);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({
    search: '',
    status: [],
    course: [],
    regSpec: [],
    enrSpec: [],
    city: [],
    payment: 'all',
    regDate: undefined,
    enrDate: undefined,
  });

  useEffect(() => {
    setCandidates(initialData);
  }, [initialData]);

  const setCandidatesAndSave: Dispatch<SetStateAction<Candidate[]>> = (value) => {
    if (!location) return;
    const newValue = typeof value === 'function' ? value(candidates) : value;
    setCandidates(newValue);
    saveData('candidates', location, newValue, ['/candidates', '/dashboard', '/admin']);
  };

  return (
    <CandidatesContext.Provider value={{ 
        candidates, 
        setCandidates: setCandidatesAndSave,
        selectedId,
        setSelectedId,
        filters,
        setFilters
    }}>
      {children}
    </CandidatesContext.Provider>
  );
};

export const useCandidates = () => {
  const context = useContext(CandidatesContext);
  if (context === undefined) {
    throw new Error('useCandidates must be used within a CandidatesProvider');
  }
  return context;
};
