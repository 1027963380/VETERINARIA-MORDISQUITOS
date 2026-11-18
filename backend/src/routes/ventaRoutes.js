const express = require('express');
const VentaController = require('../controllers/ventaController');
const { verificarToken, autorizarRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(verificarToken);

router.get('/', VentaController.listar);
router.get('/:id', VentaController.obtener);
router.post('/', autorizarRoles('ADMIN', 'RECEPCIONISTA'), VentaController.crear);

module.exports = router;