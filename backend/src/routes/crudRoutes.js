const express = require('express');
const crearCrud = require('../utils/crud');
const { verificarToken, autorizarRoles } = require('../middlewares/authMiddleware');
const { validarChoqueCita } = require('../middlewares/citaMiddleware');

const router = express.Router();

// Quiénes pueden crear y editar en cada módulo
const PERSONAL = ['ADMIN', 'VETERINARIO', 'RECEPCIONISTA'];
const CLINICO = ['ADMIN', 'VETERINARIO'];

// 1. PROPIETARIOS
router.use('/propietarios', crearCrud({
    tabla: 'Propietarios',
    id: 'id_propietario',
    campos: ['documento', 'nombre', 'telefono', 'direccion', 'correo'],
    requeridos: ['documento', 'nombre', 'telefono'],
    busqueda: ['nombre', 'documento', 'telefono'],
    rolesEscritura: PERSONAL
}));

// 2. ESPECIES
router.use('/especies', crearCrud({
    tabla: 'Especies',
    id: 'id_especie',
    campos: ['nombre'],
    requeridos: ['nombre'],
    rolesEscritura: CLINICO
}));

// 3. RAZAS
router.use('/razas', crearCrud({
    tabla: 'Razas',
    id: 'id_raza',
    alias: 'r',
    selectBase: `SELECT r.*, e.nombre AS especie
                 FROM Razas r
                 LEFT JOIN Especies e ON r.fk_especie = e.id_especie`,
    campos: ['nombre', 'fk_especie'],
    requeridos: ['nombre', 'fk_especie'],
    rolesEscritura: CLINICO
}));

// 4. MASCOTAS
router.use('/mascotas', crearCrud({
    tabla: 'Mascotas',
    id: 'id_mascota',
    alias: 'm',
    selectBase: `SELECT m.*, p.nombre AS propietario, e.nombre AS especie, r.nombre AS raza
                 FROM Mascotas m
                 LEFT JOIN Propietarios p ON m.fk_propietario = p.id_propietario
                 LEFT JOIN Especies e ON m.fk_especie = e.id_especie
                 LEFT JOIN Razas r ON m.fk_raza = r.id_raza`,
    campos: ['nombre', 'sexo', 'fecha_nacimiento', 'peso', 'color', 'fk_propietario', 'fk_especie', 'fk_raza'],
    requeridos: ['nombre', 'sexo', 'fk_propietario', 'fk_especie'],
    busqueda: ['nombre', 'color', 'p.nombre', 'e.nombre', 'r.nombre'],
    rolesEscritura: PERSONAL
}));

// Validación de choques de horario (va antes del CRUD de citas)
router.post('/citas', verificarToken, autorizarRoles(...PERSONAL), validarChoqueCita);
router.put('/citas/:id', verificarToken, autorizarRoles(...PERSONAL), validarChoqueCita);

// 5. CITAS
router.use('/citas', crearCrud({
    tabla: 'Citas',
    id: 'id_cita',
    alias: 'c',
    selectBase: `SELECT c.*, m.nombre AS mascota, p.nombre AS propietario, p.telefono AS telefono, u.nombre AS encargado
                 FROM Citas c
                 LEFT JOIN Mascotas m ON c.fk_mascota = m.id_mascota
                 LEFT JOIN Propietarios p ON m.fk_propietario = p.id_propietario
                 LEFT JOIN Usuarios u ON c.fk_usuario = u.id_usuario`,
    campos: ['fecha', 'hora', 'motivo', 'estado', 'fk_mascota', 'fk_usuario'],
    requeridos: ['fecha', 'hora', 'motivo', 'estado', 'fk_mascota', 'fk_usuario'],
    busqueda: ['motivo', 'm.nombre', 'p.nombre'],
    defaults: { estado: 'PROGRAMADA' },
    rolesEscritura: PERSONAL
}));

// 6. CONSULTAS (el veterinario que registra sale del token)
router.use('/consultas', crearCrud({
    tabla: 'Consultas',
    id: 'id_consulta',
    alias: 'co',
    selectBase: `SELECT co.*, m.nombre AS mascota, p.nombre AS propietario, u.nombre AS atendio
                 FROM Consultas co
                 LEFT JOIN Mascotas m ON co.fk_mascota = m.id_mascota
                 LEFT JOIN Propietarios p ON m.fk_propietario = p.id_propietario
                 LEFT JOIN Usuarios u ON co.fk_usuario = u.id_usuario`,
    campos: ['fecha', 'motivo', 'sintomas', 'diagnostico', 'tratamiento', 'observaciones', 'peso', 'fk_mascota'],
    requeridos: ['motivo', 'fk_mascota'],
    busqueda: ['co.motivo', 'co.diagnostico', 'm.nombre', 'p.nombre'],
    defaults: { fecha: () => new Date() },
    campoUsuario: 'fk_usuario',
    rolesEscritura: CLINICO
}));


// 7. VACUNAS (catálogo)
router.use('/vacunas', crearCrud({
    tabla: 'Vacunas',
    id: 'id_vacuna',
    campos: ['nombre', 'descripcion', 'periodicidad'],
    requeridos: ['nombre'],
    rolesEscritura: CLINICO
}));

// 8. VACUNACIONES (el usuario que registra sale del token)
router.use('/vacunaciones', crearCrud({
    tabla: 'Vacunaciones',
    id: 'id_vacunacion',
    alias: 'v',
    selectBase: `SELECT v.*, m.nombre AS mascota, p.nombre AS propietario, va.nombre AS vacuna, u.nombre AS aplico
                 FROM Vacunaciones v
                 LEFT JOIN Mascotas m ON v.fk_mascota = m.id_mascota
                 LEFT JOIN Propietarios p ON m.fk_propietario = p.id_propietario
                 LEFT JOIN Vacunas va ON v.fk_vacuna = va.id_vacuna
                 LEFT JOIN Usuarios u ON v.fk_usuario = u.id_usuario`,
    campos: ['fecha_aplicacion', 'proxima_fecha', 'lote', 'observaciones', 'fk_mascota', 'fk_vacuna'],
    requeridos: ['fk_mascota', 'fk_vacuna'],
    busqueda: ['m.nombre', 'p.nombre', 'va.nombre', 'v.lote'],
    defaults: { fecha_aplicacion: () => new Date() },
    campoUsuario: 'fk_usuario',
    rolesEscritura: CLINICO
}));

// 9. SERVICIOS
router.use('/servicios', crearCrud({
    tabla: 'Servicios',
    id: 'id_servicio',
    campos: ['nombre', 'descripcion', 'precio'],
    requeridos: ['nombre', 'precio'],
    busqueda: ['nombre', 'descripcion'],
    rolesEscritura: ['ADMIN']
}));

// 10. PRODUCTOS
router.use('/productos', crearCrud({
    tabla: 'Productos',
    id: 'id_producto',
    campos: ['nombre', 'tipo', 'marca', 'precio', 'stock', 'stock_minimo', 'fecha_vencimiento'],
    requeridos: ['nombre', 'precio', 'stock', 'stock_minimo'],
    busqueda: ['nombre', 'tipo', 'marca'],
    rolesEscritura: ['ADMIN']
}));

module.exports = router;