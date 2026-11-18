import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { mensajeError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import useAviso from '../hooks/useAviso';
import HistorialMascota from '../components/HistorialMascota';

const SEXOS = ['Macho', 'Hembra'];
const VACIO = {
  nombre: '', sexo: '', fecha_nacimiento: '', peso: '', color: '',
  fk_propietario: '', fk_especie: '', fk_raza: '',
};

// Calcula la edad a partir de la fecha de nacimiento
const edad = (fecha) => {
  if (!fecha) return '—';
  const nac = new Date(fecha + 'T00:00:00');
  const hoy = new Date();
  let meses = (hoy.getFullYear() - nac.getFullYear()) * 12 + (hoy.getMonth() - nac.getMonth());
  if (hoy.getDate() < nac.getDate()) meses -= 1;
  if (meses < 0) return '—';
  if (meses < 1) return 'Menos de 1 mes';
  if (meses < 12) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  const anios = Math.floor(meses / 12);
  return `${anios} ${anios === 1 ? 'año' : 'años'}`;
};

const num = (v) => (v === '' || v === null ? null : Number(v));

export default function Mascotas() {
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === 'ADMIN';
  const [params, setParams] = useSearchParams();

  const [mascotas, setMascotas] = useState([]);
  const [historialId, setHistorialId] = useState(null);
  const [busqueda, setBusqueda] = useState(params.get('q') || '');
  const [filtroEspecie, setFiltroEspecie] = useState('');
  const [especies, setEspecies] = useState([]);
  const [propietarios, setPropietarios] = useState([]);
  const [razas, setRazas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useAviso();
  const [form, setForm] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  const hoy = new Date().toLocaleDateString('en-CA'); // AAAA-MM-DD

  // Listas para los desplegables (se cargan una sola vez)
  useEffect(() => {
    Promise.all([api.get('/especies'), api.get('/propietarios')])
      .then(([e, p]) => {
        setEspecies([...e.data.data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        setPropietarios([...p.data.data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      })
      .catch((err) => setAviso({ tipo: 'error', texto: mensajeError(err) }));

    // Si vienes desde Propietarios con "+ Mascota", abre el formulario con ese dueño
    const nuevo = params.get('nuevo');
    if (nuevo) {
      setForm({ ...VACIO, fk_propietario: Number(nuevo) });
      setParams({}, { replace: true });
    }
  }, []);

  // Las razas dependen de la especie elegida en el formulario
  const especieForm = form?.fk_especie;
  useEffect(() => {
    if (!especieForm) {
      setRazas([]);
      return;
    }
    api.get('/razas', { params: { fk_especie: especieForm } })
      .then(({ data }) => setRazas(data.data))
      .catch(() => setRazas([]));
  }, [especieForm]);

  const cargar = async () => {
    setCargando(true);
    try {
      const filtros = {};
      if (busqueda.trim()) filtros.q = busqueda.trim();
      if (filtroEspecie) filtros.fk_especie = filtroEspecie;
      const { data } = await api.get('/mascotas', { params: filtros });
      setMascotas(data.data);
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err) });
    } finally {
      setCargando(false);
    }
  };

  // Busca mientras escribes (espera 350 ms después de la última tecla)
  useEffect(() => {
    const espera = setTimeout(cargar, 350);
    return () => clearTimeout(espera);
  }, [busqueda, filtroEspecie]);

  const abrirNuevo = () => {
    setEditandoId(null);
    setErrorForm('');
    setForm(VACIO);
  };

  const abrirEditar = (m) => {
    setEditandoId(m.id_mascota);
    setErrorForm('');
    setForm({
      nombre: m.nombre,
      sexo: m.sexo,
      fecha_nacimiento: m.fecha_nacimiento ?? '',
      peso: m.peso ?? '',
      color: m.color ?? '',
      fk_propietario: m.fk_propietario ?? '',
      fk_especie: m.fk_especie ?? '',
      fk_raza: m.fk_raza ?? '',
    });
  };

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  // Al cambiar de especie, la raza elegida deja de ser válida
  const cambiarEspecie = (e) => setForm({ ...form, fk_especie: e.target.value, fk_raza: '' });



  const guardar = async (e) => {
    e.preventDefault();
    setErrorForm('');
    setGuardando(true);

    const cuerpo = {
      nombre: form.nombre.trim(),
      sexo: form.sexo,
      fecha_nacimiento: form.fecha_nacimiento || null,
      peso: num(form.peso),
      color: form.color.trim() || null,
      fk_propietario: num(form.fk_propietario),
      fk_especie: num(form.fk_especie),
      fk_raza: num(form.fk_raza),
    };

    try {
      if (editandoId) await api.put(`/mascotas/${editandoId}`, cuerpo);
      else await api.post('/mascotas', cuerpo);
      setForm(null);
      setAviso({ tipo: 'ok', texto: editandoId ? 'Mascota actualizada' : 'Mascota creada' });
      cargar();
    } catch (err) {
      setErrorForm(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (m) => {
    if (!window.confirm(`¿Eliminar a "${m.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/mascotas/${m.id_mascota}`);
      setAviso({ tipo: 'ok', texto: 'Mascota eliminada' });
      cargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err) });
    }
  };

  const sexos = form?.sexo && !SEXOS.includes(form.sexo) ? [...SEXOS, form.sexo] : SEXOS;

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Mascotas</h1>
          <p className="sub">{mascotas.length} mascota(s)</p>
        </div>
        <button className="btn btn-naranja" onClick={abrirNuevo}>
          + Nueva mascota
        </button>
      </div>

      {aviso && <div className={`aviso aviso-${aviso.tipo}`}>{aviso.texto}</div>}

      <div className="barra">
        <input
          className="buscador"
          placeholder="Buscar por mascota, dueño, especie o raza..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select
          className="filtro"
          value={filtroEspecie}
          onChange={(e) => setFiltroEspecie(e.target.value)}
        >
          <option value="">Todas las especies</option>
          {especies.map((esp) => (
            <option key={esp.id_especie} value={esp.id_especie}>{esp.nombre}</option>
          ))}
        </select>
      </div>

      <div className="tabla-caja">
        <table className="tabla">
          <thead>
            <tr>
              <th>Mascota</th>
              <th>Especie / Raza</th>
              <th>Propietario</th>
              <th>Edad</th>
              <th>Peso</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={6} className="vacio">Cargando...</td></tr>
            ) : mascotas.length === 0 ? (
              <tr><td colSpan={6} className="vacio">No se encontraron mascotas</td></tr>
            ) : (
              mascotas.map((m) => (
                <tr key={m.id_mascota}>
                  <td>
                    <strong>{m.nombre}</strong>
                    <span className="mascota-sub">
                      {m.sexo}{m.color ? ` · ${m.color}` : ''}
                    </span>
                  </td>
                  <td>
                    {m.especie || '—'}
                    <span className="mascota-sub">{m.raza || 'Sin raza'}</span>
                  </td>
                  <td>{m.propietario || '—'}</td>
                  <td>{edad(m.fecha_nacimiento)}</td>
                  <td>{m.peso != null ? `${m.peso} kg` : '—'}</td>
                  <td className="acciones">
                    <button className="btn-mini" onClick={() => setHistorialId(m.id_mascota)}>Historial</button>
                    <button className="btn-mini" onClick={() => abrirEditar(m)}>Editar</button>
                    {esAdmin && (
                      <button className="btn-mini btn-mini-rojo" onClick={() => eliminar(m)}>
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
            <h2>{editandoId ? 'Editar mascota' : 'Nueva mascota'}</h2>

            <label>Propietario *</label>
            <select name="fk_propietario" value={form.fk_propietario} onChange={cambiar} required>
              <option value="">Selecciona un propietario</option>
              {propietarios.map((p) => (
                <option key={p.id_propietario} value={p.id_propietario}>
                  {p.nombre} — {p.documento}
                </option>
              ))}
            </select>

            <div className="fila">
              <div>
                <label>Nombre *</label>
                <input name="nombre" value={form.nombre} onChange={cambiar} required autoFocus />
              </div>
              <div>
                <label>Sexo *</label>
                <select name="sexo" value={form.sexo} onChange={cambiar} required>
                  <option value="">Selecciona</option>
                  {sexos.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="fila">
              <div>
                <label>Especie *</label>
                <select name="fk_especie" value={form.fk_especie} onChange={cambiarEspecie} required>
                  <option value="">Selecciona</option>
                  {especies.map((esp) => (
                    <option key={esp.id_especie} value={esp.id_especie}>{esp.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Raza</label>
                <select
                  name="fk_raza"
                  value={form.fk_raza}
                  onChange={cambiar}
                  disabled={!form.fk_especie}
                >
                  <option value="">{form.fk_especie ? 'Sin raza' : 'Elige la especie'}</option>
                  {razas.map((r) => (
                    <option key={r.id_raza} value={r.id_raza}>{r.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="fila">
              <div>
                <label>Fecha de nacimiento</label>
                <input
                  name="fecha_nacimiento"
                  type="date"
                  max={hoy}
                  value={form.fecha_nacimiento}
                  onChange={cambiar}
                />
              </div>
              <div>
                <label>Peso (kg)</label>
                <input
                  name="peso"
                  type="number"
                  min="0"
                  max="999.99"
                  step="0.01"
                  value={form.peso}
                  onChange={cambiar}
                />
              </div>
            </div>

            <label>Color</label>
            <input name="color" value={form.color} onChange={cambiar} />

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
      {historialId && (
        <HistorialMascota idMascota={historialId} onCerrar={() => setHistorialId(null)} />
      )}
    </>
  );
}