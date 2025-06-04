import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';

const Loader = ({color = '#0BB248'}) => {
  const { pathname } = useLocation();
  
  const isOnboardingRoute = [
    'business-onboarding',
    'individual-onboarding',
    'business-information-onboarding',
    'business-verification-onboarding',
    'business-bank-onboarding',
    'business-category-onboarding',
    'shipping-options-onboarding',
    'individual-verification-onboarding',
    'account-approval'
  ].some(route => pathname.includes(route));

  const loaderColor = isOnboardingRoute ? '#17171B' : color;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-200/5 backdrop-blur-xl">
      <div className="loader w-[45px] aspect-[0.75]" 
           style={{
             '--loader-color': loaderColor
           }}
      ></div>
    </div>
  );
};

Loader.propTypes = {
  color: PropTypes.string
};

export default Loader;