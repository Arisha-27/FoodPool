import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from 'sonner';

// Standardized Interface
export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

interface LocationContextType {
  location: Location | null;
  isLoading: boolean;
  error: string | null;
  requestLocation: () => void;
  setLocation: (location: Location) => void; // 🟢 ADDED THIS
  distanceFilter: number;
  setDistanceFilter: (distance: number) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Initialize from LocalStorage
  const [location, setLocationState] = useState<Location | null>(() => {
    try {
      const saved = localStorage.getItem('foodpool_location');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [distanceFilter, setDistanceFilter] = useState(5);

  // 2. Helper to update State + LocalStorage
  const setLocation = (newLoc: Location) => {
    setLocationState(newLoc);
    localStorage.setItem('foodpool_location', JSON.stringify(newLoc));
  };

  // 3. Function to get real GPS coordinates
  const requestLocation = () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      const msg = 'Geolocation is not supported by your browser';
      setError(msg);
      toast.error(msg);
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        const newLocation = {
          latitude,
          longitude,
          address: 'Current Location', 
        };

        setLocation(newLocation); // Uses our helper above
        toast.success("Location updated!");
        setIsLoading(false);
      },
      (err) => {
        console.error(err);
        const msg = 'Unable to retrieve location.';
        setError(msg);
        setIsLoading(false);
        
        // Note: We DO NOT force a default location here anymore.
        // We let the Discover page handle the fallback logic.
      },
      { enableHighAccuracy: true }
    );
  };

  // 4. Auto-request on first load if empty
  useEffect(() => {
    if (!location) {
      requestLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        isLoading,
        error,
        requestLocation,
        setLocation, // 🟢 Exposed to the app
        distanceFilter,
        setDistanceFilter,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};