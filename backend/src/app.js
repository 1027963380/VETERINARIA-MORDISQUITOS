const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');
const crudRoutes = require('./routes/crudRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const historialRoutes = require('./routes/historialRoutes');

const app = express();

app.use(helmet());
const origenes = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : '*';
app.use(cors({ origin: origenes }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Servidor de la veterinaria Mordisquitos operando correctamente',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/ventas', ventaRoutes);
app.use('/api/v1/mascotas', historialRoutes);
app.use('/api/v1', crudRoutes);
app.use('/api/v1/alertas', require('./routes/alertaRoutes'));

app.use(errorHandler);

module.exports = app;