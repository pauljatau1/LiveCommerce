import { useContext } from 'react';
import { OnboardingContext } from '../Contexts/OnboardingContext';

const useOnboardingContext = () => {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error("useOnboardingContext must be used within an OnboardingProvider");
    }
    return context;
}

export { useOnboardingContext };