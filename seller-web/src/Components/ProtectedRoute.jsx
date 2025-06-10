import { useAuthContext } from '../Hooks/useAuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BASE_URL } from '../Constants/Server';
import axios from 'axios';
import DisabledAccountDialog from './DisabledAccountDialog';
import PropTypes from 'prop-types';

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchSellerDetails, seller: contextSeller, token, dispatch, isAccountDisabled, logout } = useAuthContext();
  const [showDisabledDialog, setShowDisabledDialog] = useState(false);

  // Define route types for easier checking
  const isSignUpRoute = location.pathname.startsWith('/signup');
  const isLoginRoute = location.pathname.startsWith('/login');
  const isAuthRoute = isSignUpRoute || isLoginRoute;
  const sellerDetails = JSON.parse(localStorage.getItem('seller'));
  console.log("sellerDetails", sellerDetails);



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

  useEffect(() => {
    if (!isAuthRoute) {
      const fetchSeller = async () => {
        try {
          await fetchSellerDetails();
        } catch (error) {
          console.error("Error fetching seller details:", error);
          // Handle 404 specifically if needed
          if (error.response?.status === 404) {
            console.log("Seller not found, proceeding with token check");
          }
        }
      }
      fetchSeller();
    }
  }, [isAuthRoute]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    const storedToken = localStorage.getItem('sellerToken');
    const tokenData = storedToken ? JSON.parse(storedToken) : token;
    const seller = localStorage.getItem('seller');
    const sellerData = seller ? JSON.parse(seller) : contextSeller;

    // Check for disabled account in stored data
    if (sellerData?.isDisabled === true) {
      dispatch({ type: 'ACCOUNT_DISABLED' });
      return;
    }

    const checkTokenValidity = async () => {
      try {
        // Skip validation on auth pages
        if (isAuthRoute) {
          return;
        }

        if (!tokenData?.data) {
          // No token, redirect to login (unless already on login/signup)
          if (!isAuthRoute) {
            navigate('/login', { replace: true });
          }
          return;
        }

        // For non-auth pages, validate token
        await axios.get(`${BASE_URL}/seller/check-token`, {
          headers: {
            Authorization: `Bearer ${tokenData.data}`
          },
          signal
        });


      } catch (error) {
        console.log('token invalid error', error);
        if (error.response?.status === 401 && !isAuthRoute) {
          localStorage.removeItem('sellerToken');
          localStorage.removeItem('seller');
          localStorage.removeItem('onboardingProcess');
          localStorage.removeItem('visitorId')
          navigate('/login');

          // Only show error toast for non-auth routes
          if (!isAuthRoute) {
            toast.error('Session expired', {
              description: 'Please login again',
              style: {
                background: '#17171B',
                color: '#fff',
              }
            });
          }
        }
      }
    };

    checkTokenValidity();
    return () => controller.abort();
  }, [navigate, location.pathname]);

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
