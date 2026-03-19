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

export const TemplatesProvider = ({ children, initialData }: { children: ReactNode, initialData: MessageTemplate[] }) => {
  const { location } = useLocation();
  const [templates, setTemplates] = useState<MessageTemplate[]>(initialData);

  useEffect(() => {
    setTemplates(initialData);
  }, [initialData]);

  const setTemplatesAndSave: Dispatch<SetStateAction<MessageTemplate[]>> = (value) => {
    if (!location) return;
    const newValue = typeof value === 'function' ? value(templates) : value;
    setTemplates(newValue);
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
