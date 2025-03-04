import axios from 'axios';

// const BASE_URL = 'http://localhost:8000';
const BASE_URL = 'https://auqliserver-8xr8zvib.b4a.run';


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

export const loginAdmin = async (credentials: { username: string; password: string }) => {
  const response = await api.post('/api/admin/login', credentials);
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/api/admin/profile');
  return response.data;
};
