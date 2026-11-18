import { useEffect, useState } from 'react';
import api, { mensajeError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import useAviso from '../hooks/useAviso';

const TABS = {
  especies: {
    titulo: 'Especies',
    singular: 'especie',
    ruta: '/especies',
    id: 'id_especie',
    campos: [{ name: 'nombre', label: 'Nombre', req: true, max: 50 }],
    columnas: [{ titulo: 'Especie', ver: (r) => <strong>{r.nombre}</strong> }],
    texto: (r) => r.nombre,
  },
  razas: {
    titulo: 'Razas',
    singular: 'raza',
    ruta: '/razas',
    id: 'id_raza',
    campos: [
      { name: 'nombre', label: 'Nombre', req: true, max: 80 },
      { name: 'fk_especie', label: 'Especie', tipo: 'especie', req: true },
    ],
    columnas: [
      { titulo: 'Raza', ver: (r) => <strong>{r.nombre}</strong> },
      { titulo: 'Especie', ver: (r) => r.especie || '—' },
    ],
    texto: (r) => `${r.nombre} ${r.especie || ''}`,
  },
  vacunas: {
    titulo: 'Vacunas',
    singular: 'vacuna',
    ruta: '/vacunas',
    id: 'id_vacuna',
    campos: [
      { name: 'nombre', label: 'Nombre', req: true, max: 100 },
      { name: 'descripcion', label: 'Descripción', max: 200, ph: 'Ej: Protege contra la rabia' },
      { name: 'periodicidad', label: 'Periodicidad', max: 50, ph: 'Ej: Anual, Cada 3 meses' },
    ],
    columnas: [
      { titulo: 'Vacuna', ver: (r) => <strong>{r.nombre}</strong> },
      { titulo: 'Descripción', ver: (r) => r.descripcion || '—' },
      { titulo: 'Periodicidad', ver: (r) => r.periodicidad || '—' },
    ],
    texto: (r) => `${r.nombre} ${r.descripcion || ''} ${r.periodicidad || ''}`,
  },
};

const ordenar = (lista, clave) =>
  [...lista].sort((a, b) => String(a[clave]).localeCompare(String(b[clave])));

export default function Catalogos() {
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === 'ADMIN';

  const [tab, setTab] = useState('especies');
  const [datos, setDatos] = useState({ especies: [], razas: [], vacunas: [] });
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useAviso();
  const [form, setForm] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cfg = TABS[tab];

  const cargar = async () => {
    try {
      const [e, r, v] = await Promise.all([
        api.get('/especies'),
        api.get('/razas'),
        api.get('/vacunas'),
      ]);
      setDatos({
        especies: ordenar(e.data.data, 'nombre'),
        razas: [...r.data.data].sort(
          (a, b) =>
            String(a.especie).localeCompare(String(b.especie)) ||
            a.nombre.localeCompare(b.nombre)
        ),
        vacunas: ordenar(v.data.data, 'nombre'),
      });
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err) });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const cambiarTab = (clave) => {
    setTab(clave);
    setBusqueda('');
    setForm(null);
  };

  const filas = datos[tab].filter((r) =>
    cfg.texto(r).toLowerCase().includes(busqueda.trim().toLowerCase())
  );

  const abrirNuevo = () => {
    setEditandoId(null);
    setErrorForm('');
    setForm(Object.fromEntries(cfg.campos.map((c) => [c.name, ''])));
  };

  const abrirEditar = (r) => {
    setEditandoId(r[cfg.id]);
    setErrorForm('');
    setForm(Object.fromEntries(cfg.campos.map((c) => [c.name, r[c.name] ?? ''])));
  };

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setErrorForm('');

    const cuerpo = {};
    for (const c of cfg.campos) {
      const v = String(form[c.name] ?? '').trim();
      cuerpo[c.name] = c.tipo === 'especie' ? Number(v) : v || null;
    }

    // La tabla de razas no bloquea duplicados, así que se avisa desde aquí
    if (tab === 'razas') {
      const repetida = datos.razas.some(
        (r) =>
          r.id_raza !== editandoId &&
          r.fk_especie === cuerpo.fk_especie &&
          r.nombre.trim().toLowerCase() === cuerpo.nombre.toLowerCase()
      );
      if (repetida) {
        setErrorForm('Esa raza ya existe en esa especie');
        return;
      }
    }

    setGuardando(true);
    try {
      if (editandoId) await api.put(`${cfg.ruta}/${editandoId}`, cuerpo);
      else await api.post(cfg.ruta, cuerpo);
      setForm(null);
      setAviso({
        tipo: 'ok',
        texto: editandoId ? `${cfg.titulo.slice(0, -1)} actualizada` : `${cfg.titulo.slice(0, -1)} creada`,
      });
      cargar();
    } catch (err) {
      setErrorForm(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (r) => {
    if (!window.confirm(`¿Eliminar "${r.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`${cfg.ruta}/${r[cfg.id]}`);
      setAviso({ tipo: 'ok', texto: 'Registro eliminado' });
      cargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err) });
    }
  };

  const columnasTotal = cfg.columnas.length + 1;

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Catálogos</h1>
          <p className="sub">Los datos base que se eligen al registrar mascotas y vacunas</p>
        </div>
        <button className="btn btn-naranja" onClick={abrirNuevo}>
          + Nueva {cfg.singular}
        </button>
      </div>

      {aviso && <div className={`aviso aviso-${aviso.tipo}`}>{aviso.texto}</div>}

      <div className="pestanas">
        {Object.entries(TABS).map(([clave, t]) => (
          <button
            key={clave}
            type="button"
            className={`pestana ${tab === clave ? 'activa' : ''}`}
            onClick={() => cambiarTab(clave)}
          >
            {t.titulo} ({datos[clave].length})
          </button>
        ))}
      </div>

      <input
        className="buscador"
        placeholder={`Buscar en ${cfg.titulo.toLowerCase()}...`}
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div className="tabla-caja">
        <table className="tabla">
          <thead>
            <tr>
              {cfg.columnas.map((c) => (
                <th key={c.titulo}>{c.titulo}</th>
              ))}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={columnasTotal} className="vacio">Cargando...</td></tr>
            ) : filas.length === 0 ? (
              <tr><td colSpan={columnasTotal} className="vacio">No hay {cfg.titulo.toLowerCase()} para mostrar</td></tr>
            ) : (
              filas.map((r) => (
                <tr key={r[cfg.id]}>
                  {cfg.columnas.map((c) => (
                    <td key={c.titulo}>{c.ver(r)}</td>
                  ))}
                  <td className="acciones">
                    <button className="btn-mini" onClick={() => abrirEditar(r)}>Editar</button>
                    {esAdmin && (
                      <button className="btn-mini btn-mini-rojo" onClick={() => eliminar(r)}>Eliminar</button>
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
            <h2>{editandoId ? `Editar ${cfg.singular}` : `Nueva ${cfg.singular}`}</h2>

            {cfg.campos.map((c, i) => (
              <div key={c.name}>
                <label>{c.label}{c.req ? ' *' : ''}</label>
                {c.tipo === 'especie' ? (
                  <select name={c.name} value={form[c.name]} onChange={cambiar} required={c.req}>
                    <option value="">
                      {datos.especies.length === 0 ? 'Primero crea una especie' : 'Selecciona una especie'}
                    </option>
                    {datos.especies.map((e) => (
                      <option key={e.id_especie} value={e.id_especie}>{e.nombre}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    name={c.name}
                    value={form[c.name]}
                    onChange={cambiar}
                    maxLength={c.max}
                    placeholder={c.ph}
                    required={c.req}
                    autoFocus={i === 0}
                  />
                )}
              </div>
            ))}

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
    </>
  );
}