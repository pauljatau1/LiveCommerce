import { useAuthContext } from '../Hooks/useAuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';

const ProtectedRoute = ({children}) => {
  const { isAuthenticated, seller } = useAuthContext();
  const navigate = useNavigate();


  //use effect to check if the user is authenticated and if the seller is logged in, if so, redirect to the dashboard if not, redirect to the login page;
  //if the seller is logged in and the first time, redirect to the onboarding page
  //if the seller is logged in and not the first time, redirect to the dashboard home page
  useEffect(() => {
    //fetch the token from the local storage
    const storedToken = localStorage.getItem('sellerToken');
    const tokenData = storedToken ? JSON.parse(storedToken) : { data: null, firstTime: null };
    
    console.log("Protected Route State:", {
      isAuthenticated,
      seller,
      tokenData,
      condition: !isAuthenticated && seller === null && tokenData.data === null
    });

    //if the seller is not authenticated and not logged in, redirect to the login page
    if (!isAuthenticated && seller === null && tokenData.data === null) {
      navigate('/', { replace: true });
    } else if (tokenData.data && tokenData.firstTime) {
      //if the seller is logged in and the first time, redirect to the onboarding page
      const onboardingStep = JSON.parse(localStorage.getItem('onboardingProcess'));
      console.log("Onboarding Step:", onboardingStep);
      if (onboardingStep) {
        navigate(`/dashboard/${onboardingStep.step}`, { replace: true });
        setTimeout(() => {
          toast.success('Continue Onboarding', {
            description: 'Continue from where you left off',
            style: {
                background: '#05031F',
                color: '#fff',
            }
        });
        }, 5000);
      } else {
        navigate('/dashboard/onboarding', { replace: true });
      }
    } else if (tokenData.data) {
      navigate('/dashboard/home', { replace: true });
    }
  }, [isAuthenticated, seller, navigate]);

  return children;
}

export default ProtectedRoute
