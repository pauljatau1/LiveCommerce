import { useAuthContext } from '../Hooks/useAuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BASE_URL } from '../Constants/Server';
import axios from 'axios';
import DisabledAccountDialog from './DisabledAccountDialog';

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchSellerDetails, seller: contextSeller, token, dispatch, isAccountDisabled, logout } = useAuthContext();
  const [showDisabledDialog, setShowDisabledDialog] = useState(false);

  // Define route types for easier checking
  const isDashboardRoute = location.pathname.startsWith('/dashboard');
  const isSignUpRoute = location.pathname.startsWith('/signup');
  const isLoginRoute = location.pathname.startsWith('/login');
  const isOnboardingRoute = location.pathname.startsWith('/onboarding');
  const isAuthRoute = isSignUpRoute || isLoginRoute;

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

    // Check if email is verified (either explicit flag or implied via isVerified)
    const isEmailVerified = sellerData?.emailVerified === true || sellerData?.isVerified === true;

    // If email is not verified and we're not on signup page, redirect to signup for OTP verification
    if (tokenData?.data && sellerData && !isEmailVerified && !isSignUpRoute) {
      console.log('Email not verified, redirecting to signup for OTP verification');

      // Save email to help identify the unverified user
      if (sellerData?.email) {
        dispatch({ type: 'UNVERIFIED_SELLER', payload: sellerData });
      }

      navigate('/signup', { replace: true });

      toast.error('Email verification required', {
        description: 'Please verify your email to continue',
        style: {
          background: '#425466',
          color: '#F7FAFC',
        }
      });

      return;
    }

    // Quick check for token and verified status before proceeding with API call
    if (tokenData?.isVerified === true && isEmailVerified && !isDashboardRoute && !isOnboardingRoute && !isAuthRoute) {
      console.log('User is verified, redirecting to dashboard');
      navigate('/dashboard/home', { replace: true });
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
        const response = await axios.get(`${BASE_URL}/seller/check-token`, {
          headers: {
            Authorization: `Bearer ${tokenData.data}`
          },
          signal
        });

        if (response.status === 200) {
          // Don't allow dashboard access for unverified email
          if (isDashboardRoute && !isEmailVerified) {
            navigate('/signup', { replace: true });
            return;
          }

          // Skip onboarding check for verified users and allow accessing dashboard
          if (isDashboardRoute && isEmailVerified) {
            // Let them access the dashboard without redirecting
            return;
          }

          // If on signup/login page and token is valid & email verified, redirect to dashboard
          if ((isSignUpRoute || isLoginRoute) && isEmailVerified && tokenData?.isVerified === true) {
            navigate('/dashboard/home', { replace: true });
            return;
          }

          // Below checks only for non-dashboard routes
          if (tokenData?.isVerified === false && !isDashboardRoute) {
            if (sellerData?.onboardingProcess && isEmailVerified) {
              if (!isOnboardingRoute) {
                console.log('onboarding process', sellerData?.onboardingProcess)
                navigate(`/onboarding/${sellerData?.onboardingProcess}`);
                toast.success('Continue Onboarding', {
                  description: 'Continue from where you left off',
                  style: {
                    background: '#17171B',
                    color: '#fff',
                  }
                });
              }
            } else if (isEmailVerified) {
              navigate('/dashboard/home');
            }
          } else if (tokenData?.isVerified === true && isEmailVerified && !isDashboardRoute && !isAuthRoute) {
            navigate('/dashboard/home', { replace: true });
          }
        } else if (!isAuthRoute) {
          navigate('/login');
        }
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

export default ProtectedRoute;
