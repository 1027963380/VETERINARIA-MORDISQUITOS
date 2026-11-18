import { useEffect, useState } from 'react';
import api, { mensajeError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import useAviso from '../hooks/useAviso';

const VACIO = { nombre: '', descripcion: '', precio: '' };

const moneda = (n) =>
  Number(n).toLocaleString('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  });

export default function Servicios() {
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
      const { data } = await api.get('/servicios', { params: q ? { q } : {} });
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

  const abrirEditar = (s) => {
    setEditandoId(s.id_servicio);
    setErrorForm('');
    setForm({
      nombre: s.nombre,
      descripcion: s.descripcion ?? '',
      precio: s.precio,
    });
  };

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setErrorForm('');
    setGuardando(true);

    const cuerpo = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      precio: form.precio === '' ? '' : Number(form.precio),
    };

    try {
      if (editandoId) await api.put(`/servicios/${editandoId}`, cuerpo);
      else await api.post('/servicios', cuerpo);
      setForm(null);
      setAviso({ tipo: 'ok', texto: editandoId ? 'Servicio actualizado' : 'Servicio creado' });
      cargar(busqueda.trim());
    } catch (err) {
      setErrorForm(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (s) => {
    if (!window.confirm(`¿Eliminar "${s.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/servicios/${s.id_servicio}`);
      setAviso({ tipo: 'ok', texto: 'Servicio eliminado' });
      cargar(busqueda.trim());
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err) });
    }
  };

  const columnas = esAdmin ? 4 : 3;

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Servicios</h1>
          <p className="sub">{lista.length} servicio(s)</p>
        </div>
        {esAdmin && (
          <button className="btn btn-naranja" onClick={abrirNuevo}>
            + Nuevo servicio
          </button>
        )}
      </div>

      {aviso && <div className={`aviso aviso-${aviso.tipo}`}>{aviso.texto}</div>}

      <input
        className="buscador"
        placeholder="Buscar por nombre o descripción..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div className="tabla-caja">
        <table className="tabla">
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Descripción</th>
              <th>Precio</th>
              {esAdmin && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={columnas} className="vacio">Cargando...</td></tr>
            ) : lista.length === 0 ? (
              <tr><td colSpan={columnas} className="vacio">No se encontraron servicios</td></tr>
            ) : (
              lista.map((s) => (
                <tr key={s.id_servicio}>
                  <td><strong>{s.nombre}</strong></td>
                  <td>{s.descripcion || '—'}</td>
                  <td><strong>{moneda(s.precio)}</strong></td>
                  {esAdmin && (
                    <td className="acciones">
                      <button className="btn-mini" onClick={() => abrirEditar(s)}>Editar</button>
                      <button className="btn-mini btn-mini-rojo" onClick={() => eliminar(s)}>Eliminar</button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="modal-fondo" onClick={() => setForm(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
            <h2>{editandoId ? 'Editar servicio' : 'Nuevo servicio'}</h2>

            <label>Nombre *</label>
            <input name="nombre" value={form.nombre} onChange={cambiar} required autoFocus />

            <label>Descripción</label>
            <input name="descripcion" value={form.descripcion} onChange={cambiar} placeholder="Ej: Baño, corte y secado" />

            <label>Precio *</label>
            <input name="precio" type="number" min="0" step="any" value={form.precio} onChange={cambiar} required />

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