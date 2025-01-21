import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../Hooks/useAuthContext';
import { fetchOnboardingProcess } from '../Utilities/apiRestaurant';

const DashboardRoute = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { seller } = useAuthContext();
    const [onboardingStep, setOnboardingStep] = useState("");

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

        if (!tokenData.data || !tokenData.isVerified) {
            // Redirect unverified users to onboarding
            navigate(`/${onboardingStep}`, { replace: true });
            return;
        }
    }, [seller, navigate]);

    return children;
};

export default DashboardRoute; 