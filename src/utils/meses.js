const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/**
 * Año y mes (1-12) de hoy, o de `monthsAgo` meses atrás.
 */
function getYearMonth(monthsAgo = 0) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

module.exports = { MESES, getYearMonth };
