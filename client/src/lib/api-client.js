import axios from "axios";
import { HOST } from "../utils/constants";

export const apiClient = axios.create({
  baseURL: HOST,
  withCredentials: true,
});

// Add error logging
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Request Failed:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);
