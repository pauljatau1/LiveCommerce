import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = axios.create({
  baseURL: BASE_URL,
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A page's data didn't load: let the layout show one plain message with Retry
    const method = (error.config?.method || 'get').toLowerCase();
    if (method === 'get' && !error.config?.quiet) {
      const status = error.response?.status;
      const message = !error.response
        ? "Can't reach the server. Check your connection, then retry."
        : status && status >= 500
          ? (error.response.data?.message && typeof error.response.data.message === 'string' && error.response.data.message.length < 140
              ? error.response.data.message
              : "Some data on this page didn't load. Try again.")
          : '';
      if (message) window.dispatchEvent(new CustomEvent('admin:load-failed', { detail: message }));
    }

    // Handle specific error responses
    if (error.response) {
      const { status, data } = error.response;
      
      // Log rate limit errors
      if (status === 429) {
        console.warn('Rate limit exceeded:', data.message);
      }
      
      // Handle authentication errors
      if (status === 403 && data?.message === "This account doesn't have admin access.") {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      if (status === 401) {
        // Token might be expired - clear it
        if (data.message === 'Invalid or expired token') {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export const loginAdmin = async (credentials: { username: string; password: string }) => {
  const response = await api.post('/api/admin/login', credentials);
  return response.data;
};

export const registerAdmin = async (credentials: { username: string; email: string; password: string }) => {
  const response = await api.post('/api/admin/register', credentials);
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/api/admin/profile');
  return response.data;
};
