import { useEffect }from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../Hooks/useAuthContext';

const OnboardingRoute = ({children}) => {
    const navigate = useNavigate();
    const { seller } = useAuthContext();

    useEffect(() => {
        const fetchOnboardingStep = localStorage.getItem('onboardingProcess');
        const onboardingStep = JSON.parse(fetchOnboardingStep);
        console.log(onboardingStep);

        if (onboardingStep === "" || onboardingStep === null || onboardingStep === undefined) {
            navigate('/dashboard/onboarding', {replace: true})
        } else if (onboardingStep === "business details") {
            navigate('/dashboard/business-information-onboarding', {replace: true})
        }
    }, [seller, navigate])

  return children;
}

export default OnboardingRoute
