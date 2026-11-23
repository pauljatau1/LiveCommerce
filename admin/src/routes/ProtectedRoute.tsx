import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/authContext';
import { LoadingSpinner } from '@/components/layouts/LoadingSpinner';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, unreachable } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user && unreachable) {
    return (
      <div role="alert" className="mx-auto mt-24 max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
        <h2 className="text-lg font-semibold text-white">Can't reach the server</h2>
        <p className="mt-2 text-sm text-zinc-400">You're still signed in. Check your connection, then try again.</p>
        <button type="button" className="mt-4 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;