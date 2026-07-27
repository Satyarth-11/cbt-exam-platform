import axios from 'axios';
import { store } from '../store';
import { updateAccessToken, setSessionInvalidated, logout } from '../store/slices/authSlice';

const getApiBaseUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim();
  }
  // If running on Netlify directly without environment variable, point to Render backend
  if (typeof window !== 'undefined' && window.location.hostname.includes('netlify.app')) {
    return 'https://cbt-backend-iv9e.onrender.com/api/v1';
  }
  return '/api/v1';
};

const apiBaseUrl = getApiBaseUrl();

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const errorCode = error.response?.data?.errorCode;

      // Handle Single-Active-Session Invalidation
      if (errorCode === 'ERR_SESSION_INVALIDATED') {
        store.dispatch(setSessionInvalidated());
        window.location.href = '/login?reason=session_invalidated';
        return Promise.reject(error.response?.data || error.message);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        store.dispatch(logout());
        return Promise.reject(error);
      }

      try {
        const refreshEndpoint = apiBaseUrl.endsWith('/') ? `${apiBaseUrl}auth/refresh` : `${apiBaseUrl}/auth/refresh`;
        const response = await axios.post(refreshEndpoint, { refreshToken });
        const newAccessToken = response.data?.data?.accessToken;

        if (newAccessToken) {
          store.dispatch(updateAccessToken(newAccessToken));
          axiosClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return axiosClient(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        store.dispatch(logout());
        window.location.href = '/login?reason=session_expired';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error.response?.data || error.message);
  }
);

export default axiosClient;
