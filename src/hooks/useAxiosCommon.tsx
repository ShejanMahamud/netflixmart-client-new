import axios from "axios";

const axiosCommon = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL,
});

axiosCommon.interceptors.request.use(
  (config) => {
    config.headers["x-api-key"] = import.meta.env.VITE_NFBD_API_KEY;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const useAxiosCommon = () => {
  return axiosCommon;
};

export default useAxiosCommon;
