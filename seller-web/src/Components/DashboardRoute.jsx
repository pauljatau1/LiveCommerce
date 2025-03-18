import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useAuthContext } from '../Hooks/useAuthContext';

const DashboardRoute = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, seller: contextSeller } = useAuthContext();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const storedToken = localStorage.getItem('sellerToken');
      const tokenData = storedToken ? JSON.parse(storedToken) : token;
      const seller = localStorage.getItem('seller');
      const sellerData = seller ? JSON.parse(seller) : contextSeller;

      if (!tokenData.isVerified) {
        if (sellerData?.onboardingProcess) {
          navigate(`/onboarding/${sellerData.onboardingProcess}`, { replace: true });
          toast.info('Account not verified', {
            description: 'Your account has not been approved yet',
            style: {
              background: '#17171B',
              color: '#fff',
            }
          });
        } else {
          navigate('/login', {
            replace: true,
            state: { from: location }
          });
        }
        setIsVerified(false);
      } else {
        setIsVerified(true);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate, location]);

  if (isLoading) {
    return null; // Or a loading spinner if you prefer
  }

  if (!isVerified) {
    return null;
  }

  return children;
};

DashboardRoute.propTypes = {
  children: PropTypes.node.isRequired
};

export default DashboardRoute; 