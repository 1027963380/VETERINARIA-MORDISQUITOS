// Uso: node normalizar-dump.js mordisquitosdb.sql
// Windows guarda las tablas en minúscula; Linux (el servidor) distingue mayúsculas.
// Este script deja los nombres de tablas como los usa tu código (Usuarios, Citas...).
const fs = require('fs');
const archivo = process.argv[2];
if (!archivo) { console.log('Uso: node normalizar-dump.js archivo.sql'); process.exit(1); }

const tablas = ['Propietarios','Especies','Razas','Mascotas','Usuarios','Consultas','Vacunas',
  'Vacunaciones','Citas','Servicios','Productos','Ventas','Detalle_venta','Detalle_servicio'];

let sql = fs.readFileSync(archivo, 'utf8');
for (const t of tablas) {
  sql = sql.replace(new RegExp('`' + t + '`', 'gi'), '`' + t + '`');
}
const salida = archivo.replace(/\.sql$/, '') + '.listo.sql';
fs.writeFileSync(salida, sql, 'utf8');
console.log('Listo ->', salida);
