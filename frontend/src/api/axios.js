import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
});

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
});

const api = axios.create({
  baseURL: import.meta.env.PROD
    ? 'https://veterinaria-mordisquitos-production.up.railway.app/api/v1'
    : 'http://localhost:4000/api/v1',
});

// Agrega el token a cada petición si hay sesión iniciada
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el token venció (401), cierra la sesión y manda al login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const esLogin = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !esLogin) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Saca el mensaje de error, sea cual sea el formato que responda el backend
export const mensajeError = (error) => {
  const e = error.response?.data?.error;
  if (typeof e === 'string') return e;
  if (e?.message) return e.message;
  return error.response ? 'Ocurrió un error' : 'No hay conexión con el servidor';
};

export default api;