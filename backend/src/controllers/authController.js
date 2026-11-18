const AuthService = require('../services/authService');

class AuthController {
    static async registrar(req, res, next) {
        try {
            const result = await AuthService.registrarUsuario(req.body || {});
            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    static async personal(req, res, next) {
        try {
            const data = await AuthService.listarPersonalClinico();
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async listar(req, res, next) {
        try {
            const data = await AuthService.listarUsuarios();
            res.json({ success: true, total: data.length, data });
        } catch (error) {
            next(error);
        }
    }

    static async actualizar(req, res, next) {
        try {
            await AuthService.actualizarUsuario(req.params.id, req.body || {}, req.user.id);
            res.json({ success: true, message: 'Usuario actualizado' });
        } catch (error) {
            next(error);
        }
    }

    static async restablecer(req, res, next) {
        try {
            await AuthService.restablecerContrasena(req.params.id, (req.body || {}).contrasena);
            res.json({ success: true, message: 'Contraseña actualizada' });
        } catch (error) {
            next(error);
        }
    }

    static async login(req, res, next) {
        try {
            const { usuario, contrasena } = req.body || {};

            if (!usuario || !contrasena) {
                return res.status(400).json({
                    success: false,
                    error: 'Usuario y contrasena son requeridos'
                });
            }

            const result = await AuthService.login(usuario, contrasena);
            res.status(200).json({
                success: true,
                message: 'Login exitoso',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AuthController;