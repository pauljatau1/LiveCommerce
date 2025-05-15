import axios from 'axios';
import { toast } from 'sonner';

/**
 * Sets up global axios interceptors to handle authentication errors consistently
 * @param {function} navigate - React Router navigate function for redirection
 */
export const setupAxiosInterceptors = (navigate) => {
  // Response interceptor to handle auth errors
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // Don't handle cancelled requests as errors
      if (axios.isCancel(error)) {
        return Promise.reject(error);
      }
      
      // Handle authentication errors
      if (error.response?.status === 401 || error.response?.data?.message === "Invalid token") {
        console.log('Auth error detected in axios interceptor:', error.response?.data);
        
        // Check if we're on the login page - don't show session expired there
        const isLoginPage = window.location.pathname.includes('/login') || 
                           window.location.pathname.includes('/signup');
        
        // Check if the user was previously logged in (token exists)
        const wasLoggedIn = localStorage.getItem('sellerToken') !== null;
        
        // Only handle token issues once to avoid multiple toasts/redirects
        // AND only if we're not already on the login page AND user was logged in
        if (!localStorage.getItem('tokenErrorHandled') && !isLoginPage && wasLoggedIn) {
          localStorage.setItem('tokenErrorHandled', 'true');
          
          // Clean up auth state
          localStorage.removeItem('sellerToken');
          localStorage.removeItem('seller');
          
          // Show notification
          toast.error('Session expired', {
            description: 'Please log in again',
            style: {
              background: '#05031F',
              color: '#fff',
            }
          });
          
          // Redirect to login page with a slight delay to allow toast to show
          setTimeout(() => {
            if (navigate) {
              navigate('/login', { replace: true });
            } else {
              // Fallback if navigate function isn't available
              window.location.href = '/login';
            }
            
            // Reset error handling flag after redirection
            localStorage.removeItem('tokenErrorHandled');
          }, 1500);
        } else if (isLoginPage) {
          // On login page, still clear any expired tokens silently
          localStorage.removeItem('sellerToken');
          localStorage.removeItem('seller');
        }
      }
      
      return Promise.reject(error);
    }
  );
  
  // Request interceptor to add authorization header
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('sellerToken');
      
      // Skip token check for login/signup endpoints
      const isAuthEndpoint = 
        config.url?.includes('/login') || 
        config.url?.includes('/register') ||
        config.url?.includes('/forgot-password');
        
      if (token && !isAuthEndpoint) {
        try {
          const parsedToken = JSON.parse(token);
          if (parsedToken.data) {
            config.headers.Authorization = `Bearer ${parsedToken.data}`;
          }
        } catch (e) {
          // Invalid token format in localStorage, remove it
          console.error('Invalid token format in localStorage', e);
          localStorage.removeItem('sellerToken');
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
}; 