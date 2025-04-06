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

      // Check only if token exists, don't block dashboard access based on verification
      if (!tokenData || !tokenData.data) {
        navigate('/login', {
          replace: true,
          state: { from: location }
        });
        setIsVerified(false);
        return;
      }

      // Restricted paths that require verification
      const restrictedPaths = [
        '/dashboard/add-products',
        '/dashboard/edit-product',
        '/dashboard/livestreaming',
        '/dashboard/live-streams/create-live-auction',
        '/dashboard/live-streams/create-live-show',
        '/dashboard/live-streams/live-stream-studio'
      ];

      // Check if current path is restricted and user is unverified
      const currentPath = location.pathname;
      const isRestrictedPath = restrictedPaths.some(path => currentPath.startsWith(path));
      
      if (isRestrictedPath && sellerData && sellerData.isVerified === false) {
        toast.error('Verification Required', {
          description: 'Complete your verification to access this feature',
          style: {
            background: '#17171B',
            color: '#fff',
          }
        });
        
        // Redirect to dashboard home where verification dialog will appear
        navigate('/dashboard/home', { replace: true });
        setIsVerified(true);
        setIsLoading(false);
        return;
      }

      // Allow access to dashboard with token, regardless of verification status for non-restricted pages
      setIsVerified(true);
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