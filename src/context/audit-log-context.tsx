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

import { doc, onSnapshot } from 'firebase/firestore';
import { clientDb } from '@/lib/firebase';

export const AuditLogProvider = ({ children, initialData }: { children: ReactNode, initialData: AuditLogEntry[] }) => {
  const { location } = useLocation();
  const [logs, setLogs] = useState<AuditLogEntry[]>(initialData);

  // Real-time synchronization
  useEffect(() => {
    if (!location) return;

    const docRef = doc(clientDb, 'locations', location, 'data', 'logs.json');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data().content as AuditLogEntry[];
        setLogs(data);
      }
    });

    return () => unsubscribe();
  }, [location]);

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
