import {Navigate} from 'react-router-dom';
import OnBoardingPage from '../Pages/OnboardingPage/OnBoardingPage';
import BusinessOnboarding from '../Pages/BusinessOnboarding/BusinessOnboarding';
import IndividualOnboarding from '../Pages/IndividualOnboarding/IndividualOnboarding';
import BusinessInformationOnboarding from '../Components/ui/BusinessInformationOnboarding';
import BusinessVerificationOnboarding from '../Components/ui/BusinessVerificationOnboarding';
import BusinessBankOnboarding from '../Components/ui/BusinessBankOnboarding';
import BusinessCategoryOnboarding from '../Components/ui/BusinessCategoryOnboarding';
import ShippingOptionsOnboarding from '../Components/ui/ShippingOptionsOnboarding';
import AccountApproval from '../Components/ui/AccountApproval';
import IndividualVerificationOnboarding from '../Components/ui/IndividualVerificationOnboarding';
import CreateProfile from '../Components/ui/CreateProfile';

export const onboardingRoutes = [
    {index: true, element: <Navigate to="profile" replace/>},

    {path: 'profile', element: <OnBoardingPage/>},
    {path: 'business-onboarding', element: <BusinessOnboarding/>},
    {path: 'individual-onboarding', element: <IndividualOnboarding/>},
    {path: 'business-information-onboarding', element: <BusinessInformationOnboarding/>},
    {path: 'business-verification-onboarding', element: <BusinessVerificationOnboarding/>},
    {path: 'business-bank-onboarding', element: <BusinessBankOnboarding/>},
    {path: 'business-category-onboarding', element: <BusinessCategoryOnboarding/>},
    {path: 'shipping-options-onboarding', element: <ShippingOptionsOnboarding/>},
    {path: 'create-profile', element: <CreateProfile/>},
    {path: 'individual-verification-onboarding', element: <IndividualVerificationOnboarding/>},
    {path: 'account-approval', element: <AccountApproval/>},
];
