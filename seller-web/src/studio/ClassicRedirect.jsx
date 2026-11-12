import { Navigate, useLocation } from 'react-router-dom';
import { studioDestination } from '@/config/featureFlags';
export default function ClassicRedirect() {
  const location = useLocation();
  return <Navigate replace to={studioDestination(location.pathname)} state={{...location.state,studioRedirect:true}} />;
}
