import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MENU } from '../menu';
import logo from '../assets/logo.png';

const saludo = () => {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

export default function Inicio() {
  const { usuario } = useAuth();
  const accesos = MENU.filter((i) => i.ruta !== '/' && i.roles.includes(usuario.rol));
  const fecha = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <>
      <section className="portada">
        <img src={logo} alt="Veterinaria Mordisquitos" className="portada-logo" />
        <div>
          <p className="portada-fecha">{fecha}</p>
          <h1>{saludo()}, {usuario.nombre}</h1>
          <span className="etiqueta-rol">{usuario.rol}</span>
        </div>
      </section>

      <h2 className="titulo-seccion">¿Qué quieres hacer hoy?</h2>
      <section className="accesos">
        {accesos.map((a) => (
          <Link key={a.ruta} to={a.ruta} className="acceso">
            <span className="acceso-icono">{a.icono}</span>
            <strong>{a.texto}</strong>
            <small>{a.descripcion}</small>
          </Link>
        ))}
      </section>
    </>
  );
}