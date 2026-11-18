import { useEffect, useState } from 'react';
import api, { mensajeError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import useAviso from '../hooks/useAviso';
import HistorialMascota from '../components/HistorialMascota';
import { fechaCorta, hoyISO, sumarDias, sumarMeses } from '../utils/fechas';

const texto = (v) => v.trim() || null;
const num = (v) => (v === '' || v === null ? null : Number(v));

export default function Vacunaciones() {
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === 'ADMIN';
  const hoy = hoyISO();
  const en30 = sumarDias(hoy, 30);

  const [lista, setLista] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mascotas, setMascotas] = useState([]);
  const [vacunas, setVacunas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useAviso();
  const [form, setForm] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [historialId, setHistorialId] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/mascotas'), api.get('/vacunas')])
      .then(([m, v]) => {
        setMascotas([...m.data.data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        setVacunas([...v.data.data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      })
      .catch((err) => setAviso({ tipo: 'error', texto: mensajeError(err) }));
  }, []);

  const cargar = async (q = '') => {
    setCargando(true);
    try {
      const { data } = await api.get('/vacunaciones', { params: q ? { q } : {} });
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

  // Última aplicación de cada vacuna por mascota: solo esa genera alerta
  const ultima = {};
  lista.forEach((v) => {
    const k = `${v.fk_mascota}-${v.fk_vacuna}`;
    if (!ultima[k] || v.fecha_aplicacion > ultima[k]) ultima[k] = v.fecha_aplicacion;
  });
  const esUltima = (v) => ultima[`${v.fk_mascota}-${v.fk_vacuna}`] === v.fecha_aplicacion;

  const estadoRefuerzo = (v) => {
    if (!v.proxima_fecha) return null;
    if (!esUltima(v)) return { texto: 'Reemplazada', clase: 'chip-gris' };
    if (v.proxima_fecha < hoy) return { texto: 'Vencida', clase: 'chip-rojo' };
    if (v.proxima_fecha <= en30) return { texto: 'Próxima', clase: 'chip-naranja' };
    return { texto: 'Al día', clase: 'chip-verde' };
  };

  const abrirNueva = () => {
    setEditandoId(null);
    setErrorForm('');
    setForm({
      fk_mascota: '', fk_vacuna: '', fecha_aplicacion: hoy,
      proxima_fecha: '', lote: '', observaciones: '',
    });
  };

  const abrirEditar = (v) => {
    setEditandoId(v.id_vacunacion);
    setErrorForm('');
    setForm({
      fk_mascota: v.fk_mascota ?? '',
      fk_vacuna: v.fk_vacuna ?? '',
      fecha_aplicacion: v.fecha_aplicacion,
      proxima_fecha: v.proxima_fecha ?? '',
      lote: v.lote ?? '',
      observaciones: v.observaciones ?? '',
    });
  };

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setErrorForm('');

    if (form.proxima_fecha && form.proxima_fecha < form.fecha_aplicacion) {
      setErrorForm('El próximo refuerzo no puede ser antes de la fecha de aplicación');
      return;
    }

    setGuardando(true);
    const cuerpo = {
      fk_mascota: num(form.fk_mascota),
      fk_vacuna: num(form.fk_vacuna),
      fecha_aplicacion: form.fecha_aplicacion,
      proxima_fecha: form.proxima_fecha || null,
      lote: texto(form.lote),
      observaciones: texto(form.observaciones),
    };

    try {
      if (editandoId) await api.put(`/vacunaciones/${editandoId}`, cuerpo);
      else await api.post('/vacunaciones', cuerpo);
      setForm(null);
      setAviso({ tipo: 'ok', texto: editandoId ? 'Vacunación actualizada' : 'Vacunación registrada' });
      cargar(busqueda.trim());
    } catch (err) {
      setErrorForm(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (v) => {
    if (!window.confirm('¿Eliminar este registro de vacunación? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/vacunaciones/${v.id_vacunacion}`);
      setAviso({ tipo: 'ok', texto: 'Vacunación eliminada' });
      cargar(busqueda.trim());
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err) });
    }
  };

  const vacunaElegida = vacunas.find((v) => v.id_vacuna === Number(form?.fk_vacuna));

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Vacunaciones</h1>
          <p className="sub">{lista.length} registro(s)</p>
        </div>
        <button className="btn btn-naranja" onClick={abrirNueva}>
          + Registrar vacuna
        </button>
      </div>

      {aviso && <div className={`aviso aviso-${aviso.tipo}`}>{aviso.texto}</div>}

      <input
        className="buscador"
        placeholder="Buscar por mascota, dueño, vacuna o lote..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div className="tabla-caja">
        <table className="tabla">
          <thead>
            <tr>
              <th>Aplicada</th>
              <th>Mascota</th>
              <th>Vacuna</th>
              <th>Lote</th>
              <th>Próximo refuerzo</th>
              <th>Aplicó</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={7} className="vacio">Cargando...</td></tr>
            ) : lista.length === 0 ? (
              <tr><td colSpan={7} className="vacio">No se encontraron vacunaciones</td></tr>
            ) : (
              lista.map((v) => {
                const est = estadoRefuerzo(v);
                return (
                  <tr key={v.id_vacunacion}>
                    <td>{fechaCorta(v.fecha_aplicacion)}</td>
                    <td>
                      <button className="enlace" onClick={() => setHistorialId(v.fk_mascota)}>
                        {v.mascota || '—'}
                      </button>
                      <span className="mascota-sub">{v.propietario || 'Sin dueño'}</span>
                    </td>
                    <td><strong>{v.vacuna || '—'}</strong></td>
                    <td>{v.lote || '—'}</td>
                    <td>
                      {v.proxima_fecha ? (
                        <>
                          {fechaCorta(v.proxima_fecha)}{' '}
                          {est && <span className={`chip ${est.clase}`}>{est.texto}</span>}
                        </>
                      ) : '—'}
                    </td>
                    <td>{v.aplico || '—'}</td>
                    <td className="acciones">
                      <button className="btn-mini" onClick={() => abrirEditar(v)}>Editar</button>
                      {esAdmin && (
                        <button className="btn-mini btn-mini-rojo" onClick={() => eliminar(v)}>Eliminar</button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="modal-fondo" onClick={() => setForm(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
            <h2>{editandoId ? 'Editar vacunación' : 'Registrar vacunación'}</h2>

            <label>Mascota *</label>
            <select name="fk_mascota" value={form.fk_mascota} onChange={cambiar} required>
              <option value="">Selecciona una mascota</option>
              {mascotas.map((m) => (
                <option key={m.id_mascota} value={m.id_mascota}>
                  {m.nombre} — {m.propietario || 'sin dueño'}
                </option>
              ))}
            </select>

            <label>Vacuna *</label>
            <select name="fk_vacuna" value={form.fk_vacuna} onChange={cambiar} required>
              <option value="">
                {vacunas.length === 0 ? 'No hay vacunas en el catálogo' : 'Selecciona una vacuna'}
              </option>
              {vacunas.map((v) => (
                <option key={v.id_vacuna} value={v.id_vacuna}>{v.nombre}</option>
              ))}
            </select>
            {vacunaElegida?.periodicidad && (
              <p className="ayuda-modal">Periodicidad: {vacunaElegida.periodicidad}</p>
            )}

            <div className="fila">
              <div>
                <label>Fecha de aplicación *</label>
                <input name="fecha_aplicacion" type="date" max={hoy} value={form.fecha_aplicacion} onChange={cambiar} required />
              </div>
              <div>
                <label>Próximo refuerzo</label>
                <input name="proxima_fecha" type="date" min={form.fecha_aplicacion} value={form.proxima_fecha} onChange={cambiar} />
              </div>
            </div>

            <div className="rapidos">
              <span>Calcular refuerzo:</span>
              {[['1 mes', 1], ['3 meses', 3], ['6 meses', 6], ['1 año', 12]].map(([rotulo, meses]) => (
                <button
                  key={rotulo}
                  type="button"
                  className="btn-mini"
                  onClick={() => setForm({ ...form, proxima_fecha: sumarMeses(form.fecha_aplicacion || hoy, meses) })}
                >
                  +{rotulo}
                </button>
              ))}
              <button type="button" className="btn-mini" onClick={() => setForm({ ...form, proxima_fecha: '' })}>
                Sin refuerzo
              </button>
            </div>

            <label>Lote</label>
            <input name="lote" value={form.lote} onChange={cambiar} />

            <label>Observaciones</label>
            <input name="observaciones" maxLength={200} value={form.observaciones} onChange={cambiar} />

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