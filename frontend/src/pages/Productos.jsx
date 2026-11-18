import { useEffect, useState } from 'react';
import api, { mensajeError } from '../api/axios';
import { useAuth } from '../context/AuthContext';

const VACIO = {
  nombre: '', tipo: '', marca: '', precio: '',
  stock: '', stock_minimo: '', fecha_vencimiento: '',
};

const moneda = (n) =>
  Number(n).toLocaleString('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  });

export default function Productos() {
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === 'ADMIN';

  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState(null);
  const [form, setForm] = useState(null);          // null = ventana cerrada
  const [editandoId, setEditandoId] = useState(null);
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  const hoy = new Date().toLocaleDateString('en-CA'); // AAAA-MM-DD

  const cargar = async (q = '') => {
    setCargando(true);
    try {
      const { data } = await api.get('/productos', { params: q ? { q } : {} });
      setProductos(data.data);
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

  // El aviso desaparece solo a los 4 segundos
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 4000);
    return () => clearTimeout(t);
  }, [aviso]);

  const abrirNuevo = () => {
    setEditandoId(null);
    setErrorForm('');
    setForm(VACIO);
  };

  const abrirEditar = (p) => {
    setEditandoId(p.id_producto);
    setErrorForm('');
    setForm({
      nombre: p.nombre,
      tipo: p.tipo ?? '',
      marca: p.marca ?? '',
      precio: p.precio,
      stock: p.stock,
      stock_minimo: p.stock_minimo,
      fecha_vencimiento: p.fecha_vencimiento ?? '',
    });
  };

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setErrorForm('');
    setGuardando(true);

    const numero = (v) => (v === '' ? '' : Number(v));
    const cuerpo = {
      nombre: form.nombre.trim(),
      tipo: form.tipo.trim() || null,
      marca: form.marca.trim() || null,
      precio: numero(form.precio),
      stock: numero(form.stock),
      stock_minimo: numero(form.stock_minimo),
      fecha_vencimiento: form.fecha_vencimiento || null,
    };

    try {
      if (editandoId) await api.put(`/productos/${editandoId}`, cuerpo);
      else await api.post('/productos', cuerpo);
      setForm(null);
      setAviso({ tipo: 'ok', texto: editandoId ? 'Producto actualizado' : 'Producto creado' });
      cargar(busqueda.trim());
    } catch (err) {
      setErrorForm(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (p) => {
    if (!window.confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/productos/${p.id_producto}`);
      setAviso({ tipo: 'ok', texto: 'Producto eliminado' });
      cargar(busqueda.trim());
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err) });
    }
  };

  const columnas = esAdmin ? 7 : 6;

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Productos</h1>
          <p className="sub">{productos.length} producto(s)</p>
        </div>
        {esAdmin && (
          <button className="btn btn-naranja" onClick={abrirNuevo}>
            + Nuevo producto
          </button>
        )}
      </div>

      {aviso && <div className={`aviso aviso-${aviso.tipo}`}>{aviso.texto}</div>}

      <input
        className="buscador"
        placeholder="Buscar por nombre, tipo o marca..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div className="tabla-caja">
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Marca</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Vence</th>
              {esAdmin && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={columnas} className="vacio">Cargando...</td></tr>
            ) : productos.length === 0 ? (
              <tr><td colSpan={columnas} className="vacio">No se encontraron productos</td></tr>
            ) : (
              productos.map((p) => (
                <tr key={p.id_producto}>
                  <td><strong>{p.nombre}</strong></td>
                  <td>{p.tipo || '—'}</td>
                  <td>{p.marca || '—'}</td>
                  <td>{moneda(p.precio)}</td>
                  <td>
                    <span className={p.stock <= p.stock_minimo ? 'chip chip-rojo' : 'chip chip-verde'}>
                      {p.stock}
                    </span>
                    {p.stock <= p.stock_minimo && <small className="nota"> mín. {p.stock_minimo}</small>}
                  </td>
                  <td>
                    {p.fecha_vencimiento ? (
                      <span className={p.fecha_vencimiento < hoy ? 'chip chip-rojo' : ''}>
                        {p.fecha_vencimiento}
                        {p.fecha_vencimiento < hoy && ' (vencido)'}
                      </span>
                    ) : '—'}
                  </td>
                  {esAdmin && (
                    <td className="acciones">
                      <button className="btn-mini" onClick={() => abrirEditar(p)}>Editar</button>
                      <button className="btn-mini btn-mini-rojo" onClick={() => eliminar(p)}>Eliminar</button>
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
            <h2>{editandoId ? 'Editar producto' : 'Nuevo producto'}</h2>

            <label>Nombre *</label>
            <input name="nombre" value={form.nombre} onChange={cambiar} required autoFocus />

            <div className="fila">
              <div>
                <label>Tipo</label>
                <input name="tipo" value={form.tipo} onChange={cambiar} />
              </div>
              <div>
                <label>Marca</label>
                <input name="marca" value={form.marca} onChange={cambiar} />
              </div>
            </div>

            <div className="fila">
              <div>
                <label>Precio *</label>
                <input name="precio" type="number" min="0" step="any" value={form.precio} onChange={cambiar} required />
              </div>
              <div>
                <label>Vencimiento</label>
                <input name="fecha_vencimiento" type="date" value={form.fecha_vencimiento} onChange={cambiar} />
              </div>
            </div>

            <div className="fila">
              <div>
                <label>Stock *</label>
                <input name="stock" type="number" min="0" step="1" value={form.stock} onChange={cambiar} required />
              </div>
              <div>
                <label>Stock mínimo *</label>
                <input name="stock_minimo" type="number" min="0" step="1" value={form.stock_minimo} onChange={cambiar} required />
              </div>
            </div>

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