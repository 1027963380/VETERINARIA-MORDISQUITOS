import { useEffect, useState } from 'react';
import api, { mensajeError } from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ROLES = ['ADMIN', 'VETERINARIO', 'RECEPCIONISTA'];
const CLASE_ROL = {
  ADMIN: 'chip-naranja',
  VETERINARIO: 'chip-turquesa',
  RECEPCIONISTA: 'chip-gris',
};
const TITULOS = {
  crear: 'Nuevo usuario',
  editar: 'Editar usuario',
  clave: 'Restablecer contraseña',
};

export default function Usuarios() {
  const { usuario: yo } = useAuth();
  const [lista, setLista] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState(null);
  const [modal, setModal] = useState(null); // { tipo, id, form }
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/auth/usuarios');
      setLista(data.data);
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err) });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  // El aviso desaparece solo a los 4 segundos
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 4000);
    return () => clearTimeout(t);
  }, [aviso]);

  const abrir = (tipo, u = null) => {
    setError('');
    if (tipo === 'crear') {
      setModal({ tipo, form: { nombre: '', usuario: '', contrasena: '', rol: 'RECEPCIONISTA' } });
    } else if (tipo === 'editar') {
      setModal({ tipo, id: u.id_usuario, form: { nombre: u.nombre, usuario: u.usuario, rol: u.rol } });
    } else {
      setModal({ tipo, id: u.id_usuario, form: { nombre: u.nombre, contrasena: '' } });
    }
  };

  const cambiar = (e) =>
    setModal({ ...modal, form: { ...modal.form, [e.target.name]: e.target.value } });

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    const { tipo, id, form } = modal;

    if ((tipo === 'crear' || tipo === 'clave') && form.contrasena.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setGuardando(true);
    try {
      if (tipo === 'crear') {
        await api.post('/auth/register', {
          nombre: form.nombre.trim(),
          usuario: form.usuario.trim(),
          contrasena: form.contrasena,
          rol: form.rol,
        });
        setAviso({ tipo: 'ok', texto: 'Usuario creado' });
      } else if (tipo === 'editar') {
        await api.put(`/auth/usuarios/${id}`, { nombre: form.nombre.trim(), rol: form.rol });
        setAviso({ tipo: 'ok', texto: 'Usuario actualizado' });
      } else {
        await api.put(`/auth/usuarios/${id}/contrasena`, { contrasena: form.contrasena });
        setAviso({ tipo: 'ok', texto: `Contraseña de ${form.nombre} actualizada` });
      }
      setModal(null);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const filtrados = lista.filter((u) =>
    `${u.nombre} ${u.usuario}`.toLowerCase().includes(busqueda.trim().toLowerCase())
  );

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Usuarios</h1>
          <p className="sub">{lista.length} usuario(s) del personal</p>
        </div>
        <button className="btn btn-naranja" onClick={() => abrir('crear')}>
          + Nuevo usuario
        </button>
      </div>

      {aviso && <div className={`aviso aviso-${aviso.tipo}`}>{aviso.texto}</div>}

      <input
        className="buscador"
        placeholder="Buscar por nombre o usuario..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div className="tabla-caja">
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={4} className="vacio">Cargando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={4} className="vacio">No se encontraron usuarios</td></tr>
            ) : (
              filtrados.map((u) => (
                <tr key={u.id_usuario}>
                  <td>
                    <strong>{u.nombre}</strong>
                    {u.id_usuario === yo.id_usuario && <span className="tu">(tú)</span>}
                  </td>
                  <td>{u.usuario}</td>
                  <td><span className={`chip ${CLASE_ROL[u.rol]}`}>{u.rol}</span></td>
                  <td className="acciones">
                    <button className="btn-mini" onClick={() => abrir('editar', u)}>Editar</button>
                    <button className="btn-mini" onClick={() => abrir('clave', u)}>Restablecer contraseña</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-fondo" onClick={() => setModal(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
            <h2>{TITULOS[modal.tipo]}</h2>

            {modal.tipo === 'clave' && (
              <p className="ayuda-modal">
                Nueva contraseña para <strong>{modal.form.nombre}</strong>. Anótala para
                entregársela, porque después no se puede volver a ver.
              </p>
            )}

            {modal.tipo !== 'clave' && (
              <>
                <label>Nombre completo *</label>
                <input name="nombre" value={modal.form.nombre} onChange={cambiar} required autoFocus />

                <label>Usuario *</label>
                <input
                  name="usuario"
                  value={modal.form.usuario}
                  onChange={cambiar}
                  required
                  disabled={modal.tipo === 'editar'}
                />

                <label>Rol *</label>
                <select
                  name="rol"
                  value={modal.form.rol}
                  onChange={cambiar}
                  disabled={modal.tipo === 'editar' && modal.id === yo.id_usuario}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {modal.tipo === 'editar' && modal.id === yo.id_usuario && (
                  <p className="ayuda-modal">No puedes cambiar tu propio rol.</p>
                )}
                {modal.tipo === 'editar' && modal.id !== yo.id_usuario && (
                  <p className="ayuda-modal">
                    El cambio de rol se aplica cuando esa persona vuelva a iniciar sesión.
                  </p>
                )}
              </>
            )}

            {modal.tipo !== 'editar' && (
              <>
                <label>{modal.tipo === 'crear' ? 'Contraseña *' : 'Nueva contraseña *'}</label>
                <input
                  name="contrasena"
                  type="text"
                  value={modal.form.contrasena}
                  onChange={cambiar}
                  placeholder="Mínimo 8 caracteres"
                  required
                  autoFocus={modal.tipo === 'clave'}
                />
              </>
            )}

            {error && <div className="error">{error}</div>}

            <div className="modal-botones">
              <button type="button" className="btn btn-gris" onClick={() => setModal(null)}>
                Cancelar
              </button>
              <button className="btn btn-naranja" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}