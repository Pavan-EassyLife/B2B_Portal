import axios, { AxiosInstance } from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/';
console.log('API Base URL:', baseURL);

const api: AxiosInstance = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // This ensures cookies are sent with requests
});

// Add request interceptor for debugging
// api.interceptors.request.use(
//   (config) => {
//     console.log('Making API request to:', config.baseURL + config.url);
//     console.log('Request config:', config);
//     return config;
//   },
//   (error) => {
//     console.error('Request error:', error);
//     return Promise.reject(error);
//   }
// );

// // Add response interceptor for debugging
// api.interceptors.response.use(
//   (response) => {
//     console.log('API response received:', response);
//     return response;
//   },
//   (error) => {
//     console.error('API response error:', error);
//     console.error('Error details:', {
//       message: error.message,
//       code: error.code,
//       config: error.config,
//       response: error.response
//     });
//     return Promise.reject(error);
//   }
// );

export default api;
