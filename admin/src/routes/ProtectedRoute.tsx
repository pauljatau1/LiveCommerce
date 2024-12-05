import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/authContext';
import { LoadingSpinner } from '@/components/layouts/LoadingSpinner';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;