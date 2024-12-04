import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://auqliserver-8xr8zvib.b4a.run',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;
