import { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('usuario'));
    } catch {
      return null;
    }
  });

  const login = async (nombreUsuario, contrasena) => {
    const { data } = await api.post('/auth/login', {
      usuario: nombreUsuario,
      contrasena,
    });
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('usuario', JSON.stringify(data.data.usuario));
    setUsuario(data.data.usuario);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);