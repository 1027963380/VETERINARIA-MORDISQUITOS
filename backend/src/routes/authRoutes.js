const express = require('express');
const AuthController = require('../controllers/authController');
const { verificarToken, autorizarRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', verificarToken, autorizarRoles('ADMIN'), AuthController.registrar);
router.get('/usuarios', verificarToken, autorizarRoles('ADMIN'), AuthController.listar);
router.put('/usuarios/:id', verificarToken, autorizarRoles('ADMIN'), AuthController.actualizar);
router.put('/usuarios/:id/contrasena', verificarToken, autorizarRoles('ADMIN'), AuthController.restablecer);
router.post('/login', AuthController.login);
router.get('/personal', verificarToken, AuthController.personal);

router.get('/perfil', verificarToken, (req, res) => {
    res.json({
        success: true,
        data: `Hola ${req.user.usuario}, tu rol es ${req.user.rol}`
    });
});

router.get('/admin-dashboard', verificarToken, autorizarRoles('ADMIN'), (req, res) => {
    res.json({
        success: true,
        data: 'Bienvenido al panel de administración de Mordisquitos.'
    });
});

module.exports = router;