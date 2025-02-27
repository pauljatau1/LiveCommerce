import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8000/api';

function AuthComponent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [expoPushToken, setExpoPushToken] = useState(null);
  const navigate = useNavigate();

  // Check for authentication on mount and URL params
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('Checking auth status...'); // Debug log
      console.log('Current URL:', window.location.href); // Debug log
      
      const params = new URLSearchParams(window.location.search);
      const newToken = params.get('token');
      const userData = params.get('user');
      const error = params.get('error');

      console.log('URL Parameters:', { newToken, userData, error }); // Debug log

      if (error) {
        setError(`Authentication failed: ${error}`);
        setLoading(false);
        return;
      }

      if (newToken && userData) {
        try {
          const parsedUser = JSON.parse(decodeURIComponent(userData));
          console.log('Successfully parsed user data:', parsedUser); // Debug log

          // Store authentication data
          localStorage.setItem('token', newToken);
          setToken(newToken);
          setUser(parsedUser);
          setIsAuthenticated(true);

          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);

          // Fetch fresh profile data
          await fetchProfile(newToken);
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
          setError('Failed to process authentication data');
        }
      } else {
        // Check for existing token
        const storedToken = localStorage.getItem('token');
        console.log('Stored token:', storedToken); // Debug log

        if (storedToken) {
          setToken(storedToken);
          await fetchProfile(storedToken);
        }
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setError('Authentication check failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (authToken) => {
    if (!authToken) {
      console.error('No token provided to fetchProfile');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching profile with token:', authToken); // Debug log
      
      const response = await axios.get(`${API_BASE_URL}/buyer/profile`, {
        headers: { 
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Profile Response:', response.data); // Debug log
      
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Profile fetch error:', err);
      localStorage.removeItem('token');
      setError('Failed to fetch profile');
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setError(null);
    window.location.href = `${API_BASE_URL}/buyer/auth/google`;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    setExpoPushToken(null);
    navigate('/login');
  };

  // Debug display for development
  useEffect(() => {
    console.log('Current State:', {
      isAuthenticated,
      token,
      user,
      error
    });
  }, [isAuthenticated, token, user, error]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          {!isAuthenticated ? (
            <div className="max-w-md mx-auto">
              <div className="divide-y divide-gray-200">
                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <h2 className="text-2xl font-bold mb-8 text-center">
                    Welcome to Our App
                  </h2>

                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleGoogleLogin}
                    className="w-full mt-4 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center justify-center"
                  >
                    <img
                      src="https://www.google.com/favicon.ico"
                      alt="Google"
                      className="w-4 h-4 mr-2"
                    />
                    Continue with Google
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Welcome!</h2>
                {user?.profileImage?.url && (
                  <img
                    src={user.profileImage.url}
                    alt="Profile"
                    className="w-20 h-20 rounded-full mx-auto mb-4"
                  />
                )}
                <div className="mb-4">
                  <p className="text-lg">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-gray-600">{user?.email}</p>
                </div>

                {/* Debug Information */}
                <div className="mt-4 mb-4 text-left bg-gray-50 p-4 rounded-md">
                  <h3 className="font-semibold mb-2">Debug Info:</h3>
                  <div className="text-xs break-all">
                    <p className="mb-2">
                      <span className="font-semibold">Token:</span> {token}
                    </p>
                    <p>
                      <span className="font-semibold">Expo Push Token:</span>{' '}
                      {expoPushToken || 'Not set'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthComponent;
