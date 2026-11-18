const express = require('express');
const pool = require('../config/db');
const { verificarToken, autorizarRoles } = require('../middlewares/authMiddleware');

const crearError = (mensaje, codigo) => {
    const error = new Error(mensaje);
    error.statusCode = codigo;
    return error;
};

// Se queda solo con los campos permitidos (así nadie puede meter columnas extra)
const filtrarCampos = (cuerpo, permitidos) => {
    const datos = {};
    for (const campo of permitidos) {
        if (cuerpo[campo] !== undefined) {
            datos[campo] = cuerpo[campo];
        }
    }
    return datos;
};

const estaVacio = (valor) => valor === undefined || valor === null || valor === '';

const crearCrud = ({
    tabla,
    id,
    campos,
    requeridos = [],
    alias = null,
    selectBase = null,
    defaults = {},
    campoUsuario = null,
    rolesEscritura = ['ADMIN'],
    rolesEliminar = ['ADMIN'],
    busqueda = []
}) => {
    const router = express.Router();
    const base = selectBase || `SELECT * FROM ${tabla}`;
    const pk = alias ? `${alias}.${id}` : id;
    const prefijo = alias ? `${alias}.` : '';

    // Todas las rutas de este módulo exigen estar logueada
    router.use(verificarToken);

    // LISTAR con filtros y búsqueda
    // Ejemplos: /productos?q=collar   /productos?tipo=Accesorio&marca=PetCare
    router.get('/', async (req, res, next) => {
        try {
            const condiciones = [];
            const valores = [];

            // Filtro exacto por columna (solo columnas permitidas en "campos")
            for (const campo of campos) {
                const valor = req.query[campo];
                if (valor !== undefined && valor !== '') {
                    condiciones.push(`${prefijo}${campo} = ?`);
                    valores.push(String(valor));
                }
            }

            // Búsqueda de texto en las columnas definidas en "busqueda"
            if (req.query.q && busqueda.length > 0) {
                const texto = `%${String(req.query.q)}%`;
                condiciones.push('(' + busqueda.map((c) => `${c.includes('.') ? c : prefijo + c} LIKE ?`).join(' OR ') + ')');
                busqueda.forEach(() => valores.push(texto));
            }

            const where = condiciones.length ? ` WHERE ${condiciones.join(' AND ')}` : '';
            const [filas] = await pool.execute(`${base}${where} ORDER BY ${pk} DESC`, valores);
            res.json({ success: true, total: filas.length, data: filas });
        } catch (error) {
            next(error);
        }
    });

    // OBTENER uno por id
    router.get('/:id', async (req, res, next) => {
        try {
            const [filas] = await pool.execute(`${base} WHERE ${pk} = ?`, [req.params.id]);
            if (filas.length === 0) {
                throw crearError('Registro no encontrado', 404);
            }
            res.json({ success: true, data: filas[0] });
        } catch (error) {
            next(error);
        }
    });

    // CREAR
    router.post('/', autorizarRoles(...rolesEscritura), async (req, res, next) => {
        try {
            const datos = filtrarCampos(req.body || {}, campos);

            for (const [campo, valor] of Object.entries(defaults)) {
                if (datos[campo] === undefined) {
                    datos[campo] = typeof valor === 'function' ? valor() : valor;
                }
            }

            // El usuario que registra sale del token, no del cuerpo de la petición
            if (campoUsuario) {
                datos[campoUsuario] = req.user.id;
            }

            const faltantes = requeridos.filter((campo) => estaVacio(datos[campo]));
            if (faltantes.length > 0) {
                throw crearError(`Faltan campos obligatorios: ${faltantes.join(', ')}`, 400);
            }

            const columnas = Object.keys(datos);
            const marcas = columnas.map(() => '?').join(', ');
            const [resultado] = await pool.execute(
                `INSERT INTO ${tabla} (${columnas.join(', ')}) VALUES (${marcas})`,
                Object.values(datos)
            );

            res.status(201).json({
                success: true,
                message: 'Registro creado exitosamente',
                data: { [id]: resultado.insertId, ...datos }
            });
        } catch (error) {
            next(error);
        }
    });

    // ACTUALIZAR (solo los campos que envíes)
    router.put('/:id', autorizarRoles(...rolesEscritura), async (req, res, next) => {
        try {
            const datos = filtrarCampos(req.body || {}, campos);
            const columnas = Object.keys(datos);

            if (columnas.length === 0) {
                throw crearError('No enviaste ningún campo para actualizar', 400);
            }

            const vacios = requeridos.filter((campo) => campo in datos && estaVacio(datos[campo]));
            if (vacios.length > 0) {
                throw crearError(`Estos campos no pueden quedar vacíos: ${vacios.join(', ')}`, 400);
            }

            const asignaciones = columnas.map((campo) => `${campo} = ?`).join(', ');
            const [resultado] = await pool.execute(
                `UPDATE ${tabla} SET ${asignaciones} WHERE ${id} = ?`,
                [...Object.values(datos), req.params.id]
            );

            if (resultado.affectedRows === 0) {
                throw crearError('Registro no encontrado', 404);
            }

            res.json({ success: true, message: 'Registro actualizado exitosamente' });
        } catch (error) {
            next(error);
        }
    });

    // ELIMINAR
    router.delete('/:id', autorizarRoles(...rolesEliminar), async (req, res, next) => {
        try {
            const [resultado] = await pool.execute(
                `DELETE FROM ${tabla} WHERE ${id} = ?`,
                [req.params.id]
            );

            if (resultado.affectedRows === 0) {
                throw crearError('Registro no encontrado', 404);
            }

            res.json({ success: true, message: 'Registro eliminado exitosamente' });
        } catch (error) {
            next(error);
        }
    });

    return router;
};

module.exports = crearCrud;