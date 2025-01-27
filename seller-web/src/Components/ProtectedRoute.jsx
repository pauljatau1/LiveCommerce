import { useAuthContext } from '../Hooks/useAuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BASE_URL } from '../Constants/Server';
import { fetchOnboardingProcess } from '../Utilities/apiRestaurant';
import axios from 'axios';

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, seller, fetchSellerDetails } = useAuthContext();
  const [onboardingStep, setOnboardingStep] = useState("");

  // List of public routes that don't need protection
  const publicRoutes = ['/login', '/signup', '/temp/login', '/'];

  useEffect(() => {
    const fetchSellerDetails = async () => {
      await fetchSellerDetails();
    }
    fetchSellerDetails();
  }, []);

  useEffect(() => {
    // Skip token check for public routes


    const controller = new AbortController();
    const signal = controller.signal;
    const storedToken = localStorage.getItem('sellerToken');
    const tokenData = storedToken ? JSON.parse(storedToken) : { data: null, isVerified: null };

    const isDashboardRoute = location.pathname.startsWith('/dashboard');

    const checkTokenValidity = async () => {
      try {
        if (tokenData?.data) {
          const response = await axios.get(`${BASE_URL}/seller/check-token`, {
            headers: {
              Authorization: `Bearer ${tokenData.data}`
            }
          }, { signal });

          console.log('token validity response', response)
          console.log('validity', response)
          if (response.status === 200) {
            if (seller?.isVerified === false) {
              if (seller?.onboardingProcess) {
                navigate(`/${seller?.onboardingProcess}`);
                toast.success('Continue Onboarding', {
                  description: 'Continue from where you left off',
                  style: {
                    background: '#17171B',
                    color: '#fff',
                  }
                });
              } else {
                navigate('/onboarding');
                toast.error('Please complete the onboarding process', {
                  description: 'All fields are required',
                  style: {
                    background: '#17171B',
                    color: '#fff',
                  }
                });
              }
            } else if (seller?.isVerified === true && !isDashboardRoute) {
              navigate('/dashboard/home', { replace: true });
            }
          } else {
            navigate('/temp/login');
          }
        } else {
          navigate('/temp/login');
          toast.error('Session expired', {
            description: 'Please login again',
            style: {
              background: '#17171B',
              color: '#fff',
            }
          });
        }
      } catch (error) {
        navigate('/temp/login');
        toast.error('Authentication error', {
          description: 'Please login again',
          style: {
            background: '#17171B',
            color: '#fff',
          }
        });
      }
    };

    checkTokenValidity();
    return () => controller.abort();
  }, [navigate, seller, location.pathname]);

  return children;
};

export default ProtectedRoute
