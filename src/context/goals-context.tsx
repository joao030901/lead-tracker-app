
'use client';

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import type { Goal, Candidate } from '@/lib/types';
import { useAcademicPeriod } from './academic-period-context';
import { isWithinInterval, parseISO } from 'date-fns';
import { useCandidates } from './candidates-context';
import { saveData } from '@/lib/actions';
import { useLocation } from './location-context';

interface GoalsContextType {
  goals: Goal[];
  setGoals: Dispatch<SetStateAction<Goal[]>>;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

const defaultGoals: Omit<Goal, 'achieved'>[] = [
    { id: '1', type: 'Registrations', target: 0 },
    { id: '2', type: 'Enrollments', target: 0 },
    { id: '3', type: 'Engagement', target: 0 },
];

const updateAchieved = (currentGoals: Goal[], candidates: Candidate[], startDate?: Date, endDate?: Date) => {
  if (!startDate || !endDate) return currentGoals.map(g => ({ ...g, achieved: 0 }));

  const filteredCandidates = candidates.filter(c => {
    try {
      const regDate = parseISO(c.registrationDate);
      return isWithinInterval(regDate, { start: startDate, end: endDate });
    } catch {
      return false;
    }
  });

  const totalRegistrations = filteredCandidates.length;
  
  const enrolledOrOnceEnrolledCandidates = filteredCandidates.filter(c => {
      if (!c.enrollmentDate) return false;
      try {
          const enrollmentDate = parseISO(c.enrollmentDate);
          return isWithinInterval(enrollmentDate, { start: startDate, end: endDate });
      } catch { return false; }
  });
  const totalEnrollments = enrolledOrOnceEnrolledCandidates.length;

  const totalEngaged = enrolledOrOnceEnrolledCandidates.filter(c => c.firstPaymentPaid === true).length;


  return currentGoals.map(goal => {
      if (goal.type === 'Registrations') {
        return { ...goal, achieved: totalRegistrations };
      }
      if (goal.type === 'Enrollments') {
        return { ...goal, achieved: totalEnrollments };
      }
       if (goal.type === 'Engagement') {
        return { ...goal, achieved: totalEngaged };
      }
      return goal;
    });
};

export const GoalsProvider = ({ children, initialData }: { children: ReactNode, initialData: Goal[] }) => {
  const { location } = useLocation();
  const [goals, setGoals] = useState<Goal[]>(initialData);
  const { candidates } = useCandidates();
  const { startDate, endDate } = useAcademicPeriod();

  useEffect(() => {
    if (initialData.length === 0 && location) {
        const newGoals = defaultGoals.map(g => ({...g, achieved: 0}));
        setGoals(newGoals);
        saveData('goals', location, newGoals.map(({id, type, target}) => ({id, type, target})), ['/admin', '/dashboard']);
    } else {
        const goalsToSet = defaultGoals.map(dg => {
            const existingGoal = initialData.find(ig => ig.type === dg.type);
            return existingGoal ? { ...dg, ...existingGoal, achieved: 0 } : { ...dg, achieved: 0 };
        });
        setGoals(goalsToSet);
    }
  }, [initialData, location]);

  useEffect(() => {
    if (goals.length > 0 && startDate && endDate) {
      const updatedGoals = updateAchieved(goals, candidates, startDate, endDate);
      const hasChanged = updatedGoals.some((ug, index) => ug.achieved !== goals[index]?.achieved);
      if (hasChanged) {
        setGoals(updatedGoals);
      }
    } else if (goals.length > 0 && (!startDate || !endDate)) {
      // Reset achieved when there is no period
      const resetGoals = goals.map(g => ({...g, achieved: 0}));
      const hasChanged = resetGoals.some((rg, index) => rg.achieved !== goals[index]?.achieved);
       if (hasChanged) {
        setGoals(resetGoals);
      }
    }
  }, [candidates, startDate, endDate, goals]);

  const setGoalsAndSave: Dispatch<SetStateAction<Goal[]>> = (value) => {
    if (!location) return;
    const newValue = typeof value === 'function' ? value(goals) : value;
    setGoals(newValue);
    const dataToSave = newValue.map(({ id, type, target }) => ({ id, type, target }));
    saveData('goals', location, dataToSave, ['/admin', '/dashboard']);
  };

  return (
    <GoalsContext.Provider value={{ goals, setGoals: setGoalsAndSave }}>
      {children}
    </GoalsContext.Provider>
  );
};

export const useGoals = () => {
  const context = useContext(GoalsContext);
  if (context === undefined) {
    throw new Error('useGoals must be used within a GoalsProvider');
  }
  return context;
};
