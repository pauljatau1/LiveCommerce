import { useAuthContext } from '../Contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

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
      navigate('/dashboard/onboarding', { replace: true });
    } else if (tokenData.data) {
      navigate('/dashboard/home', { replace: true });
    }
  }, [isAuthenticated, seller, navigate]);

  return children;
}

export default ProtectedRoute
