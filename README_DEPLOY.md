# Deploy – Veterinaria Mordisquitos

Orden: 1) Git  2) Base de datos  3) Backend  4) Frontend  5) Conectar todo.

## 1. Subir a GitHub
```
cd "VETERINARIA MORDISQUITOS"
git init
git add .
git commit -m "Veterinaria Mordisquitos - versión inicial"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/veterinaria-mordisquitos.git
git push -u origin main
```
(Antes crea el repo vacío en github.com, sin README). Verifica que `.env` NO aparezca en GitHub.

## 2. Exportar tu base de datos local
En CMD (no PowerShell), desde la carpeta `database`:
```
mysqldump -u root -p --routines --triggers --single-transaction --result-file=mordisquitosdb.sql mordisquitosdb
node normalizar-dump.js mordisquitosdb.sql
```
Se genera `mordisquitosdb.listo.sql`. Súbelo al repo (carpeta `database`).

## 3. Base de datos en la nube (Railway)
New Project > Provision MySQL > pestaña Variables/Connect: copia host, puerto, usuario, clave y base.
Importar (desde tu PC, con los datos públicos de conexión):
```
mysql -h HOST -P PUERTO -u USUARIO -p BASE < mordisquitosdb.listo.sql
```
(Si `mysql` no existe en CMD, usa MySQL Workbench: Server > Data Import.)

## 4. Backend (Railway)
New > GitHub Repo > elige el repo > Settings: Root Directory = `backend`, Start Command = `npm start`.
Variables:
```
NODE_ENV=production
DB_HOST=<host>   DB_PORT=<puerto>   DB_USER=<usuario>
DB_PASSWORD=<clave>   DB_NAME=<base>   DB_SSL=false
JWT_SECRET=<un secreto largo nuevo>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://TU-FRONT.vercel.app
```
No pongas PORT: Railway lo asigna. Settings > Networking > Generate Domain.
Prueba: `https://TU-BACK.up.railway.app/api/health`

## 5. Frontend (Vercel)
Add New Project > importa el repo > Root Directory = `frontend` (Vite se detecta solo).
Variable: `VITE_API_URL=https://TU-BACK.up.railway.app/api/v1`
Deploy. Luego vuelve a Railway y pon esa URL de Vercel en `CORS_ORIGIN`.

## Si algo falla
- "No hay conexión con el servidor": revisa VITE_API_URL (termina en /api/v1) y CORS_ORIGIN (sin "/" al final).
- Error de tabla "doesn't exist": el dump no se normalizó (paso 2).
- Al cambiar VITE_API_URL hay que hacer Redeploy en Vercel.
