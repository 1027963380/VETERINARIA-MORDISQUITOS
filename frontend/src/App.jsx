import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Inicio from './pages/Inicio';
import Pendiente from './pages/Pendiente';
import Layout from './components/Layout';
import RutaProtegida from './components/RutaProtegida';
import { MENU } from './menu';
import Productos from './pages/Productos';
import Usuarios from './pages/Usuarios';
import Propietarios from './pages/Propietarios';
import Mascotas from './pages/Mascotas';
import Citas from './pages/Citas';
import Alertas from './pages/Alertas';
import Ventas from './pages/Ventas';
import Servicios from './pages/Servicios';
import Consultas from './pages/Consultas';
import Vacunaciones from './pages/Vacunaciones';
import Catalogos from './pages/Catalogos';

const PAGINAS = {
  '/productos': <Productos />,
  '/usuarios': <Usuarios />,
  '/propietarios': <Propietarios />,
  '/mascotas': <Mascotas />,
  '/citas': <Citas />,
  '/alertas': <Alertas />,
  '/ventas': <Ventas />,
  '/servicios': <Servicios />,
  '/consultas': <Consultas />,
  '/vacunaciones': <Vacunaciones />,
  '/catalogos': <Catalogos />,
};


export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RutaProtegida>
            <Layout />
          </RutaProtegida>
        }
      >
        <Route path="/" element={<Inicio />} />
        {MENU.filter((i) => i.ruta !== '/').map((i) => (
          <Route key={i.ruta} path={i.ruta} element={PAGINAS[i.ruta] || <Pendiente titulo={i.texto} />} />
        ))}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}