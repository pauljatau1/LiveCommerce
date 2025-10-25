import { Seller } from '@/types/seller';
import { isAxiosError } from 'axios';
import { useQuery } from '@tanstack/react-query';
import { sellerService } from '@/services/sellerService';
import { useAuthContext } from '@/Hooks/useAuthContextV2';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { tokenUtils, authUtils, sellerUtils } from '@/util/auth';
import { tokenUtils, authUtils, sellerUtils } from '@/util/auth';
import DisabledAccountDialog from '@/Components/DisabledAccountDialog';
import PropTypes from 'prop-types';
import { toast } from 'sonner';
import Loader from '@/Components/Loader';

/**
 * ProtectedRoute component that handles authentication and authorization
 * - Waits for fetchSellerDetails query to complete before making auth decisions
 * - Dispatches seller data to AuthContext for app-wide access
 * - Handles 401 errors and redirects to login
 * - Shows disabled account dialog when account is disabled
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, dispatch } = useAuthContext();
  const [showDisabledDialog, setShowDisabledDialog] = useState(false);
  const [hasAuthenticated, setHasAuthenticated] = useState(false);

  // Define route types for easier checking
  const isSignUpRoute = location.pathname.startsWith('/signup');
  const isLoginRoute = location.pathname.startsWith('/login');
  const isForgotPasswordRoute = location.pathname.startsWith('/forgot-password');
  const isAuthRoute = isSignUpRoute || isLoginRoute || isForgotPasswordRoute;

  // Get token and seller from localStorage for initial check
  const token = tokenUtils.getBearerToken();
  const seller = sellerUtils.getSeller();

  // Fetch seller details from server - only if not on auth routes and we have a token
  const { data, error, isLoading, isFetching } = useQuery({
    queryKey: ['sellerDetails'],
    queryFn: () => sellerService.fetchSellerDetails(),
    enabled: !isAuthRoute && !!token, // Only fetch if not on auth routes and we have a token
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 401 errors
      if (isAxiosError(error) && error.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Handle authentication flow based on query results
  useEffect(() => {
    // Skip authentication logic for auth routes
    if (isAuthRoute) {
      setHasAuthenticated(true);
      return;
    }

    // If we don't have a token or seller in localStorage, redirect to login
    if (!token || !seller) {
      console.log("No token or seller found, redirecting to login");
      navigate('/login', { replace: true });
      return;
    }

    // Wait for the query to complete before making authentication decisions
    if (isLoading || isFetching) {
      return;
    }

    // Handle successful data fetch
    if (data && !error) {
      console.log("Seller details fetched successfully:", data);
      
      // Dispatch AUTH_SUCCESS to update AuthContext with fresh seller data
      dispatch({ 
        type: "AUTH_SUCCESS", 
        payload: { 
          seller: data as Seller, 
          token: tokenUtils.getBearerToken() || "" 
        } 
      });

      // Check if account is disabled
      if (data.isDisabled) {
        console.log("Account is disabled, showing dialog");
        dispatch({ type: "ACCOUNT_DISABLED" });
        setShowDisabledDialog(true);
      }

      setHasAuthenticated(true);
    }

    // Handle 401 Unauthorized error
    if (error && isAxiosError(error) && error.response?.status === 401) {
      console.log("401 Unauthorized error, clearing auth data and redirecting");
      
      // Clear all authentication data
      authUtils.clearAllAuthData();
      
      // Show error toast
      toast.error("Session expired, please login again", {
        style: {
          backgroundColor: '#17171B',
          color: '#F7FAFC',
          fontFamily: 'Inter',
          fontSize: '14px',
          fontWeight: '400',
        }
      });

      // Redirect to login
      navigate('/login', { replace: true });
      return;
    }

    // Handle other errors (network, server errors, etc.)
    if (error && !isAxiosError(error)) {
      console.error("Non-401 error occurred:", error);
    }

  }, [data, error, isLoading, isFetching, isAuthRoute]);


  /**
   * Handle closing the disabled account dialog
   * Logs the user out when they close the dialog
   */
  const handleCloseDisabledDialog = () => {
    setShowDisabledDialog(false);
    logout();
  };

  // Show loading state while waiting for authentication
  if (!hasAuthenticated && !isAuthRoute) {
    return <Loader />;
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

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
