import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userData = params.get('user');

    if (token && userData) {
      try {
        // Store the token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', userData);
        
        // Redirect to profile page
        navigate('/google/profile');
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login?error=callback_failed');
      }
    } else {
      navigate('/login?error=no_auth_data');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

export default AuthCallback;