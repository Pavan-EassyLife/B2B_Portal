import axios, { AxiosInstance } from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/';
console.log('API Base URL:', baseURL);

const api: AxiosInstance = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  withCredentials: true, // This ensures cookies are sent with requests
  timeout: 10000, // 10 second timeout
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('Making API request to:', `${config.baseURL || ''}${config.url || ''}`);
    console.log('Request headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API response received from:', response.config.url);
    return response;
  },
  (error) => {
    console.error('API response error:', error.message);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
      console.error('Error headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
    return Promise.reject(error);
  }
);

export default api;
