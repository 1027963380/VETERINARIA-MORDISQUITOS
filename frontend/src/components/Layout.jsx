import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MENU } from '../menu';
import logo from '../assets/logo.png';

export default function Layout() {
    const { usuario, logout } = useAuth();
    const items = MENU.filter((i) => i.roles.includes(usuario.rol));

    return (
        <div className="app">
            <aside className="menu">
                <div className="marca">
                    <img src={logo} alt="Veterinaria Mordisquitos" />
                </div>
                <nav>
                    {items.map((i) => (
                        <NavLink key={i.ruta} to={i.ruta} end={i.ruta === '/'}>
                            <span className="nav-icono">{i.icono}</span> {i.texto}
                        </NavLink>
                    ))}
                </nav>
                <div className="usuario">
                    <strong>{usuario.nombre}</strong>
                    <span>{usuario.rol}</span>
                    <button onClick={logout}>Cerrar sesión</button>
                </div>
            </aside>
            <main className="contenido">
                <Outlet />
            </main>
        </div>
    );
}