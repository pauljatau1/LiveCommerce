import { useNavigate, useLocation, redirect } from 'react-router-dom';
import { toast } from 'sonner';

const DashboardRoute = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Synchronous check before rendering
  const storedToken = localStorage.getItem('sellerToken');
  const tokenData = storedToken ? JSON.parse(storedToken) : { data: null, isVerified: null };
  const seller = localStorage.getItem('seller');
  const sellerData = seller ? JSON.parse(seller) : {}

  if (!tokenData.data || !tokenData.isVerified) {
    toast.error('Unauthorized access', {
      description: 'Please login to continue',
      style: {
        background: '#05031F',
        color: '#fff',
      }
    });

    if (sellerData?.onboardingProcess !== "") {
      navigate(`/onboarding/${sellerData?.onboardingProcess}`);
      return null; // Prevent rendering children
    } else {
      navigate(`/login`, {
        replace: true,
        state: { from: location }
      });
    }

    return null; // Prevent rendering children
  }


  return children;
};

// Add loader function for route pre-validation
export async function Loader() {
  const storedToken = localStorage.getItem('sellerToken');
  const tokenData = storedToken ? JSON.parse(storedToken) : { data: null, isVerified: null };

  if (!tokenData.data || !tokenData.isVerified) {
    return redirect('/login');
  }
  return null;
}

export default DashboardRoute; 