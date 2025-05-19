const API_BASE_URL = '/api';  

export const getApiConfig = () => {
  return {
    baseURL: API_BASE_URL,
    withCredentials: true,
    timeout: 15000
  };
};