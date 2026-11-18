import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { mensajeError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import useAviso from '../hooks/useAviso';

const VACIO = { documento: '', nombre: '', telefono: '', direccion: '', correo: '' };

export default function Propietarios() {
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === 'ADMIN';

  const [lista, setLista] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useAviso();
  const [form, setForm] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = async (q = '') => {
    setCargando(true);
    try {
      const { data } = await api.get('/propietarios', { params: q ? { q } : {} });
      setLista(data.data);
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err) });
    } finally {
      setCargando(false);
    }
  };

  // Busca mientras escribes (espera 350 ms después de la última tecla)
  useEffect(() => {
    const espera = setTimeout(() => cargar(busqueda.trim()), 350);
    return () => clearTimeout(espera);
  }, [busqueda]);

  const abrirNuevo = () => {
    setEditandoId(null);
    setErrorForm('');
    setForm(VACIO);
  };

  const abrirEditar = (p) => {
    setEditandoId(p.id_propietario);
    setErrorForm('');
    setForm({
      documento: p.documento,
      nombre: p.nombre,
      telefono: p.telefono,
      direccion: p.direccion ?? '',
      correo: p.correo ?? '',
    });
  };

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setErrorForm('');
    setGuardando(true);

    const cuerpo = {
      documento: form.documento.trim(),
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim(),
      direccion: form.direccion.trim() || null,
      correo: form.correo.trim() || null,
    };

    try {
      if (editandoId) await api.put(`/propietarios/${editandoId}`, cuerpo);
      else await api.post('/propietarios', cuerpo);
      setForm(null);
      setAviso({ tipo: 'ok', texto: editandoId ? 'Propietario actualizado' : 'Propietario creado' });
      cargar(busqueda.trim());
    } catch (err) {
      setErrorForm(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (p) => {
    if (!window.confirm(`¿Eliminar a "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/propietarios/${p.id_propietario}`);
      setAviso({ tipo: 'ok', texto: 'Propietario eliminado' });
      cargar(busqueda.trim());
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err) });
    }
  };

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Propietarios</h1>
          <p className="sub">{lista.length} propietario(s)</p>
        </div>
        <button className="btn btn-naranja" onClick={abrirNuevo}>
          + Nuevo propietario
        </button>
      </div>

      {aviso && <div className={`aviso aviso-${aviso.tipo}`}>{aviso.texto}</div>}

      <input
        className="buscador"
        placeholder="Buscar por nombre, documento o teléfono..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div className="tabla-caja">
        <table className="tabla">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={5} className="vacio">Cargando...</td></tr>
            ) : lista.length === 0 ? (
              <tr><td colSpan={5} className="vacio">No se encontraron propietarios</td></tr>
            ) : (
              lista.map((p) => (
                <tr key={p.id_propietario}>
                  <td>{p.documento}</td>
                  <td>
                    <strong>{p.nombre}</strong>
                    {p.direccion && <span className="mascota-sub">{p.direccion}</span>}
                  </td>
                  <td>{p.telefono}</td>
                  <td>{p.correo || '—'}</td>
                  <td className="acciones">
                    <button className="btn-mini" onClick={() => abrirEditar(p)}>Editar</button>
                    <Link className="btn-mini" to={`/mascotas?q=${encodeURIComponent(p.nombre)}`}>
                      Ver mascotas
                    </Link>
                    <Link className="btn-mini" to={`/mascotas?nuevo=${p.id_propietario}`}>
                      + Mascota
                    </Link>
                    {esAdmin && (
                      <button className="btn-mini btn-mini-rojo" onClick={() => eliminar(p)}>
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="modal-fondo" onClick={() => setForm(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
            <h2>{editandoId ? 'Editar propietario' : 'Nuevo propietario'}</h2>

            <div className="fila">
              <div>
                <label>Documento *</label>
                <input name="documento" value={form.documento} onChange={cambiar} required autoFocus />
              </div>
              <div>
                <label>Teléfono *</label>
                <input name="telefono" value={form.telefono} onChange={cambiar} required />
              </div>
            </div>

            <label>Nombre completo *</label>
            <input name="nombre" value={form.nombre} onChange={cambiar} required />

            <label>Dirección</label>
            <input name="direccion" value={form.direccion} onChange={cambiar} />

            <label>Correo</label>
            <input name="correo" type="email" value={form.correo} onChange={cambiar} />

            {errorForm && <div className="error">{errorForm}</div>}

            <div className="modal-botones">
              <button type="button" className="btn btn-gris" onClick={() => setForm(null)}>
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