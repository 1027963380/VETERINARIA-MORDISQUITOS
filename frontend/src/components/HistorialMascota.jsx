import { useEffect, useState } from 'react';
import api, { mensajeError } from '../api/axios';
import { fechaCorta, fechaHora } from '../utils/fechas';

const CLASE_ESTADO = {
  PROGRAMADA: 'chip-turquesa',
  ATENDIDA: 'chip-verde',
  CANCELADA: 'chip-gris',
};

const Dato = ({ titulo, valor }) =>
  valor ? (
    <p className="dato-linea"><strong>{titulo}:</strong> {valor}</p>
  ) : null;

export default function HistorialMascota({ idMascota, onCerrar }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [pestana, setPestana] = useState('consultas');

  useEffect(() => {
    api.get(`/mascotas/${idMascota}/historial`)
      .then(({ data }) => setDatos(data.data))
      .catch((err) => setError(mensajeError(err)));
  }, [idMascota]);

  const m = datos?.mascota;

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal modal-ancho" onClick={(e) => e.stopPropagation()}>
        {error && <div className="error">{error}</div>}
        {!datos && !error && <p className="vacio">Cargando historial...</p>}

        {datos && (
          <>
            <h2>🐾 {m.nombre}</h2>
            <p className="ayuda-modal">
              {m.especie || '—'} · {m.raza || 'Sin raza'} · {m.sexo}
              {m.peso != null ? ` · ${m.peso} kg` : ''}
              {m.fecha_nacimiento ? ` · Nació el ${fechaCorta(m.fecha_nacimiento)}` : ''}
            </p>
            <p className="ayuda-modal">
              Propietario: <strong>{m.propietario || '—'}</strong>
              {m.telefono_propietario ? ` · ${m.telefono_propietario}` : ''}
            </p>

            <div className="pestanas">
              {[
                ['consultas', `Consultas (${datos.consultas.length})`],
                ['vacunas', `Vacunas (${datos.vacunaciones.length})`],
                ['citas', `Citas (${datos.citas.length})`],
              ].map(([clave, texto]) => (
                <button
                  key={clave}
                  type="button"
                  className={`pestana ${pestana === clave ? 'activa' : ''}`}
                  onClick={() => setPestana(clave)}
                >
                  {texto}
                </button>
              ))}
            </div>

            {pestana === 'consultas' &&
              (datos.consultas.length === 0 ? (
                <p className="vacio">Sin consultas registradas</p>
              ) : (
                datos.consultas.map((c) => (
                  <div key={c.id_consulta} className="item-historial">
                    <strong>{fechaHora(c.fecha)} · {c.motivo}</strong>
                    <Dato titulo="Síntomas" valor={c.sintomas} />
                    <Dato titulo="Diagnóstico" valor={c.diagnostico} />
                    <Dato titulo="Tratamiento" valor={c.tratamiento} />
                    <Dato titulo="Observaciones" valor={c.observaciones} />
                    <Dato titulo="Peso" valor={c.peso != null ? `${c.peso} kg` : ''} />
                    <span className="mascota-sub">Atendió: {c.atendio || '—'}</span>
                  </div>
                ))
              ))}

            {pestana === 'vacunas' &&
              (datos.vacunaciones.length === 0 ? (
                <p className="vacio">Sin vacunas registradas</p>
              ) : (
                datos.vacunaciones.map((v) => (
                  <div key={v.id_vacunacion} className="item-historial">
                    <strong>{v.vacuna || 'Vacuna'} · {fechaCorta(v.fecha_aplicacion)}</strong>
                    <Dato titulo="Próximo refuerzo" valor={v.proxima_fecha ? fechaCorta(v.proxima_fecha) : ''} />
                    <Dato titulo="Lote" valor={v.lote} />
                    <Dato titulo="Observaciones" valor={v.observaciones} />
                  </div>
                ))
              ))}

            {pestana === 'citas' &&
              (datos.citas.length === 0 ? (
                <p className="vacio">Sin citas registradas</p>
              ) : (
                datos.citas.map((c) => (
                  <div key={c.id_cita} className="item-historial">
                    <strong>
                      {fechaCorta(c.fecha)} · {String(c.hora).slice(0, 5)} · {c.motivo}
                    </strong>
                    <span className={`chip ${CLASE_ESTADO[c.estado] || 'chip-gris'}`}>{c.estado}</span>
                    <span className="mascota-sub">Encargado: {c.encargado || 'Sin asignar'}</span>
                  </div>
                ))
              ))}
          </>
        )}

        <div className="modal-botones">
          <button type="button" className="btn btn-gris" onClick={onCerrar}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}