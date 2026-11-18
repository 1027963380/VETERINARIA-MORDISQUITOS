import { useEffect, useState } from 'react';
import api, { mensajeError } from '../api/axios';
import useAviso from '../hooks/useAviso';

const METODOS = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'];

const moneda = (n) =>
  Number(n).toLocaleString('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  });
const fechaHora = (v) =>
  new Date(v).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
const diaLocal = (v) => new Date(v).toLocaleDateString('en-CA');

export default function Ventas() {
  const hoy = new Date().toLocaleDateString('en-CA');

  const [ventas, setVentas] = useState([]);
  const [fecha, setFecha] = useState(hoy); // '' = todas
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useAviso();

  const [productos, setProductos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [propietarios, setPropietarios] = useState([]);

  const [nueva, setNueva] = useState(null); // { propietario, metodo, lineas }
  const [selProd, setSelProd] = useState('');
  const [cantProd, setCantProd] = useState(1);
  const [selServ, setSelServ] = useState('');
  const [cantServ, setCantServ] = useState(1);
  const [errorVenta, setErrorVenta] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [detalle, setDetalle] = useState(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/ventas');
      setVentas(data.data);
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err) });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const visibles = ventas.filter((v) => !fecha || diaLocal(v.fecha) === fecha);
  const totalVendido = visibles.reduce((suma, v) => suma + Number(v.total), 0);

  // Al abrir, trae el stock y los precios actuales
  const abrirNueva = async () => {
    setErrorVenta('');
    setSelProd('');
    setSelServ('');
    setCantProd(1);
    setCantServ(1);
    setNueva({ propietario: '', metodo: 'EFECTIVO', lineas: [] });
    try {
      const [p, s, o] = await Promise.all([
        api.get('/productos'),
        api.get('/servicios'),
        api.get('/propietarios'),
      ]);
      setProductos(p.data.data);
      setServicios(s.data.data);
      setPropietarios([...o.data.data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    } catch (err) {
      setErrorVenta(mensajeError(err));
    }
  };

  const agregar = (tipo) => {
    setErrorVenta('');
    const esProd = tipo === 'producto';
    const id = Number(esProd ? selProd : selServ);
    const cantidad = Number(esProd ? cantProd : cantServ);

    if (!id) return setErrorVenta(esProd ? 'Elige un producto' : 'Elige un servicio');
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      return setErrorVenta('La cantidad debe ser un número entero mayor a 0');
    }

    const origen = (esProd ? productos : servicios).find(
      (x) => x[esProd ? 'id_producto' : 'id_servicio'] === id
    );
    if (!origen) return;

    const existente = nueva.lineas.find((l) => l.tipo === tipo && l.id === id);
    const total = (existente ? existente.cantidad : 0) + cantidad;
    if (esProd && total > origen.stock) {
      return setErrorVenta(`Solo hay ${origen.stock} en stock de "${origen.nombre}"`);
    }

    const lineas = existente
      ? nueva.lineas.map((l) => (l === existente ? { ...l, cantidad: total } : l))
      : [...nueva.lineas, { tipo, id, nombre: origen.nombre, precio: Number(origen.precio), cantidad }];

    setNueva({ ...nueva, lineas });
    if (esProd) { setSelProd(''); setCantProd(1); }
    else { setSelServ(''); setCantServ(1); }
  };

  const quitar = (linea) =>
    setNueva({ ...nueva, lineas: nueva.lineas.filter((l) => l !== linea) });

  const totalNueva = nueva
    ? nueva.lineas.reduce((suma, l) => suma + l.precio * l.cantidad, 0)
    : 0;

  const confirmar = async () => {
    if (nueva.lineas.length === 0) {
      return setErrorVenta('Agrega al menos un producto o servicio');
    }
    setErrorVenta('');
    setGuardando(true);
    try {
      const { data } = await api.post('/ventas', {
        metodo_pago: nueva.metodo,
        fk_propietario: nueva.propietario ? Number(nueva.propietario) : null,
        productos: nueva.lineas
          .filter((l) => l.tipo === 'producto')
          .map((l) => ({ fk_producto: l.id, cantidad: l.cantidad })),
        servicios: nueva.lineas
          .filter((l) => l.tipo === 'servicio')
          .map((l) => ({ fk_servicio: l.id, cantidad: l.cantidad })),
      });
      setNueva(null);
      setFecha(hoy);
      setAviso({ tipo: 'ok', texto: `Venta registrada por ${moneda(data.data.total)}` });
      cargar();
    } catch (err) {
      setErrorVenta(mensajeError(err)); // aquí sale "Stock insuficiente..."
    } finally {
      setGuardando(false);
    }
  };

  const verDetalle = async (v) => {
    try {
      const { data } = await api.get(`/ventas/${v.id_venta}`);
      setDetalle(data.data);
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeError(err) });
    }
  };

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Ventas</h1>
          <p className="sub">
            {visibles.length} venta(s) · {moneda(totalVendido)} {fecha ? 'en el día' : 'en total'}
          </p>
        </div>
        <button className="btn btn-naranja" onClick={abrirNueva}>
          + Nueva venta
        </button>
      </div>

      {aviso && <div className={`aviso aviso-${aviso.tipo}`}>{aviso.texto}</div>}

      <div className="barra">
        <div className="nav-fecha">
          <input type="date" className="filtro" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          <button className="btn-mini" onClick={() => setFecha(hoy)}>Hoy</button>
          <button className="btn-mini" onClick={() => setFecha('')}>Todas</button>
        </div>
      </div>

      <div className="tabla-caja">
        <table className="tabla">
          <thead>
            <tr>
              <th>N.º</th>
              <th>Fecha y hora</th>
              <th>Cliente</th>
              <th>Vendedor</th>
              <th>Pago</th>
              <th>Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={7} className="vacio">Cargando...</td></tr>
            ) : visibles.length === 0 ? (
              <tr><td colSpan={7} className="vacio">No hay ventas para este filtro</td></tr>
            ) : (
              visibles.map((v) => (
                <tr key={v.id_venta}>
                  <td><strong>#{v.id_venta}</strong></td>
                  <td>{fechaHora(v.fecha)}</td>
                  <td>{v.propietario || <span className="nota">Mostrador</span>}</td>
                  <td>{v.vendedor || '—'}</td>
                  <td><span className="chip chip-turquesa">{v.metodo_pago}</span></td>
                  <td><strong>{moneda(v.total)}</strong></td>
                  <td className="acciones">
                    <button className="btn-mini" onClick={() => verDetalle(v)}>Ver detalle</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ---------- Ventana: nueva venta ---------- */}
      {nueva && (
        <div className="modal-fondo" onClick={() => setNueva(null)}>
          <div className="modal modal-ancho" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva venta</h2>

            <div className="fila">
              <div>
                <label>Cliente (opcional)</label>
                <select
                  value={nueva.propietario}
                  onChange={(e) => setNueva({ ...nueva, propietario: e.target.value })}
                >
                  <option value="">Mostrador (sin cliente)</option>
                  {propietarios.map((p) => (
                    <option key={p.id_propietario} value={p.id_propietario}>
                      {p.nombre} — {p.documento}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Método de pago *</label>
                <select
                  value={nueva.metodo}
                  onChange={(e) => setNueva({ ...nueva, metodo: e.target.value })}
                >
                  {METODOS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <label>Agregar producto</label>
            <div className="linea-venta">
              <select value={selProd} onChange={(e) => setSelProd(e.target.value)}>
                <option value="">Selecciona un producto</option>
                {productos.map((p) => (
                  <option key={p.id_producto} value={p.id_producto} disabled={p.stock <= 0}>
                    {p.nombre} — {moneda(p.precio)} (stock {p.stock})
                  </option>
                ))}
              </select>
              <input type="number" min="1" step="1" value={cantProd} onChange={(e) => setCantProd(e.target.value)} />
              <button type="button" className="btn btn-gris" onClick={() => agregar('producto')}>Agregar</button>
            </div>

            <label>Agregar servicio</label>
            <div className="linea-venta">
              <select value={selServ} onChange={(e) => setSelServ(e.target.value)}>
                <option value="">
                  {servicios.length === 0 ? 'No hay servicios registrados' : 'Selecciona un servicio'}
                </option>
                {servicios.map((s) => (
                  <option key={s.id_servicio} value={s.id_servicio}>
                    {s.nombre} — {moneda(s.precio)}
                  </option>
                ))}
              </select>
              <input type="number" min="1" step="1" value={cantServ} onChange={(e) => setCantServ(e.target.value)} />
              <button type="button" className="btn btn-gris" onClick={() => agregar('servicio')}>Agregar</button>
            </div>

            <table className="carrito">
              <thead>
                <tr>
                  <th>Detalle</th>
                  <th className="der">Cant.</th>
                  <th className="der">Precio</th>
                  <th className="der">Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {nueva.lineas.length === 0 ? (
                  <tr><td colSpan={5} className="vacio">El carrito está vacío</td></tr>
                ) : (
                  nueva.lineas.map((l) => (
                    <tr key={`${l.tipo}-${l.id}`}>
                      <td>
                        {l.nombre}
                        <span className="mascota-sub">{l.tipo === 'producto' ? 'Producto' : 'Servicio'}</span>
                      </td>
                      <td className="der">{l.cantidad}</td>
                      <td className="der">{moneda(l.precio)}</td>
                      <td className="der"><strong>{moneda(l.precio * l.cantidad)}</strong></td>
                      <td className="der">
                        <button type="button" className="btn-mini btn-mini-rojo" onClick={() => quitar(l)}>Quitar</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="total-venta">
              <span>Total</span>
              <span>{moneda(totalNueva)}</span>
            </div>

            {errorVenta && <div className="error">{errorVenta}</div>}

            <div className="modal-botones">
              <button type="button" className="btn btn-gris" onClick={() => setNueva(null)}>Cancelar</button>
              <button type="button" className="btn btn-naranja" disabled={guardando} onClick={confirmar}>
                {guardando ? 'Registrando...' : 'Registrar venta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Ventana: detalle ---------- */}
      {detalle && (
        <div className="modal-fondo" onClick={() => setDetalle(null)}>
          <div className="modal modal-ancho" onClick={(e) => e.stopPropagation()}>
            <h2>Venta #{detalle.id_venta}</h2>
            <p className="ayuda-modal">
              {fechaHora(detalle.fecha)} · Cliente: {detalle.propietario || 'Mostrador'} · Vendedor: {detalle.vendedor || '—'} · Pago: {detalle.metodo_pago}
            </p>

            <table className="carrito">
              <thead>
                <tr>
                  <th>Detalle</th>
                  <th className="der">Cant.</th>
                  <th className="der">Precio</th>
                  <th className="der">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {detalle.productos.map((d) => (
                  <tr key={`p-${d.id_detalle}`}>
                    <td>{d.producto || 'Producto eliminado'}<span className="mascota-sub">Producto</span></td>
                    <td className="der">{d.cantidad}</td>
                    <td className="der">{moneda(d.precio_unitario)}</td>
                    <td className="der"><strong>{moneda(d.subtotal)}</strong></td>
                  </tr>
                ))}
                {detalle.servicios.map((d) => (
                  <tr key={`s-${d.id_detalle_servicio}`}>
                    <td>{d.servicio || 'Servicio eliminado'}<span className="mascota-sub">Servicio</span></td>
                    <td className="der">{d.cantidad}</td>
                    <td className="der">{moneda(d.precio)}</td>
                    <td className="der"><strong>{moneda(d.subtotal)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="total-venta">
              <span>Total</span>
              <span>{moneda(detalle.total)}</span>
            </div>

            <div className="modal-botones">
              <button type="button" className="btn btn-gris" onClick={() => setDetalle(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}