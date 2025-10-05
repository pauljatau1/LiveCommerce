/**
 * Global type declarations for the application
 * Extends the Window interface to include third-party libraries
 */

declare global {
  interface Window {
    cioanalytics?: {
      identify: (userId: string, traits: Record<string, any>) => void;
      track: (eventName: string, properties: Record<string, any>) => void;
    };
    initClarity?: (config: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    }) => void;
  }
}

export {};
