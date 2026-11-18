const pool = require('../config/db');

const METODOS_PAGO = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'];

const crearError = (mensaje, codigo) => {
    const error = new Error(mensaje);
    error.statusCode = codigo;
    return error;
};

const redondear = (numero) => Math.round(numero * 100) / 100;

// Junta los ítems repetidos (mismo id) sumando sus cantidades y valida cada uno
const normalizarItems = (items, campoId) => {
    if (items !== undefined && !Array.isArray(items)) {
        throw crearError(`"${campoId === 'fk_producto' ? 'productos' : 'servicios'}" debe ser una lista`, 400);
    }

    const mapa = new Map();
    for (const item of items || []) {
        const idItem = Number(item[campoId]);
        const cantidad = Number(item.cantidad);

        if (!Number.isInteger(idItem) || idItem <= 0 || !Number.isInteger(cantidad) || cantidad <= 0) {
            throw crearError(`Cada ítem necesita ${campoId} y una cantidad entera mayor a 0`, 400);
        }
        mapa.set(idItem, (mapa.get(idItem) || 0) + cantidad);
    }

    // Ordenados por id para evitar bloqueos cruzados entre ventas simultáneas
    return [...mapa.entries()].sort((a, b) => a[0] - b[0]);
};

const SELECT_VENTA = `
    SELECT v.*, p.nombre AS propietario, u.nombre AS vendedor
    FROM Ventas v
    LEFT JOIN Propietarios p ON v.fk_propietario = p.id_propietario
    LEFT JOIN Usuarios u ON v.fk_usuario = u.id_usuario`;

class VentaService {
    static async crearVenta(datos, idUsuario) {
        const metodoPago = String(datos.metodo_pago || '').toUpperCase();
        if (!METODOS_PAGO.includes(metodoPago)) {
            throw crearError(`metodo_pago es obligatorio. Opciones: ${METODOS_PAGO.join(', ')}`, 400);
        }

        const productos = normalizarItems(datos.productos, 'fk_producto');
        const servicios = normalizarItems(datos.servicios, 'fk_servicio');
        if (productos.length === 0 && servicios.length === 0) {
            throw crearError('La venta debe incluir al menos un producto o un servicio', 400);
        }

        // Una "transacción" es todo o nada: si algo falla, no se guarda NADA
        const conexion = await pool.getConnection();
        try {
            await conexion.beginTransaction();

            let total = 0;
            const lineasProductos = [];
            const lineasServicios = [];

            for (const [idProducto, cantidad] of productos) {
                const [filas] = await conexion.execute(
                    'SELECT nombre, precio, stock FROM Productos WHERE id_producto = ? FOR UPDATE',
                    [idProducto]
                );
                if (filas.length === 0) {
                    throw crearError(`El producto ${idProducto} no existe`, 404);
                }
                const producto = filas[0];
                if (producto.stock < cantidad) {
                    throw crearError(
                        `Stock insuficiente de "${producto.nombre}": hay ${producto.stock} y pediste ${cantidad}`,
                        400
                    );
                }
                const precio = Number(producto.precio);
                const subtotal = redondear(precio * cantidad);
                total += subtotal;
                lineasProductos.push({ idProducto, cantidad, precio, subtotal });
            }

            for (const [idServicio, cantidad] of servicios) {
                const [filas] = await conexion.execute(
                    'SELECT precio FROM Servicios WHERE id_servicio = ?',
                    [idServicio]
                );
                if (filas.length === 0) {
                    throw crearError(`El servicio ${idServicio} no existe`, 404);
                }
                const precio = Number(filas[0].precio);
                const subtotal = redondear(precio * cantidad);
                total += subtotal;
                lineasServicios.push({ idServicio, cantidad, precio, subtotal });
            }

            total = redondear(total);

            const [venta] = await conexion.execute(
                'INSERT INTO Ventas (fecha, total, metodo_pago, fk_propietario, fk_usuario) VALUES (NOW(), ?, ?, ?, ?)',
                [total, metodoPago, datos.fk_propietario || null, idUsuario]
            );
            const idVenta = venta.insertId;

            for (const linea of lineasProductos) {
                await conexion.execute(
                    'INSERT INTO Detalle_venta (cantidad, precio_unitario, subtotal, fk_venta, fk_producto) VALUES (?, ?, ?, ?, ?)',
                    [linea.cantidad, linea.precio, linea.subtotal, idVenta, linea.idProducto]
                );
                await conexion.execute(
                    'UPDATE Productos SET stock = stock - ? WHERE id_producto = ?',
                    [linea.cantidad, linea.idProducto]
                );
            }

            for (const linea of lineasServicios) {
                await conexion.execute(
                    'INSERT INTO Detalle_servicio (cantidad, precio, subtotal, fk_venta, fk_servicio) VALUES (?, ?, ?, ?, ?)',
                    [linea.cantidad, linea.precio, linea.subtotal, idVenta, linea.idServicio]
                );
            }

            await conexion.commit();

            return {
                id_venta: idVenta,
                total,
                metodo_pago: metodoPago,
                productos: lineasProductos.length,
                servicios: lineasServicios.length
            };
        } catch (error) {
            await conexion.rollback();
            throw error;
        } finally {
            conexion.release();
        }
    }

    static async listarVentas() {
        const [filas] = await pool.query(`${SELECT_VENTA} ORDER BY v.id_venta DESC`);
        return filas;
    }

    static async obtenerVenta(id) {
        const [ventas] = await pool.execute(`${SELECT_VENTA} WHERE v.id_venta = ?`, [id]);
        if (ventas.length === 0) {
            throw crearError('Venta no encontrada', 404);
        }

        const [productos] = await pool.execute(
            `SELECT d.*, p.nombre AS producto
             FROM Detalle_venta d
             LEFT JOIN Productos p ON d.fk_producto = p.id_producto
             WHERE d.fk_venta = ?`,
            [id]
        );
        const [servicios] = await pool.execute(
            `SELECT d.*, s.nombre AS servicio
             FROM Detalle_servicio d
             LEFT JOIN Servicios s ON d.fk_servicio = s.id_servicio
             WHERE d.fk_venta = ?`,
            [id]
        );

        return { ...ventas[0], productos, servicios };
    }
}

module.exports = VentaService;