import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mensajeError } from '../api/axios';
import logo from '../assets/logo.png';

export default function Login() {
  const { usuario, login } = useAuth();
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await login(nombreUsuario, contrasena);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-fondo">
      <form className="login-caja" onSubmit={enviar}>
        <img src={logo} alt="Veterinaria Mordisquitos" className="login-logo" />
        <p>Inicia sesión para continuar</p>

        <label>Usuario</label>
        <input
          value={nombreUsuario}
          onChange={(e) => setNombreUsuario(e.target.value)}
          autoFocus
        />

        <label>Contraseña</label>
        <input
          type="password"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
        />

        {error && <div className="error">{error}</div>}

        <button disabled={cargando}>{cargando ? 'Entrando...' : 'Entrar'}</button>

        <small className="ayuda">¿Olvidaste tu contraseña? Pídele al administrador que la restablezca.</small>
      </form>
    </div>
  );
}