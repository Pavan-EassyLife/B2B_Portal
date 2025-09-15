// lib/axios.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true, // if your API uses cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
// api.interceptors.request.use(
//   (config: AxiosRequestConfig) => {
//     const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
//     if (token && config.headers) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error: AxiosError) => Promise.reject(error)
// );

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized - maybe refresh token?");
      // You can add logic to refresh the token here
    }
    return Promise.reject(error);
  }
);

export default api;
