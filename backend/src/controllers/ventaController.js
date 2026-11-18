const VentaService = require('../services/ventaService');

class VentaController {
    static async crear(req, res, next) {
        try {
            const result = await VentaService.crearVenta(req.body || {}, req.user.id);
            res.status(201).json({
                success: true,
                message: 'Venta registrada exitosamente',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    static async listar(req, res, next) {
        try {
            const ventas = await VentaService.listarVentas();
            res.json({ success: true, data: ventas });
        } catch (error) {
            next(error);
        }
    }

    static async obtener(req, res, next) {
        try {
            const venta = await VentaService.obtenerVenta(req.params.id);
            res.json({ success: true, data: venta });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = VentaController;