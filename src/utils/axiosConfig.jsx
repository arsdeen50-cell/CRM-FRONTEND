import axios from 'axios';
import  store  from '@/redux/store';
import { logout, setUser } from '@/redux/authSlice';
import { toast } from 'sonner';
import { backend_url } from '@/constants';

const axiosInstance = axios.create({
  baseURL: backend_url,
  withCredentials: true,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || 'Something went wrong';

      // HR set this password (e.g. flagged after someone was signed in): go and choose a new one
      if (status === 403 && data?.code === 'MUST_CHANGE_PASSWORD') {
        const { user, token } = store.getState().auth;
        if (user && !user.mustChangePassword) store.dispatch(setUser({ user: { ...user, mustChangePassword: true }, token }));
        if (window.location.pathname !== '/change-password') window.location.assign('/change-password');
      }

      // 🔴 Handle ALL 401 errors
      // if (status === 401) {
      //   toast.error('Session expired. Please login again.');

      //   store.dispatch(logout());
      //   localStorage.removeItem('token');
      //   delete axiosInstance.defaults.headers.common['Authorization'];

      //   if (window.location.pathname !== '/login') {
      //     window.location.href = '/login';
      //   }
      // } 
      // else {
      //   toast.error(message);
      // }
    } 
    else {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);


export default axiosInstance;