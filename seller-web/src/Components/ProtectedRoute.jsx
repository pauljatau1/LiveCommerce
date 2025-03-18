import { useAuthContext } from '../Hooks/useAuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { BASE_URL } from '../Constants/Server';
import axios from 'axios';

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchSellerDetails, seller: contextSeller, token } = useAuthContext();

  console.log('Protected route activated')
  console.log('contextSeller', contextSeller)
  console.log('context token', token)

  useEffect(() => {
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
  }, []);




  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    const storedToken = localStorage.getItem('sellerToken');
    const tokenData = storedToken ? JSON.parse(storedToken) : token;
    const seller = localStorage.getItem('seller');
    const sellerData = seller ? JSON.parse(seller) : contextSeller

    const isDashboardRoute = location.pathname.startsWith('/dashboard');
    const isSignUpRoute = location.pathname.startsWith('/signup');
    const isOnboardingRoute = location.pathname.startsWith('/onboarding');

    const checkTokenValidity = async () => {
      try {
        if (tokenData?.data) {
          const response = await axios.get(`${BASE_URL}/seller/check-token`, {
            headers: {
              Authorization: `Bearer ${tokenData.data}`
            },
            signal
          });

          console.log('token validity response', response)
          console.log('validity', response)
          if (response.status === 200) {
            if (tokenData?.isVerified === false) {
              if (sellerData?.onboardingProcess) {
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
              } else {
                navigate('/onboarding/profile');
                toast.error('Please complete the onboarding process', {
                  description: 'Complete process is required',
                  style: {
                    background: '#17171B',
                    color: '#fff',
                  }
                });
              }
            } else if (tokenData?.isVerified === true && !isDashboardRoute) {
              navigate('/dashboard/home', { replace: true });
            }
          } else {
            navigate('/login');
          }
        } else {
          if (isSignUpRoute) {
            navigate('/signup');
          } else {
            navigate('/login');
          }

        }
      } catch (error) {
        console.log('token invalid error', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('sellerToken');
          localStorage.removeItem('seller');
          localStorage.removeItem('onboardingProcess');
          localStorage.removeItem('visitorId')
          navigate('/login');
          toast.error('Session expired', {
            description: 'Please login again',
            style: {
              background: '#17171B',
              color: '#fff',
            }
          });
        }
      }
    };

    checkTokenValidity();
    return () => controller.abort();
  }, [navigate]);

  return children;
};

export default ProtectedRoute
