
'use client';

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import type { Student } from '@/lib/types';
import { saveData, syncCollectionDiff } from '@/lib/actions';
import { useLocation } from './location-context';
import { collection, onSnapshot } from 'firebase/firestore';
import { clientDb } from '@/lib/firebase';

interface StudentsContextType {
  students: Student[];
  setStudents: Dispatch<SetStateAction<Student[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  filters: any;
  setFilters: (filters: any) => void;
}

const StudentsContext = createContext<StudentsContextType | undefined>(undefined);

export const StudentsProvider = ({ children, initialData }: { children: ReactNode, initialData: Student[] }) => {
  const { location } = useLocation();
  const [students, setStudents] = useState<Student[]>(initialData);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({
    search: '',
    course: [],
    situation: [],
    active: 'all',
    module: [],
    type: [],
    day: [],
    defaulter: 'all',
  });

  // Real-time synchronization
  useEffect(() => {
    if (!location) return;

    const colRef = collection(clientDb, 'locations', location, 'students');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Student);
      setStudents(data);
    });

    return () => unsubscribe();
  }, [location]);

  const setStudentsAndSave: Dispatch<SetStateAction<Student[]>> = (value) => {
    if (!location) return;
    const newValue = typeof value === 'function' ? value(students) : value;
    
    // Calculate the diff to avoid rewriting the entire collection and exhausting quota
    const oldMap = new Map(students.map(s => [s.id, s]));
    const toUpdate = newValue.filter(s => JSON.stringify(s) !== JSON.stringify(oldMap.get(s.id)));
    const newIds = new Set(newValue.map(s => s.id));
    const toDeleteIds = students.filter(s => !newIds.has(s.id)).map(s => s.id);

    syncCollectionDiff(location, 'students', toUpdate, toDeleteIds, ['/students']);
  };

  return (
    <StudentsContext.Provider value={{ 
        students, 
        setStudents: setStudentsAndSave,
        selectedId,
        setSelectedId,
        filters,
        setFilters
    }}>
      {children}
    </StudentsContext.Provider>
  );
};

export const useStudents = () => {
  const context = useContext(StudentsContext);
  if (context === undefined) {
    throw new Error('useStudents must be used within a StudentsProvider');
  }
  return context;
};
