import { useAuthContext } from '../Hooks/useAuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BASE_URL } from '../Constants/Server';
import { fetchOnboardingProcess } from '../Utilities/apiRestaurant';
import axios from 'axios';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, checkTokenValidity } = useAuthContext();
  const navigate = useNavigate();
  const [onboardingStep, setOnboardingStep] = useState("");
  const [isTokenValid, setIsTokenValid] = useState(false);



  //use effect to check if the user is authenticated and if the seller is logged in, if so, redirect to the dashboard if not, redirect to the login page;
  //if the seller is logged in and the first time, redirect to the onboarding page
  //if the seller is logged in and not the first time, redirect to the dashboard home page
  //fetch the token from the local storage

  //check if token is valid
  useEffect(() => {
    const storedToken = localStorage.getItem('sellerToken');
    const tokenData = storedToken ? JSON.parse(storedToken) : { data: null, isVerified: null };
    console.log("Token Data:", tokenData.data);

    if (tokenData.data) {
      checkTokenValidity();
    } else {
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
    if (tokenData?.data && tokenData?.isVerified === false && onboardingStep !== "" && isTokenValid) {
      //if the seller is logged in and the first time, redirect to the onboarding page
      if (onboardingStep !== "" || onboardingStep !== null || onboardingStep !== undefined) {
        navigate(`/${onboardingStep}`, { replace: true });
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
        navigate('/onboarding', { replace: true });
      }
    }
  }, [navigate, onboardingStep, isAuthenticated, isTokenValid]);

  return children;
}

export default ProtectedRoute
