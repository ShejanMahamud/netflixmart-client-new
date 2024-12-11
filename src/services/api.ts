// src/services/api.ts
import axios from "axios";
import { getToken } from "../utils/auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL, // Replace with your backend URL
  withCredentials: true,
});

// Add a request interceptor to include the token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
