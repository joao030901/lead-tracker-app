'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { AuditLogEntry } from '@/lib/types';
import { saveData } from '@/lib/actions';
import { v4 as uuidv4 } from 'uuid';
import { useLocation } from './location-context';

interface AuditLogContextType {
  logs: AuditLogEntry[];
  logAction: (action: string, details: string) => Promise<void>;
  clearLogs: () => Promise<void>;
}

const AuditLogContext = createContext<AuditLogContextType | undefined>(undefined);

export const AuditLogProvider = ({ children, initialData }: { children: ReactNode, initialData: AuditLogEntry[] }) => {
  const { location } = useLocation();
  const [logs, setLogs] = useState<AuditLogEntry[]>(initialData);

  useEffect(() => {
    setLogs(initialData);
  }, [initialData]);

  const logAction = async (action: string, details: string) => {
    if (!location) return;
    const newLogEntry: AuditLogEntry = {
        id: uuidv4(),
        date: new Date().toISOString(),
        action,
        details,
    };
    const newLogs = [newLogEntry, ...logs];
    setLogs(newLogs);
    await saveData('logs', location, newLogs, ['/admin']);
  };

  const clearLogs = async () => {
    if (!location) return;
    setLogs([]);
    await saveData('logs', location, [], ['/admin']);
  };

  return (
    <AuditLogContext.Provider value={{ logs, logAction, clearLogs }}>
      {children}
    </AuditLogContext.Provider>
  );
};

export const useAuditLog = () => {
  const context = useContext(AuditLogContext);
  if (context === undefined) {
    throw new Error('useAuditLog must be used within an AuditLogProvider');
  }
  return context;
};
