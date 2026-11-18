const pool = require('../config/db');

// Última vacunación de cada mascota+vacuna, cuyo refuerzo vence pronto o ya venció
async function vacunasProximas(dias = 30) {
  const [rows] = await pool.query(
    `SELECT m.id_mascota, m.nombre AS mascota,
            p.nombre AS propietario, p.telefono,
            va.nombre AS vacuna, v.proxima_fecha,
            DATEDIFF(v.proxima_fecha, CURDATE()) AS dias_restantes,
            CASE WHEN v.proxima_fecha < CURDATE() THEN 'VENCIDA' ELSE 'PROXIMA' END AS estado
     FROM Vacunaciones v
     JOIN (
        SELECT fk_mascota, fk_vacuna, MAX(fecha_aplicacion) AS ultima
        FROM Vacunaciones
        GROUP BY fk_mascota, fk_vacuna
     ) u ON u.fk_mascota = v.fk_mascota
        AND u.fk_vacuna = v.fk_vacuna
        AND u.ultima = v.fecha_aplicacion
     JOIN Mascotas m ON m.id_mascota = v.fk_mascota
     JOIN Propietarios p ON p.id_propietario = m.fk_propietario
     JOIN Vacunas va ON va.id_vacuna = v.fk_vacuna
     WHERE v.proxima_fecha IS NOT NULL
       AND v.proxima_fecha <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
     ORDER BY v.proxima_fecha ASC`,
    [dias]
  );
  return rows;
}

// Productos con stock bajo o próximos a vencer
async function inventarioEnAlerta(dias = 30) {
  const [rows] = await pool.query(
    `SELECT id_producto, nombre, tipo, stock, stock_minimo, fecha_vencimiento,
            CASE
              WHEN fecha_vencimiento IS NOT NULL AND fecha_vencimiento < CURDATE() THEN 'VENCIDO'
              WHEN fecha_vencimiento IS NOT NULL
                   AND fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL ? DAY) THEN 'POR_VENCER'
              WHEN stock <= stock_minimo THEN 'STOCK_BAJO'
            END AS alerta
     FROM Productos
     WHERE stock <= stock_minimo
        OR (fecha_vencimiento IS NOT NULL
            AND fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL ? DAY))
     ORDER BY alerta, nombre`,
    [dias, dias]
  );
  return rows;
}

module.exports = { vacunasProximas, inventarioEnAlerta };