import axios from "axios";
import Cookies from "js-cookie";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const axiosSecure = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL,
});

const useAxiosSecure = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const requestInterceptor = axiosSecure.interceptors.request.use(
      (config) => {
        const token = Cookies.get("token");

        if (!token) {
          console.warn(
            "Missing access token in request. Redirecting to login."
          );
          navigate("/auth/login");
          return Promise.reject(new Error("Missing access token"));
        }

        config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axiosSecure.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error?.response?.status;
        console.log(status);

        if (status === 401 || status === 403) {
          console.error("Unauthorized or Forbidden response:", error);
          Cookies.remove("token");
          navigate("/auth/login");
          return Promise.reject(new Error("Unauthorized or Forbidden"));
        }

        console.error("API request error:", error);
        return Promise.reject(error);
      }
    );

    return () => {
      axiosSecure.interceptors.request.eject(requestInterceptor);
      axiosSecure.interceptors.response.eject(responseInterceptor);
    };
  }, [navigate]);

  return axiosSecure;
};

export default useAxiosSecure;
