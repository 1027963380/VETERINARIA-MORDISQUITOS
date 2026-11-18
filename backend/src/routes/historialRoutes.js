const express = require('express');
const pool = require('../config/db');
const { verificarToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// GET /api/v1/mascotas/:id/historial
router.get('/:id/historial', verificarToken, async (req, res, next) => {
    try {
        const id = req.params.id;

        const [mascotas] = await pool.execute(
            `SELECT m.*, p.nombre AS propietario, p.telefono AS telefono_propietario,
                    e.nombre AS especie, r.nombre AS raza
             FROM Mascotas m
             LEFT JOIN Propietarios p ON m.fk_propietario = p.id_propietario
             LEFT JOIN Especies e ON m.fk_especie = e.id_especie
             LEFT JOIN Razas r ON m.fk_raza = r.id_raza
             WHERE m.id_mascota = ?`,
            [id]
        );

        if (mascotas.length === 0) {
            const error = new Error('Mascota no encontrada');
            error.statusCode = 404;
            throw error;
        }

        const [consultas] = await pool.execute(
            `SELECT co.*, u.nombre AS atendio
             FROM Consultas co
             LEFT JOIN Usuarios u ON co.fk_usuario = u.id_usuario
             WHERE co.fk_mascota = ?
             ORDER BY co.fecha DESC`,
            [id]
        );

        const [vacunaciones] = await pool.execute(
            `SELECT v.*, va.nombre AS vacuna
             FROM Vacunaciones v
             LEFT JOIN Vacunas va ON v.fk_vacuna = va.id_vacuna
             WHERE v.fk_mascota = ?
             ORDER BY v.fecha_aplicacion DESC`,
            [id]
        );

        const [citas] = await pool.execute(
            `SELECT c.*, u.nombre AS encargado
             FROM Citas c
             LEFT JOIN Usuarios u ON c.fk_usuario = u.id_usuario
             WHERE c.fk_mascota = ?
             ORDER BY c.fecha DESC, c.hora DESC`,
            [id]
        );

        res.json({
            success: true,
            data: { mascota: mascotas[0], consultas, vacunaciones, citas }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;