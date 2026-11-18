// Errores de MySQL traducidos a mensajes que se entienden
const erroresMySQL = {
    ER_DUP_ENTRY: {
        codigo: 409,
        mensaje: 'Ya existe un registro con ese valor (hay un campo único repetido)'
    },
    ER_NO_REFERENCED_ROW_2: {
        codigo: 400,
        mensaje: 'Un dato relacionado no existe (revisa los ids de propietario, mascota, especie, etc.)'
    },
    ER_ROW_IS_REFERENCED_2: {
        codigo: 409,
        mensaje: 'No se puede eliminar porque tiene registros relacionados'
    },
    ER_BAD_NULL_ERROR: {
        codigo: 400,
        mensaje: 'Falta un campo obligatorio'
    },
    ER_NO_DEFAULT_FOR_FIELD: {
        codigo: 400,
        mensaje: 'Falta un campo obligatorio'
    },
    ER_TRUNCATED_WRONG_VALUE: {
        codigo: 400,
        mensaje: 'Un campo tiene un formato inválido (fechas: AAAA-MM-DD, horas: HH:MM:SS)'
    },
    ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: {
        codigo: 400,
        mensaje: 'Un campo tiene un formato inválido (fechas: AAAA-MM-DD, horas: HH:MM:SS)'
    },
    ER_CHECK_CONSTRAINT_VIOLATED: {
        codigo: 400,
        mensaje: 'Un valor no cumple las reglas del sistema (por ejemplo, precio o stock negativo)'
    },
    ER_CONSTRAINT_FAILED: {
        codigo: 400,
        mensaje: 'Un valor no cumple las reglas del sistema (por ejemplo, precio o stock negativo)'
    },
    ER_DATA_TOO_LONG: {
        codigo: 400,
        mensaje: 'Un texto es demasiado largo para ese campo'
    },
    ER_WARN_DATA_OUT_OF_RANGE: {
        codigo: 400,
        mensaje: 'Un número está fuera del rango permitido'
    }
};

const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${err.message}`);

    const conocido = erroresMySQL[err.code];
    const statusCode = conocido ? conocido.codigo : (err.statusCode || 500);

    let mensaje = conocido ? conocido.mensaje : (err.message || 'Error interno del servidor');

    // En producción, un error inesperado no debe mostrar detalles internos
    if (statusCode === 500 && process.env.NODE_ENV !== 'development') {
        mensaje = 'Error interno del servidor';
    }

    res.status(statusCode).json({
        success: false,
        error: {
            message: mensaje,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }
    });
};

module.exports = errorHandler;