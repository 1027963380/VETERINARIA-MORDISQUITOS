const router = require('express').Router();
const ctrl = require('../controllers/alertaController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/vacunas', verificarToken, ctrl.vacunas);
router.get('/inventario', verificarToken, ctrl.inventario);

module.exports = router;