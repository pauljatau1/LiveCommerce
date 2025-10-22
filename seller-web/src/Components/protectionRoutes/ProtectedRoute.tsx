import { Seller } from '@/types/seller';
import { AxiosError, isAxiosError } from 'axios';
import { useQuery } from '@tanstack/react-query';
import { sellerService } from '@/services/sellerService';
import { useAuthContext } from '@/Hooks/useAuthContextV2';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { tokenUtils, authUtils } from '@/util/auth';
import DisabledAccountDialog from '@/Components/DisabledAccountDialog';
import PropTypes from 'prop-types';
import { toast } from 'sonner';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAccountDisabled, logout, dispatch } = useAuthContext();
  const [showDisabledDialog, setShowDisabledDialog] = useState(false);

  // Define route types for easier checking
  const isSignUpRoute = location.pathname.startsWith('/signup');
  const isLoginRoute = location.pathname.startsWith('/login');
  const isForgotPasswordRoute = location.pathname.startsWith('/forgot-password');
  const isAuthRoute = isSignUpRoute || isLoginRoute || isForgotPasswordRoute;


  const { data, error, isLoading, isFetching } = useQuery({
    queryKey: ['sellerDetails'],
    queryFn: () => sellerService.fetchSellerDetails(),
    enabled: !isAuthRoute,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  console.log("seller details data", data);

  // handle auth success and check if seller is disabled
  useEffect(() => {
    if (data) {
      dispatch({ type: "AUTH_SUCCESS", payload: { seller: data as Seller, token: tokenUtils.getBearerToken() || "" } })
      if (data?.isDisabled) {
        dispatch({ type: "ACCOUNT_DISABLED" });
      }
    }
  }, [data])

  // Handle 401 errors from sellerDetails query
  useEffect(() => {
    // Avoid acting while loading/fetching to prevent premature redirects
    if (isLoading || isFetching) return;

    // Only act on explicit 401 Unauthorized from Axios
    if (error && isAxiosError(error) && (error as AxiosError).response?.status === 401) {
      authUtils.clearAllAuthData();

      toast.error("Session expired, please login again", {
        style: {
          backgroundColor: '#17171B',
          color: '#F7FAFC',
          fontFamily: 'Inter',
          fontSize: '14px',
          fontWeight: '400',
        }
      });

      navigate('/login', { replace: true });
    }
  }, [error, isLoading, isFetching, navigate]);


  // Handle disabled account dialog
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
