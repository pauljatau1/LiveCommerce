{/*import React, { useEffect } from 'react';
import { usePathname } from 'expo-router';
import useClarity from '@/hooks/useClarity';


export default function ClarityScreenTracker() {
  const pathname = usePathname();
  const { setScreenName, sendCustomEvent, isInitialized } = useClarity();
  
  useEffect(() => {
    if (isInitialized && pathname) {
      // Clean up the path for better readability in Clarity
      const screenName = getScreenNameFromPath(pathname);
      
      // Set the screen name in Clarity
      setScreenName(screenName);
      
      // Track screen view as an event
      sendCustomEvent('ScreenView', { 
        screen: screenName,
        path: pathname 
      });
      
      console.log('Clarity tracking screen view:', screenName);
    }
  }, [pathname, isInitialized]);
  
  // This component doesn't render anything
  return null;
}


function getScreenNameFromPath(path: string): string {
  if (!path) return 'Unknown';
  
  // Remove leading slash and split by segments
  const segments = path.replace(/^\//, '').split('/');
  
  // Handle special cases
  if (path === '/') return 'Home';
  
  if (segments.length === 0) return 'Unknown';
  
  // Clean up the path segments
  const cleanedSegments = segments.map(segment => {
    // Ignore numeric IDs
    if (/^\d+$/.test(segment)) return 'Detail';
    
    // Convert (root)/(tabs) patterns to more readable names
    if (segment.startsWith('(') && segment.endsWith(')')) {
      return segment.replace(/[()]/g, '');
    }
    
    // Convert kebab-case or snake_case to Title Case
    return segment
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  });
  
  return cleanedSegments.join(' ');
} */}