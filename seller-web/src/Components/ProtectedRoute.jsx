import { useAuthContext } from '../Hooks/useAuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BASE_URL } from '../Constants/Server';
import { fetchOnboardingProcess } from '../Utilities/apiRestaurant';
import axios from 'axios';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, seller } = useAuthContext();
  const navigate = useNavigate();
  const [tokenData, setTokenData] = useState({ data: null, isVerified: null });
  const [onboardingStep, setOnboardingStep] = useState("");


  //use effect to check if the user is authenticated and if the seller is logged in, if so, redirect to the dashboard if not, redirect to the login page;
  //if the seller is logged in and the first time, redirect to the onboarding page
  //if the seller is logged in and not the first time, redirect to the dashboard home page
  //fetch the token from the local storage
  useEffect(() => {
    const storedToken = localStorage.getItem('sellerToken');
    setTokenData(storedToken ? JSON.parse(storedToken) : { data: null, isVerified: null });
  }, []);

  //check if token is valid
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    const checkTokenValidity = async () => {
      const storedToken = localStorage.getItem('sellerToken');
      const tokenData = storedToken ? JSON.parse(storedToken) : { data: null, isVerified: null };
      console.log("Token Data:", tokenData.data);
      try {
        const response = await axios.get(`${BASE_URL}/seller/check-token`, {
          headers: {
            Authorization: `Bearer ${tokenData.data}`
          }
        }, { signal });
        if (response.status === 200) {
          console.log("Token is valid");
        } else if (response.status === 401) {
          console.log("Token is invalid");
          toast.error("Token is invalid", {
            description: "Please login again",
            style: {
              background: '#05031F',
              color: '#fff',
            }
          });
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.log(error);
        toast.error('Token Verification Failed', {
          description: error.response?.data?.message || error.message,
          style: {
            background: '#05031F',
            color: '#fff',
          }
        });
      }
    }

    if (tokenData.data) {
      checkTokenValidity();
    }
    return () => controller.abort();
  }, []);


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
    const storedToken = localStorage.getItem('sellerToken');
    const tokenData = storedToken ? JSON.parse(storedToken) : { data: null, isVerified: null };
    if (tokenData?.data && tokenData?.isVerified === false && onboardingStep !== "") {
      //if the seller is logged in and the first time, redirect to the onboarding page
      if (onboardingStep !== "" || onboardingStep !== null || onboardingStep !== undefined) {
        navigate(`/dashboard/${onboardingStep}`, { replace: true });
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
        navigate('/dashboard/onboarding', { replace: true });
      }
    } else if (tokenData?.data && tokenData?.isVerified === true) {
      navigate('/dashboard/home', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate, onboardingStep, isAuthenticated]);

  return children;
}

export default ProtectedRoute
