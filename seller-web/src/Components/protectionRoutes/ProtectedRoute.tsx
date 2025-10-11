import { Seller } from '@/types/seller';
import { useQuery } from '@tanstack/react-query';
import { sellerService } from '@/services/sellerService';
import { useAuthContext } from '@/Hooks/useAuthContextV2';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { tokenUtils, sellerUtils, authUtils } from '@/util/auth';
import DisabledAccountDialog from '@/Components/DisabledAccountDialog';
import PropTypes from 'prop-types';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { seller, isAuthenticated, isAccountDisabled, logout, dispatch } = useAuthContext();
  const [showDisabledDialog, setShowDisabledDialog] = useState(false);

  // Define route types for easier checking
  const isSignUpRoute = location.pathname.startsWith('/signup');
  const isLoginRoute = location.pathname.startsWith('/login');
  const isAuthRoute = isSignUpRoute || isLoginRoute;


  const { data } = useQuery({
    queryKey: ['sellerDetails'],
    queryFn: () => sellerService.fetchSellerDetails(),
    enabled: !isAuthRoute,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 5,
    retryDelay: 7000,
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
