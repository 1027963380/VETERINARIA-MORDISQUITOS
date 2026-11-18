const pool = require('../config/db');

const CANCELADA = 'CANCELADA';
const DURACION_MIN = 30;      // cada cita ocupa 30 minutos
const VALIDAR_MASCOTA = true; // true = una mascota tampoco puede tener dos citas a la vez

const crearError = (mensaje, codigo) => {
  const error = new Error(mensaje);
  error.statusCode = codigo;
  return error;
};

// Convierte "10:30" o "10:30:00" en segundos desde la medianoche (null si no es una hora)
const aSegundos = (hora) => {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(String(hora).trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  const seg = Number(m[3] || 0);
  if (h > 23 || min > 59 || seg > 59) return null;
  return h * 3600 + min * 60 + seg;
};

exports.validarChoqueCita = async (req, res, next) => {
  try {
    const body = req.body || {};
    const idActual = Number.isInteger(Number(req.params.id)) ? Number(req.params.id) : 0;

    // 1) La hora debe caer en un intervalo de 30 minutos exactos (10:00, 10:30, 11:00...)
    if (body.hora !== undefined && body.hora !== null && body.hora !== '') {
      const seg = aSegundos(body.hora);
      if (seg === null || seg % (DURACION_MIN * 60) !== 0) {
        throw crearError(
          'La hora debe ser en intervalos de 30 minutos (por ejemplo 10:00, 10:30 o 11:00).',
          400
        );
      }
    }

    // En PUT, parte de la cita actual y encima aplica lo que llegó en el body
    let base = {};
    if (idActual) {
      const [actual] = await pool.query('SELECT * FROM Citas WHERE id_cita = ?', [idActual]);
      if (actual.length === 0) return next(); // el CRUD responderá 404
      base = actual[0];
    }
    const datos = { ...base, ...body };

    // En PUT, si no cambia la agenda (ej: marcar como atendida), no hace falta revisar
    if (idActual) {
      const cambiaAgenda = ['fecha', 'hora', 'fk_usuario', 'fk_mascota'].some((k) => body[k] !== undefined);
      const reactiva =
        String(base.estado || '').toUpperCase() === CANCELADA &&
        String(datos.estado || '').toUpperCase() !== CANCELADA;
      if (!cambiaAgenda && !reactiva) return next();
    }

    // Una cita cancelada no ocupa horario
    if (String(datos.estado || '').toUpperCase() === CANCELADA) return next();
    if (!datos.fecha || !datos.hora) return next(); // el CRUD valida los campos obligatorios

    const segundos = aSegundos(datos.hora);
    if (segundos === null) throw crearError('La hora no tiene un formato válido', 400);
    const ventana = DURACION_MIN * 60;

    // 2) El veterinario no puede tener otra cita que se cruce con esta
    if (datos.fk_usuario) {
      const [ocupado] = await pool.query(
        `SELECT id_cita FROM Citas
         WHERE fecha = ? AND fk_usuario = ? AND id_cita <> ? AND UPPER(estado) <> ?
           AND ABS(TIME_TO_SEC(hora) - ?) < ?
         LIMIT 1`,
        [datos.fecha, datos.fk_usuario, idActual, CANCELADA, segundos, ventana]
      );
      if (ocupado.length > 0) {
        throw crearError(
          'El veterinario no se encuentra disponible en ese horario. Por favor selecciona otro horario.',
          409
        );
      }
    }

    // 3) Una mascota tampoco puede estar en dos citas a la vez
    if (VALIDAR_MASCOTA && datos.fk_mascota) {
      const [repetida] = await pool.query(
        `SELECT id_cita FROM Citas
         WHERE fecha = ? AND fk_mascota = ? AND id_cita <> ? AND UPPER(estado) <> ?
           AND ABS(TIME_TO_SEC(hora) - ?) < ?
         LIMIT 1`,
        [datos.fecha, datos.fk_mascota, idActual, CANCELADA, segundos, ventana]
      );
      if (repetida.length > 0) {
        throw crearError(
          'Esa mascota ya tiene una cita a esa hora o a menos de 30 minutos. Por favor selecciona otro horario.',
          409
        );
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};