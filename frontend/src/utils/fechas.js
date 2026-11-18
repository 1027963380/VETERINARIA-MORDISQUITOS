// Las fechas sin hora ("2026-11-14") se leen como locales, para que no se corran un día
export const aFecha = (v) => new Date(String(v).length === 10 ? `${v}T00:00:00` : v);

export const fechaCorta = (v) =>
  v ? aFecha(v).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const fechaHora = (v) =>
  v ? aFecha(v).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—';

export const hoyISO = () => new Date().toLocaleDateString('en-CA');

export const sumarDias = (iso, n) => {
  const d = aFecha(iso);
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('en-CA');
};

export const sumarMeses = (iso, n) => {
  const d = aFecha(iso);
  d.setMonth(d.getMonth() + n);
  return d.toLocaleDateString('en-CA');
};