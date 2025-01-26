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
  const { isAuthenticated, seller } = useAuthContext();
  const [onboardingStep, setOnboardingStep] = useState("");



  //use effect to check if the user is authenticated and if the seller is logged in, if so, redirect to the dashboard if not, redirect to the login page;
  //if the seller is logged in and the first time, redirect to the onboarding page
  //if the seller is logged in and not the first time, redirect to the dashboard home page
  //fetch the token from the local storage

  useEffect(() => {
    const getOnboardingProcess = async () => {
      try {
        const response = await fetchOnboardingProcess();
        console.log("Onboarding Process:", response);
        setOnboardingStep(response.onboardingProcess);
      } catch (error) {
        console.error("Error fetching onboarding process:", error);
      }
    };


    getOnboardingProcess();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    const storedToken = localStorage.getItem('sellerToken');
    const tokenData = storedToken ? JSON.parse(storedToken) : { data: null, isVerified: null };
    console.log('tokenData', tokenData) 

    // Check if we're already in a dashboard route
    const isDashboardRoute = location.pathname.startsWith('/dashboard');

    const checkTokenValidity = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/seller/check-token`, {
          headers: {
            Authorization: `Bearer ${tokenData.data}`
          }
        }, { signal });

        console.log('token validity response', response)
        console.log('validity', response)

        if (response.status === 200) {
          if (tokenData?.data) {
            if (tokenData.isVerified === false) {
              if (onboardingStep !== "") {
                navigate(`/${onboardingStep}`);
                setTimeout(() => {
                  toast.success('Continue Onboarding', {
                    description: 'Continue from where you left off',
                    style: {
                      background: '#05031F',
                      color: '#fff',
                    }
                  });
                }, 2500);
              } else {
                toast.error('Please complete the onboarding process', {
                  description: 'All fields are required',
                  style: {
                    background: '#05031F',
                    color: '#fff',
                  }
                });
                navigate('/onboarding');
              }
            } else if (tokenData.isVerified === true) {
              if (!isDashboardRoute) {
                navigate('/dashboard/home', { replace: true });
              }
            }
          } else {
            navigate('/login');
          }
        }
      } catch (error) {
        if (error.response.status === 401) {
          console.log("Token is invalid", error);
          toast.error("Token is invalid", {
            description: error.response?.data?.message || error.message,
            style: {
              background: '#05031F',
              color: '#fff',
            }
          });
          navigate('/');
        }
      }
    }

    if (tokenData.data) {
      // Only check token validity if not in dashboard route
      checkTokenValidity();
    } else if (!tokenData.data) {
      navigate('/');
      toast.error("Token is invalid", {
        description: "Please login again",
        style: {
          background: '#05031F',
          color: '#fff',
        }
      });
    }

    return () => controller.abort();
  }, [navigate, isAuthenticated, onboardingStep, seller]);

  return children;
}

export default ProtectedRoute
