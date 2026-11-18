const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { generarToken } = require('../utils/jwt');

const ROLES_VALIDOS = ['ADMIN', 'VETERINARIO', 'RECEPCIONISTA'];

const crearError = (mensaje, codigo) => {
    const error = new Error(mensaje);
    error.statusCode = codigo;
    return error;
};

class AuthService {
    static async registrarUsuario(datos) {
        const { nombre, usuario, contrasena, rol } = datos;

        if (!nombre || !usuario || !contrasena) {
            throw crearError('Nombre, usuario y contrasena son obligatorios', 400);
        }

        if (String(contrasena).length < 8) {
            throw crearError('La contrasena debe tener al menos 8 caracteres', 400);
        }

        const rolFinal = rol || 'RECEPCIONISTA';
        if (!ROLES_VALIDOS.includes(rolFinal)) {
            throw crearError(`Rol no válido. Roles permitidos: ${ROLES_VALIDOS.join(', ')}`, 400);
        }

        const [existentes] = await pool.execute(
            'SELECT id_usuario FROM Usuarios WHERE usuario = ?',
            [usuario]
        );
        if (existentes.length > 0) {
            throw crearError('El usuario ya está registrado', 400);
        }

        const saltRounds = 10;
        const contrasenaHash = await bcrypt.hash(contrasena, saltRounds);

        const [resultado] = await pool.execute(
            'INSERT INTO Usuarios (nombre, usuario, contrasena, rol) VALUES (?, ?, ?, ?)',
            [nombre, usuario, contrasenaHash, rolFinal]
        );

        const nuevoUsuario = {
            id_usuario: resultado.insertId,
            nombre,
            usuario,
            rol: rolFinal
        };
        const token = generarToken(nuevoUsuario);

        return { usuario: nuevoUsuario, token };
    }

    static async listarPersonalClinico() {
        const [filas] = await pool.query(
            "SELECT id_usuario, nombre, rol FROM Usuarios WHERE rol IN ('VETERINARIO', 'ADMIN') ORDER BY nombre"
        );
        return filas;
    }

    static async listarUsuarios() {
        const [filas] = await pool.query(
            'SELECT id_usuario, nombre, usuario, rol FROM Usuarios ORDER BY id_usuario'
        );
        return filas;
    }

    static async actualizarUsuario(id, datos, idSolicitante) {
        const { nombre, rol } = datos;

        if (!nombre || !String(nombre).trim()) {
            throw crearError('El nombre es obligatorio', 400);
        }
        if (!ROLES_VALIDOS.includes(rol)) {
            throw crearError(`Rol no válido. Roles permitidos: ${ROLES_VALIDOS.join(', ')}`, 400);
        }
        // Un admin no puede quitarse su propio rol (evita quedarse sin administradores)
        if (Number(id) === Number(idSolicitante) && rol !== 'ADMIN') {
            throw crearError('No puedes quitarte tu propio rol de ADMIN', 400);
        }

        const [resultado] = await pool.execute(
            'UPDATE Usuarios SET nombre = ?, rol = ? WHERE id_usuario = ?',
            [String(nombre).trim(), rol, id]
        );
        if (resultado.affectedRows === 0) {
            throw crearError('Usuario no encontrado', 404);
        }
    }

    static async restablecerContrasena(id, nueva) {
        if (!nueva || String(nueva).length < 8) {
            throw crearError('La nueva contrasena debe tener al menos 8 caracteres', 400);
        }
        const hash = await bcrypt.hash(String(nueva), 10);
        const [resultado] = await pool.execute(
            'UPDATE Usuarios SET contrasena = ? WHERE id_usuario = ?',
            [hash, id]
        );
        if (resultado.affectedRows === 0) {
            throw crearError('Usuario no encontrado', 404);
        }
    }

    static async login(usuario, contrasena) {
        const [usuarios] = await pool.execute(
            'SELECT * FROM Usuarios WHERE usuario = ?',
            [usuario]
        );
        const encontrado = usuarios[0];

        if (!encontrado) {
            throw crearError('Credenciales inválidas', 401);
        }

        const contrasenaValida = await bcrypt.compare(contrasena, encontrado.contrasena);
        if (!contrasenaValida) {
            throw crearError('Credenciales inválidas', 401);
        }

        const token = generarToken(encontrado);
        const { contrasena: _oculta, ...usuarioSinContrasena } = encontrado;

        return { usuario: usuarioSinContrasena, token };
    }
}

module.exports = AuthService;