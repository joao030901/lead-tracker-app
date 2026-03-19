'use client';

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';

type Location = string;

interface LocationContextType {
  location: Location | null;
  setLocation: (location: Location) => void;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [location, setLocationState] = useState<Location | null>(null);

  useEffect(() => {
    // This code runs only on the client-side
    const storedLocation = localStorage.getItem('app_location') as Location | null;
    if (storedLocation) {
      setLocationState(storedLocation);
    }
  }, []);

  const setLocation = (newLocation: Location) => {
    localStorage.setItem('app_location', newLocation);
    setLocationState(newLocation);
  };
  
  const clearLocation = () => {
    localStorage.removeItem('app_location');
    setLocationState(null);
  };

  return (
    <LocationContext.Provider value={{ location, setLocation, clearLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
