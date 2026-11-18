import { useEffect, useState } from 'react';
import api, { mensajeError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import useAviso from '../hooks/useAviso';

// ----- Horario de atención (cámbialo aquí) -----
const INICIO = 8 * 60;  // 8:00 a. m.
const FIN = 18 * 60;    // 6:00 p. m. (la última cita es a las 5:30 p. m.)
const PASO = 30;        // cada cita dura 30 minutos

const ESTADOS = ['PROGRAMADA', 'ATENDIDA', 'CANCELADA'];
const CLASE_ESTADO = {
  PROGRAMADA: 'chip-turquesa',
  ATENDIDA: 'chip-verde',
  CANCELADA: 'chip-gris',
};

const aMin = (hhmm) => {
  const [h, m] = String(hhmm).split(':');
  return Number(h) * 60 + Number(m);
};
const aHHMM = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const etiqueta = (hhmm) => {
  const min = aMin(hhmm);
  const h = Math.floor(min / 60);
  const m = String(min % 60).padStart(2, '0');
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${h < 12 ? 'a. m.' : 'p. m.'}`;
};
const FRANJAS = [];
for (let t = INICIO; t < FIN; t += PASO) FRANJAS.push(aHHMM(t));

const hoyISO = () => new Date().toLocaleDateString('en-CA');
const sumarDias = (iso, n) => {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('en-CA');
};
const fechaLarga = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
const num = (v) => (v === '' || v === null ? null : Number(v));

const VACIO = { fk_mascota: '', fk_usuario: '', fecha: '', hora: '', motivo: '', estado: 'PROGRAMADA' };

export default function Citas() {
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === 'ADMIN';
  const hoy = hoyISO();

  const [citas, setCitas] = useState([]);
  const [fecha, setFecha] = useState(hoy);          // '' = todas las fechas
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [vetFiltro, setVetFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [mascotas, setMascotas] = useState([]);
  const [encargados, setEncargados] = useState([]);
  const [ocupadas, setOcupadas] = useState([]);     // citas del veterinario elegido ese día
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useAviso();
  const [form, setForm] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Listas para los desplegables (una sola vez)
  useEffect(() => {
    Promise.all([api.get('/mascotas'), api.get('/auth/personal')])
      .then(([m, e]) => {
        setMascotas([...m.data.data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        setEncargados(e.data.data);
      })
      .catch((err) => setAviso({ tipo: 'error', texto: mensajeError(err) }));
  }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      const filtros = {};
      if (fecha) filtros.fecha = fecha;
      if (estadoFiltro) filtros.estado = estadoFiltro;
      if (vetFiltro) filtros.fk_usuario = vetFiltro;
      if (busqueda.trim()) filtros.q = busqueda.trim();
      const { data } = await api.get('/citas', { params: filtros });
      setCitas(data.data);
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err) });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const espera = setTimeout(cargar, 350);
    return () => clearTimeout(espera);
  }, [fecha, estadoFiltro, vetFiltro, busqueda]);

  // Horarios que ya tiene ocupados el veterinario elegido en la fecha elegida
  const vetForm = form?.fk_usuario;
  const fechaForm = form?.fecha;
  useEffect(() => {
    if (!vetForm || !fechaForm) {
      setOcupadas([]);
      return undefined;
    }
    let activo = true;
    api.get('/citas', { params: { fecha: fechaForm, fk_usuario: vetForm } })
      .then(({ data }) => {
        if (activo) {
          setOcupadas(data.data.filter((c) => c.estado !== 'CANCELADA' && c.id_cita !== editandoId));
        }
      })
      .catch(() => activo && setOcupadas([]));
    return () => {
      activo = false;
    };
  }, [vetForm, fechaForm, editandoId]);

  const estaOcupada = (franja) =>
    ocupadas.some((c) => Math.abs(aMin(String(c.hora).slice(0, 5)) - aMin(franja)) < PASO);

  // Si la hora elegida quedó ocupada al cambiar de veterinario o fecha, se limpia
  useEffect(() => {
    setForm((f) => (f && f.hora && estaOcupada(f.hora) ? { ...f, hora: '' } : f));
  }, [ocupadas]);

  const ahora = new Date();
  const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();
  const esPasada = (franja) => form?.fecha === hoy && !editandoId && aMin(franja) <= ahoraMin;

  const abrirNueva = () => {
    setEditandoId(null);
    setErrorForm('');
    setForm({ ...VACIO, fecha: fecha || hoy });
  };

  const abrirEditar = (c) => {
    setEditandoId(c.id_cita);
    setErrorForm('');
    setForm({
      fk_mascota: c.fk_mascota ?? '',
      fk_usuario: c.fk_usuario ?? '',
      fecha: c.fecha,
      hora: String(c.hora).slice(0, 5),
      motivo: c.motivo,
      estado: c.estado,
    });
  };

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setErrorForm('');
    if (!form.hora) {
      setErrorForm('Selecciona un horario disponible');
      return;
    }
    setGuardando(true);

    const cuerpo = {
      fk_mascota: num(form.fk_mascota),
      fk_usuario: num(form.fk_usuario),
      fecha: form.fecha,
      hora: form.hora,
      motivo: form.motivo.trim(),
    };
    if (editandoId) cuerpo.estado = form.estado;

    try {
      if (editandoId) await api.put(`/citas/${editandoId}`, cuerpo);
      else await api.post('/citas', cuerpo);
      setForm(null);
      setAviso({ tipo: 'ok', texto: editandoId ? 'Cita actualizada' : 'Cita agendada' });
      // Si la cita quedó en otro día, la agenda se mueve a ese día para verla
      if (fecha && fecha !== cuerpo.fecha) setFecha(cuerpo.fecha);
      else cargar();
    } catch (err) {
      setErrorForm(mensajeError(err)); // aquí sale "El veterinario no se encuentra disponible..."
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (c, estado) => {
    if (estado === 'CANCELADA' && !window.confirm(`¿Cancelar la cita de "${c.mascota}"?`)) return;
    try {
      await api.put(`/citas/${c.id_cita}`, { estado });
      setAviso({ tipo: 'ok', texto: estado === 'ATENDIDA' ? 'Cita marcada como atendida' : 'Cita cancelada' });
      cargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err) });
    }
  };

  const eliminar = async (c) => {
    if (!window.confirm('¿Eliminar esta cita? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/citas/${c.id_cita}`);
      setAviso({ tipo: 'ok', texto: 'Cita eliminada' });
      cargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err) });
    }
  };

  const ordenadas = [...citas].sort((a, b) =>
    `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`)
  );
  const programadas = citas.filter((c) => c.estado === 'PROGRAMADA').length;

  // Franjas del formulario (si una cita vieja tiene una hora fuera de la lista, se conserva)
  const franjas = form ? [...FRANJAS] : [];
  if (form?.hora && !franjas.includes(form.hora)) franjas.unshift(form.hora);
  const libres = franjas.filter((f) => !estaOcupada(f) && !esPasada(f)).length;
  const puedeElegirHora = form && form.fk_usuario && form.fecha;

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Citas</h1>
          <p className="sub fecha-sub">
            {fecha ? fechaLarga(fecha) : 'Todas las fechas'} · {citas.length} cita(s), {programadas} programada(s)
          </p>
        </div>
        <button className="btn btn-naranja" onClick={abrirNueva}>
          + Nueva cita
        </button>
      </div>

      {aviso && <div className={`aviso aviso-${aviso.tipo}`}>{aviso.texto}</div>}

      <div className="barra">
        <div className="nav-fecha">
          <button className="btn-mini" onClick={() => setFecha(sumarDias(fecha || hoy, -1))}>‹</button>
          <button className="btn-mini" onClick={() => setFecha(hoy)}>Hoy</button>
          <button className="btn-mini" onClick={() => setFecha(sumarDias(fecha || hoy, 1))}>›</button>
          <input type="date" className="filtro" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          <button className="btn-mini" onClick={() => setFecha('')}>Todas</button>
        </div>
        <select className="filtro" value={vetFiltro} onChange={(e) => setVetFiltro(e.target.value)}>
          <option value="">Todos los veterinarios</option>
          {encargados.map((u) => (
            <option key={u.id_usuario} value={u.id_usuario}>{u.nombre}</option>
          ))}
        </select>
        <select className="filtro" value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
          <option value="">Todos los estados</option>
          {ESTADOS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          className="buscador"
          placeholder="Buscar por mascota, dueño o motivo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="tabla-caja">
        <table className="tabla">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Mascota</th>
              <th>Motivo</th>
              <th>Veterinario</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={6} className="vacio">Cargando...</td></tr>
            ) : ordenadas.length === 0 ? (
              <tr><td colSpan={6} className="vacio">No hay citas para este filtro</td></tr>
            ) : (
              ordenadas.map((c) => (
                <tr key={c.id_cita} className={c.estado === 'CANCELADA' ? 'fila-apagada' : ''}>
                  <td>
                    <strong className="hora">{etiqueta(String(c.hora).slice(0, 5))}</strong>
                    {!fecha && <span className="mascota-sub">{c.fecha}</span>}
                  </td>
                  <td>
                    <strong>{c.mascota || '—'}</strong>
                    <span className="mascota-sub">
                      {c.propietario || 'Sin dueño'}{c.telefono ? ` · ${c.telefono}` : ''}
                    </span>
                  </td>
                  <td>{c.motivo}</td>
                  <td>{c.encargado || <span className="nota">Sin asignar</span>}</td>
                  <td><span className={`chip ${CLASE_ESTADO[c.estado] || 'chip-gris'}`}>{c.estado}</span></td>
                  <td className="acciones">
                    {c.estado === 'PROGRAMADA' && (
                      <>
                        <button className="btn-mini btn-mini-verde" onClick={() => cambiarEstado(c, 'ATENDIDA')}>
                          Atendida
                        </button>
                        <button className="btn-mini" onClick={() => abrirEditar(c)}>Editar</button>
                        <button className="btn-mini btn-mini-rojo" onClick={() => cambiarEstado(c, 'CANCELADA')}>
                          Cancelar
                        </button>
                      </>
                    )}
                    {c.estado !== 'PROGRAMADA' && (
                      <button className="btn-mini" onClick={() => abrirEditar(c)}>Editar</button>
                    )}
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

      {form && (
        <div className="modal-fondo" onClick={() => setForm(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
            <h2>{editandoId ? 'Editar cita' : 'Nueva cita'}</h2>

            <label>Mascota *</label>
            <select name="fk_mascota" value={form.fk_mascota} onChange={cambiar} required>
              <option value="">Selecciona una mascota</option>
              {mascotas.map((m) => (
                <option key={m.id_mascota} value={m.id_mascota}>
                  {m.nombre} — {m.propietario || 'sin dueño'}
                </option>
              ))}
            </select>

            <label>Veterinario *</label>
            <select name="fk_usuario" value={form.fk_usuario} onChange={cambiar} required>
              <option value="">Selecciona un veterinario</option>
              {encargados.map((u) => (
                <option key={u.id_usuario} value={u.id_usuario}>
                  {u.nombre} ({u.rol})
                </option>
              ))}
            </select>

            <div className="fila">
              <div>
                <label>Fecha *</label>
                <input
                  name="fecha"
                  type="date"
                  min={editandoId ? undefined : hoy}
                  value={form.fecha}
                  onChange={cambiar}
                  required
                />
              </div>
              <div>
                <label>Hora *</label>
                <select
                  name="hora"
                  value={form.hora}
                  onChange={cambiar}
                  disabled={!puedeElegirHora}
                  required
                >
                  <option value="">
                    {puedeElegirHora ? 'Selecciona un horario' : 'Elige veterinario y fecha'}
                  </option>
                  {franjas.map((f) => {
                    const ocupada = estaOcupada(f);
                    const pasada = esPasada(f);
                    return (
                      <option key={f} value={f} disabled={ocupada || pasada}>
                        {etiqueta(f)}{ocupada ? ' — ocupado' : pasada ? ' — ya pasó' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            {puedeElegirHora && (
              <p className="ayuda-modal">
                Citas de 30 minutos · {libres} horario(s) libre(s) para este veterinario ese día.
              </p>
            )}

            <label>Motivo *</label>
            <input name="motivo" value={form.motivo} onChange={cambiar} required placeholder="Ej: Vacunación, control, baño..." />

            {editandoId && (
              <>
                <label>Estado</label>
                <select name="estado" value={form.estado} onChange={cambiar}>
                  {ESTADOS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </>
            )}

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