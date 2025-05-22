import { useEffect, useRef } from 'react';
import { useIntercom } from 'react-use-intercom';

/**
 * Custom hook to hide/show Intercom launcher with improved reliability
 * @param {boolean} hide - Whether to hide the Intercom launcher
 */
export const useIntercomVisibility = (hide = true) => {
  const { update } = useIntercom();
  const intervalRef = useRef(null);

  useEffect(() => {
    // Apply immediate update through react-use-intercom
    update({
      hide_default_launcher: hide,
      verticalPadding: hide ? 20 : 20 // Force UI refresh with the same value
    });

    // For extra reliability, apply directly to window.Intercom
    if (window.Intercom) {
      window.Intercom('update', { hide_default_launcher: hide });
    }

    // Set up a short interval to ensure it gets applied
    // even if Intercom is still initializing
    intervalRef.current = setInterval(() => {
      if (window.Intercom) {
        window.Intercom('update', { hide_default_launcher: hide });
        
        // Also try these more direct methods for extra reliability
        if (hide) {
          // Try both hiding methods
          window.Intercom('hide');
          
          // Force hide the launcher with CSS if all else fails
          const launcher = document.querySelector('.intercom-launcher-frame');
          if (launcher) {
            launcher.style.display = 'none';
          }
        } else {
          window.Intercom('show');
        }
        
        // Clear interval once we've successfully updated
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 250); // Check every 250ms

    // Clean up on unmount
    return () => {
      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Show the launcher again when unmounting
      if (hide && window.Intercom) {
        window.Intercom('update', { hide_default_launcher: false });
      }
    };
  }, [update, hide]);
  
  return null;
}; 