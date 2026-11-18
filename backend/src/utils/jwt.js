const jwt = require('jsonwebtoken');

const generarToken = (usuario) => {
    const payload = {
        id: usuario.id_usuario,
        usuario: usuario.usuario,
        rol: usuario.rol
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
};

module.exports = { generarToken };