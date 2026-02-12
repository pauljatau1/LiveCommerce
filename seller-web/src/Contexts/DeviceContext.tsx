import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface DeviceContextType {
  isDesktop: boolean;
  isMobile: boolean;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState<boolean>(() => window.innerWidth < 640);

  useEffect(() => {
    let timeoutId: number | undefined;

    const handleResize = () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        const width = window.innerWidth;
        setIsDesktop(width > 1024);
        setIsMobile(width < 640);
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const value = { isDesktop, isMobile };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
}