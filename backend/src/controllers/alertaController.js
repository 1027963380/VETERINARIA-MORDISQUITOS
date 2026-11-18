const alertaService = require('../services/alertaService');

function leerDias(req) {
  const d = parseInt(req.query.dias, 10);
  return Number.isInteger(d) && d > 0 && d <= 365 ? d : 30;
}

exports.vacunas = async (req, res, next) => {
  try {
    const data = await alertaService.vacunasProximas(leerDias(req));
    res.json({ total: data.length, data });
  } catch (err) { next(err); }
};

exports.inventario = async (req, res, next) => {
  try {
    const data = await alertaService.inventarioEnAlerta(leerDias(req));
    res.json({ total: data.length, data });
  } catch (err) { next(err); }
};