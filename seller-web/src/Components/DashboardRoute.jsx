import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import PropTypes from 'prop-types';
import { useEffect, useState, useRef } from 'react';
import { useAuthContext } from '../Hooks/useAuthContext';
import { validateToken } from '../util/tokenValidation';
import axios from 'axios';
import DisabledAccountDialog from './DisabledAccountDialog';

const DashboardRoute = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, seller: contextSeller, isAccountDisabled, logout, dispatch } = useAuthContext();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDisabledDialog, setShowDisabledDialog] = useState(false);
  const validationAttemptedRef = useRef(false);
  const abortControllerRef = useRef(null);
  
  // Handle disabled account
  useEffect(() => {
    if (isAccountDisabled) {
      // Add a small delay before showing dialog to prevent analytics errors
      const timer = setTimeout(() => {
        setShowDisabledDialog(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isAccountDisabled]);

  const handleCloseDisabledDialog = () => {
    setShowDisabledDialog(false);
    // Log the user out when they close the dialog
    logout();
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Skip token validation completely on login/signup pages
        const isAuthPage = location.pathname.includes('/login') ||
                          location.pathname.includes('/signup');
                          
                          if (isAuthPage) {
          setIsVerified(true);
          setIsLoading(false);
          return;
        }

        // Check if we have a stored seller and token before proceeding
        const storedToken = localStorage.getItem('sellerToken');
        const tokenData = storedToken ? JSON.parse(storedToken) : token;
        const seller = localStorage.getItem('seller');
        const sellerData = seller ? JSON.parse(seller) : contextSeller;

        // Check for disabled account in stored data
        if (sellerData?.isDisabled === true) {
          dispatch({ type: 'ACCOUNT_DISABLED' });
          setIsLoading(false);
          return;
        }

        // No token - redirect to login
        if (!tokenData || !tokenData.data) {
          navigate('/login', {
            replace: true,
            state: { from: location }
          });
          setIsVerified(false);
          return;
        }

        // Create a new abort controller for this validation request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        
        // Don't validate on every render, only first time or after path changes
        if (!validationAttemptedRef.current) {
          validationAttemptedRef.current = true;

          // Validate token with 5 second timeout
          const timeoutId = setTimeout(() => {
            // If validation takes too long, proceed anyway (prevents blocking UI)
            if (isLoading) {
              console.log('Token validation timed out, continuing anyway');
              setIsVerified(true);
              setIsLoading(false);
            }
          }, 5000);

          try {
            const isTokenValid = await validateToken(tokenData.data, navigate);
            clearTimeout(timeoutId);

            if (!isTokenValid) {
              // The validateToken function already handles redirect and cleanup
              return;
            }
          } catch (error) {
            clearTimeout(timeoutId);
            console.error('Error during token validation:', error);
            // Continue anyway to avoid blocking the UI
          }
        }

        const isPickupAddressRequired = sellerData?.accountType === 'individual' ? sellerData?.hasFilledAddress === false : sellerData?.hasFilledBusinessAddress === false;
        
        // Restricted paths that require verification
        const restrictedPaths = [
          '/dashboard/add-products',
          '/dashboard/edit-product',
          '/dashboard/livestreaming',
          '/dashboard/live-streams/create-live-auction',
          '/dashboard/live-streams/create-live-show',
          '/dashboard/live-streams/live-stream-studio'
        ];

        // Check if current path is restricted and user is unverified
        const currentPath = location.pathname;
        const isRestrictedPath = restrictedPaths.some(path => currentPath.startsWith(path));

        if (isRestrictedPath && sellerData && sellerData.emailVerified === false) {
          toast.error('Email Verification Required', {
            description: 'Verify your email to access this feature',
            style: {
              background: '#17171B',
              color: '#fff',
            }
          });

          // Redirect to dashboard home where verification dialog will appear
          navigate('/dashboard/home', { replace: true });
        } else if (isRestrictedPath && sellerData && isPickupAddressRequired) {
          toast.error('Pickup Address Required', {
            description: 'Register your pickup address to access this feature',
            style: {
              background: '#17171B',
              color: '#fff',
            }
          });

          // Redirect to dashboard home where verification dialog will appear
          navigate('/dashboard/home?pickupAddressRequired=true', { replace: true });
        }

        // Allow access to dashboard with token, regardless of verification status for non-restricted pages
        setIsVerified(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Error in checkAuth:', error);
        // Continue anyway to avoid blocking the UI completely
        setIsVerified(true);
        setIsLoading(false);
      }
    };

    checkAuth();

    // Reset validation flag when path changes
    return () => {
      // Only reset validation flag for dashboard pages, not login/signup
      if (!location.pathname.includes('/login') && !location.pathname.includes('/signup')) {
        validationAttemptedRef.current = false;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [navigate, location.pathname]);

  if (isLoading) {
    return null; // Or a loading spinner if you prefer
  }

  if (!isVerified) {
    return null;
  }

  return (
    <>
      <DisabledAccountDialog
        isOpen={showDisabledDialog}
        onClose={handleCloseDisabledDialog}
      />
      {children}
    </>
  );
};

DashboardRoute.propTypes = {
  children: PropTypes.node.isRequired
};

export default DashboardRoute;