'use client';

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import type { MessageTemplate } from '@/lib/types';
import { saveData } from '@/lib/actions';
import { useLocation } from './location-context';

interface TemplatesContextType {
  templates: MessageTemplate[];
  setTemplates: Dispatch<SetStateAction<MessageTemplate[]>>;
}

const TemplatesContext = createContext<TemplatesContextType | undefined>(undefined);

import { doc, onSnapshot } from 'firebase/firestore';
import { clientDb } from '@/lib/firebase';

export const TemplatesProvider = ({ children, initialData }: { children: ReactNode, initialData: MessageTemplate[] }) => {
  const { location } = useLocation();
  const [templates, setTemplates] = useState<MessageTemplate[]>(initialData);

  // Real-time synchronization
  useEffect(() => {
    if (!location) return;

    const docRef = doc(clientDb, 'locations', location, 'data', 'templates.json');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data().content as MessageTemplate[];
        setTemplates(data);
      }
    });

    return () => unsubscribe();
  }, [location]);

  const setTemplatesAndSave: Dispatch<SetStateAction<MessageTemplate[]>> = (value) => {
    if (!location) return;
    const newValue = typeof value === 'function' ? value(templates) : value;
    saveData('templates', location, newValue, ['/admin', '/candidates']);
  };

  return (
    <TemplatesContext.Provider value={{ templates, setTemplates: setTemplatesAndSave }}>
      {children}
    </TemplatesContext.Provider>
  );
};

export const useTemplates = () => {
  const context = useContext(TemplatesContext);
  if (context === undefined) {
    throw new Error('useTemplates must be used within a TemplatesProvider');
  }
  return context;
};
