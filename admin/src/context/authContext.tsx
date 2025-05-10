import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin, registerAdmin, getProfile } from '@/api/axios';

interface User {
  username: string;
  email?: string;
  // Add other user properties you need
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    
    // Set up token expiry check
    const checkTokenInterval = setInterval(() => {
      checkTokenExpiry();
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(checkTokenInterval);
  }, []);

  const checkTokenExpiry = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      // Simple check for token expiry
      // This assumes the token is a JWT, which we can verify by checking the payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      
      // If token is going to expire in less than 30 minutes
      if (expiryTime - Date.now() < 30 * 60 * 1000) {
        // Token is about to expire, could implement refresh here
        // For now, we'll just log the user out to be safe
        console.warn('Session is about to expire');
      }
    } catch (error) {
      console.error('Error checking token expiry:', error);
    }
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    try {
      if (token) {
        setLoading(true);
        const userData = await getProfile();
        setUser(userData);
        
        // Only navigate to dashboard if we're at login page
        if (window.location.pathname === '/login' || window.location.pathname === '/register') {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.log('Error checking auth:', error);
      localStorage.removeItem('token');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const { token, username: userName, email } = await loginAdmin({ username, password });
      localStorage.setItem('token', token);
      
      // Set user info from login response
      const userData = { username: userName, email };
      setUser(userData);
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await registerAdmin({ username, email, password });
      
      // If registration successful, automatically log in
      if (response.success) {
        await login(username, password);
      }
      
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    // Clear all authentication related data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authState');
    
    // Clear any auth-related session storage items too
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    
    // Clear user state
    setUser(null);
    
    // Redirect to login
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
