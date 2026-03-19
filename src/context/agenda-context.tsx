'use client';

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import type { AgendaTask } from '@/lib/types';
import { saveData } from '@/lib/actions';
import { useLocation } from './location-context';

interface AgendaContextType {
  tasks: AgendaTask[];
  setTasks: Dispatch<SetStateAction<AgendaTask[]>>;
}

const AgendaContext = createContext<AgendaContextType | undefined>(undefined);

export const AgendaProvider = ({ children, initialData }: { children: ReactNode, initialData: AgendaTask[] }) => {
  const { location } = useLocation();
  const [tasks, setTasks] = useState<AgendaTask[]>(initialData);

  useEffect(() => {
    setTasks(initialData);
  }, [initialData]);

  const setTasksAndSave: Dispatch<SetStateAction<AgendaTask[]>> = (value) => {
    if (!location) return;
    const newValue = typeof value === 'function' ? value(tasks) : value;
    setTasks(newValue);
    saveData('agenda', location, newValue, ['/admin', '/agenda']);
  };

  return (
    <AgendaContext.Provider value={{ tasks, setTasks: setTasksAndSave }}>
      {children}
    </AgendaContext.Provider>
  );
};

export const useAgenda = () => {
  const context = useContext(AgendaContext);
  if (context === undefined) {
    throw new Error('useAgenda must be used within a AgendaProvider');
  }
  return context;
};
