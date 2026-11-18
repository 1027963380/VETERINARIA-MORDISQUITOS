import { useEffect, useState } from 'react';
import api, { mensajeError } from '../api/axios';

const DIAS = [7, 15, 30, 60, 90];

const textoVacuna = (d) => {
  const n = Math.abs(d);
  if (d < 0) return `Vencida hace ${n} ${n === 1 ? 'día' : 'días'}`;
  if (d === 0) return 'Vence hoy';
  return `En ${d} ${d === 1 ? 'día' : 'días'}`;
};

const ETIQUETA_INV = {
  VENCIDO: { texto: 'Vencido', clase: 'chip-rojo' },
  POR_VENCER: { texto: 'Por vencer', clase: 'chip-naranja' },
  STOCK_BAJO: { texto: 'Stock bajo', clase: 'chip-naranja' },
};

// Enlace de WhatsApp (asume números de Colombia de 10 dígitos)
const linkWhatsApp = (telefono, mascota, vacuna) => {
  const n = String(telefono || '').replace(/\D/g, '');
  if (n.length < 10) return null;
  const numero = n.length === 10 ? `57${n}` : n;
  const mensaje = `Hola, le escribimos de Mordisquitos. A ${mascota} le corresponde el refuerzo de ${vacuna}. ¿Desea agendar una cita?`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
};

export default function Alertas() {
  const [dias, setDias] = useState(30);
  const [vacunas, setVacunas] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');
    Promise.all([
      api.get('/alertas/vacunas', { params: { dias } }),
      api.get('/alertas/inventario', { params: { dias } }),
    ])
      .then(([v, i]) => {
        if (!activo) return;
        setVacunas(v.data.data);
        setInventario(i.data.data);
      })
      .catch((err) => activo && setError(mensajeError(err)))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [dias]);

  const vencidas = vacunas.filter((v) => v.estado === 'VENCIDA').length;
  const proximas = vacunas.length - vencidas;
  const prodVencidos = inventario.filter((p) => p.alerta === 'VENCIDO' || p.alerta === 'POR_VENCER').length;
  const stockBajo = inventario.filter((p) => p.stock <= p.stock_minimo).length;

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Alertas</h1>
          <p className="sub">Lo que necesita atención en los próximos {dias} días</p>
        </div>
        <select className="filtro" value={dias} onChange={(e) => setDias(Number(e.target.value))}>
          {DIAS.map((d) => (
            <option key={d} value={d}>Próximos {d} días</option>
          ))}
        </select>
      </div>

      {error && <div className="aviso aviso-error">{error}</div>}

      <section className="resumen">
        <div className="dato dato-rojo"><strong>{vencidas}</strong><span>Vacunas vencidas</span></div>
        <div className="dato dato-naranja"><strong>{proximas}</strong><span>Vacunas próximas</span></div>
        <div className="dato dato-rojo"><strong>{stockBajo}</strong><span>Productos con stock bajo</span></div>
        <div className="dato dato-naranja"><strong>{prodVencidos}</strong><span>Productos vencidos o por vencer</span></div>
      </section>

      <h2 className="subtitulo">💉 Vacunas por vencer</h2>
      <div className="tabla-caja">
        <table className="tabla">
          <thead>
            <tr>
              <th>Mascota</th>
              <th>Propietario</th>
              <th>Vacuna</th>
              <th>Refuerzo</th>
              <th>Estado</th>
              <th>Avisar</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={6} className="vacio">Cargando...</td></tr>
            ) : vacunas.length === 0 ? (
              <tr><td colSpan={6} className="vacio">✅ No hay vacunas por vencer en este periodo</td></tr>
            ) : (
              vacunas.map((v, i) => {
                const wa = linkWhatsApp(v.telefono, v.mascota, v.vacuna);
                return (
                  <tr key={`${v.id_mascota}-${v.vacuna}-${i}`}>
                    <td><strong>{v.mascota}</strong></td>
                    <td>
                      {v.propietario}
                      <span className="mascota-sub">{v.telefono}</span>
                    </td>
                    <td>{v.vacuna}</td>
                    <td>{v.proxima_fecha}</td>
                    <td>
                      <span className={`chip ${v.estado === 'VENCIDA' ? 'chip-rojo' : 'chip-naranja'}`}>
                        {textoVacuna(v.dias_restantes)}
                      </span>
                    </td>
                    <td className="acciones">
                      {wa ? (
                        <a className="btn-mini btn-mini-verde" href={wa} target="_blank" rel="noreferrer">
                          WhatsApp
                        </a>
                      ) : (
                        <span className="nota">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <h2 className="subtitulo">📦 Inventario en alerta</h2>
      <div className="tabla-caja">
        <table className="tabla">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Tipo</th>
              <th>Stock</th>
              <th>Vence</th>
              <th>Alerta</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={5} className="vacio">Cargando...</td></tr>
            ) : inventario.length === 0 ? (
              <tr><td colSpan={5} className="vacio">✅ El inventario está al día</td></tr>
            ) : (
              inventario.map((p) => {
                const etiqueta = ETIQUETA_INV[p.alerta] || { texto: p.alerta, clase: 'chip-gris' };
                const bajo = p.stock <= p.stock_minimo;
                return (
                  <tr key={p.id_producto}>
                    <td><strong>{p.nombre}</strong></td>
                    <td>{p.tipo || '—'}</td>
                    <td>
                      <span className={bajo ? 'chip chip-rojo' : 'chip chip-verde'}>{p.stock}</span>
                      <small className="nota"> mín. {p.stock_minimo}</small>
                    </td>
                    <td>{p.fecha_vencimiento || '—'}</td>
                    <td><span className={`chip ${etiqueta.clase}`}>{etiqueta.texto}</span></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}