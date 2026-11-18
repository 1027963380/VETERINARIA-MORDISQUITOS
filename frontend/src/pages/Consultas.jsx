import { useEffect, useState } from 'react';
import api, { mensajeError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import useAviso from '../hooks/useAviso';
import HistorialMascota from '../components/HistorialMascota';
import { fechaHora } from '../utils/fechas';

const VACIO = {
  fk_mascota: '', motivo: '', sintomas: '', diagnostico: '',
  tratamiento: '', observaciones: '', peso: '',
};

const resumen = (t, n = 55) => (!t ? '—' : t.length > n ? `${t.slice(0, n)}…` : t);
const texto = (v) => v.trim() || null;
const num = (v) => (v === '' || v === null ? null : Number(v));

export default function Consultas() {
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === 'ADMIN';

  const [lista, setLista] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mascotas, setMascotas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useAviso();
  const [form, setForm] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [ver, setVer] = useState(null);
  const [historialId, setHistorialId] = useState(null);

  useEffect(() => {
    api.get('/mascotas')
      .then(({ data }) =>
        setMascotas([...data.data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      )
      .catch((err) => setAviso({ tipo: 'error', texto: mensajeError(err) }));
  }, []);

  const cargar = async (q = '') => {
    setCargando(true);
    try {
      const { data } = await api.get('/consultas', { params: q ? { q } : {} });
      setLista(data.data);
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err) });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const espera = setTimeout(() => cargar(busqueda.trim()), 350);
    return () => clearTimeout(espera);
  }, [busqueda]);

  const abrirNueva = () => {
    setEditandoId(null);
    setErrorForm('');
    setForm(VACIO);
  };

  const abrirEditar = (c) => {
    setVer(null);
    setEditandoId(c.id_consulta);
    setErrorForm('');
    setForm({
      fk_mascota: c.fk_mascota ?? '',
      motivo: c.motivo,
      sintomas: c.sintomas ?? '',
      diagnostico: c.diagnostico ?? '',
      tratamiento: c.tratamiento ?? '',
      observaciones: c.observaciones ?? '',
      peso: c.peso ?? '',
    });
  };

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setErrorForm('');
    setGuardando(true);

    // La fecha y el veterinario los pone el servidor (fecha actual y usuario del token)
    const cuerpo = {
      fk_mascota: num(form.fk_mascota),
      motivo: form.motivo.trim(),
      sintomas: texto(form.sintomas),
      diagnostico: texto(form.diagnostico),
      tratamiento: texto(form.tratamiento),
      observaciones: texto(form.observaciones),
      peso: num(form.peso),
    };

    try {
      if (editandoId) await api.put(`/consultas/${editandoId}`, cuerpo);
      else await api.post('/consultas', cuerpo);
      setForm(null);
      setAviso({ tipo: 'ok', texto: editandoId ? 'Consulta actualizada' : 'Consulta registrada' });
      cargar(busqueda.trim());
    } catch (err) {
      setErrorForm(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (c) => {
    if (!window.confirm('¿Eliminar esta consulta? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/consultas/${c.id_consulta}`);
      setAviso({ tipo: 'ok', texto: 'Consulta eliminada' });
      cargar(busqueda.trim());
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err) });
    }
  };

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Consultas</h1>
          <p className="sub">{lista.length} consulta(s)</p>
        </div>
        <button className="btn btn-naranja" onClick={abrirNueva}>
          + Nueva consulta
        </button>
      </div>

      {aviso && <div className={`aviso aviso-${aviso.tipo}`}>{aviso.texto}</div>}

      <input
        className="buscador"
        placeholder="Buscar por mascota, dueño, motivo o diagnóstico..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div className="tabla-caja">
        <table className="tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Mascota</th>
              <th>Motivo</th>
              <th>Diagnóstico</th>
              <th>Atendió</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={6} className="vacio">Cargando...</td></tr>
            ) : lista.length === 0 ? (
              <tr><td colSpan={6} className="vacio">No se encontraron consultas</td></tr>
            ) : (
              lista.map((c) => (
                <tr key={c.id_consulta}>
                  <td>{fechaHora(c.fecha)}</td>
                  <td>
                    <button className="enlace" onClick={() => setHistorialId(c.fk_mascota)}>
                      {c.mascota || '—'}
                    </button>
                    <span className="mascota-sub">{c.propietario || 'Sin dueño'}</span>
                  </td>
                  <td>{c.motivo}</td>
                  <td>{resumen(c.diagnostico)}</td>
                  <td>{c.atendio || '—'}</td>
                  <td className="acciones">
                    <button className="btn-mini" onClick={() => setVer(c)}>Ver</button>
                    <button className="btn-mini" onClick={() => abrirEditar(c)}>Editar</button>
                    {esAdmin && (
                      <button className="btn-mini btn-mini-rojo" onClick={() => eliminar(c)}>Eliminar</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ---------- Ventana: detalle ---------- */}
      {ver && (
        <div className="modal-fondo" onClick={() => setVer(null)}>
          <div className="modal modal-ancho" onClick={(e) => e.stopPropagation()}>
            <h2>Consulta de {ver.mascota}</h2>
            <p className="ayuda-modal">
              {fechaHora(ver.fecha)} · Dueño: {ver.propietario || '—'} · Atendió: {ver.atendio || '—'}
            </p>
            <div className="detalle">
              <p><strong>Motivo</strong>{ver.motivo}</p>
              <p><strong>Síntomas</strong>{ver.sintomas || '—'}</p>
              <p><strong>Diagnóstico</strong>{ver.diagnostico || '—'}</p>
              <p><strong>Tratamiento</strong>{ver.tratamiento || '—'}</p>
              <p><strong>Observaciones</strong>{ver.observaciones || '—'}</p>
              <p><strong>Peso</strong>{ver.peso != null ? `${ver.peso} kg` : '—'}</p>
            </div>
            <div className="modal-botones">
              <button type="button" className="btn btn-gris" onClick={() => setVer(null)}>Cerrar</button>
              <button type="button" className="btn btn-naranja" onClick={() => abrirEditar(ver)}>Editar</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Ventana: crear / editar ---------- */}
      {form && (
        <div className="modal-fondo" onClick={() => setForm(null)}>
          <form className="modal modal-ancho" onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
            <h2>{editandoId ? 'Editar consulta' : 'Nueva consulta'}</h2>

            <label>Mascota *</label>
            <select name="fk_mascota" value={form.fk_mascota} onChange={cambiar} required>
              <option value="">Selecciona una mascota</option>
              {mascotas.map((m) => (
                <option key={m.id_mascota} value={m.id_mascota}>
                  {m.nombre} — {m.propietario || 'sin dueño'}
                </option>
              ))}
            </select>

            <div className="fila">
              <div>
                <label>Motivo *</label>
                <input name="motivo" value={form.motivo} onChange={cambiar} required autoFocus />
              </div>
              <div>
                <label>Peso (kg)</label>
                <input name="peso" type="number" min="0" max="999.99" step="0.01" value={form.peso} onChange={cambiar} />
              </div>
            </div>

            <label>Síntomas</label>
            <textarea name="sintomas" rows="2" value={form.sintomas} onChange={cambiar} />

            <label>Diagnóstico</label>
            <textarea name="diagnostico" rows="2" value={form.diagnostico} onChange={cambiar} />

            <label>Tratamiento</label>
            <textarea name="tratamiento" rows="2" value={form.tratamiento} onChange={cambiar} />

            <label>Observaciones</label>
            <textarea name="observaciones" rows="2" value={form.observaciones} onChange={cambiar} />

            {!editandoId && (
              <p className="ayuda-modal">
                La fecha y el veterinario se registran automáticamente (hoy y tu usuario).
              </p>
            )}

            {errorForm && <div className="error">{errorForm}</div>}

            <div className="modal-botones">
              <button type="button" className="btn btn-gris" onClick={() => setForm(null)}>Cancelar</button>
              <button className="btn btn-naranja" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {historialId && (
        <HistorialMascota idMascota={historialId} onCerrar={() => setHistorialId(null)} />
      )}
    </>
  );
}