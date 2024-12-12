import { useAuthContext } from '../Contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const ProtectedRoute = ({children}) => {
  const { isAuthenticated, user } = useAuthContext();
  const navigate = useNavigate();

  // fetch the user and authenticated status from the auth context if false or null, redirect to the login page

  useEffect(() => {
    if (!isAuthenticated && user === null) {
        navigate('/');
      }
  }, [isAuthenticated, user, navigate]);

  return children

}

export default ProtectedRoute
