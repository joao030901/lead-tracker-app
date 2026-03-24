'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import Cookies from 'js-cookie';

type Location = string;

interface LocationContextType {
  location: Location | null;
  setLocation: (location: Location) => void;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children, initialLocation }: { children: ReactNode, initialLocation: Location | null }) => {
  const [location, setLocationState] = useState<Location | null>(initialLocation);

  const setLocation = (newLocation: Location) => {
    Cookies.set('app_location', newLocation, { expires: 365 });
    setLocationState(newLocation);
  };
  
  const clearLocation = () => {
    Cookies.remove('app_location');
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
