const ExcelJS = require('exceljs');

/**
 * Arma un workbook con el detalle de movimientos del mes y un resumen
 * por categoría, listo para mandar como documento por WhatsApp.
 */
async function buildMovementsExcel(movements, { monthLabel } = {}) {
  const workbook = new ExcelJS.Workbook();

  const detalle = workbook.addWorksheet('Movimientos');
  detalle.columns = [
    { header: 'Fecha', key: 'fecha', width: 18 },
    { header: 'Tipo', key: 'tipo', width: 12 },
    { header: 'Categoría', key: 'categoria', width: 18 },
    { header: 'Monto', key: 'monto', width: 14 },
    { header: 'Descripción', key: 'descripcion', width: 30 },
  ];
  detalle.getRow(1).font = { bold: true };

  let totalIncome = 0;
  let totalExpense = 0;
  const expenseByCategory = {};

  for (const m of movements) {
    const amount = Number(m.amount);
    const categoryName = m.category?.name || 'sin categoría';
    const tipoLabel = m.type === 'expense' ? 'Gasto' : 'Ingreso';

    detalle.addRow({
      fecha: new Date(m.created_at).toLocaleString('es-AR'),
      tipo: tipoLabel,
      categoria: categoryName,
      monto: amount,
      descripcion: m.description || '',
    });

    if (m.type === 'income') {
      totalIncome += amount;
    } else {
      totalExpense += amount;
      expenseByCategory[categoryName] = (expenseByCategory[categoryName] || 0) + amount;
    }
  }

  detalle.getColumn('monto').numFmt = '#,##0.00';

  const resumen = workbook.addWorksheet('Resumen');
  resumen.columns = [
    { header: monthLabel ? `Resumen — ${monthLabel}` : 'Resumen', key: 'label', width: 28 },
    { header: '', key: 'valor', width: 16 },
  ];
  resumen.getRow(1).font = { bold: true };

  resumen.addRow({ label: 'Ingresos', valor: totalIncome });
  resumen.addRow({ label: 'Gastos', valor: totalExpense });
  resumen.addRow({ label: 'Balance', valor: totalIncome - totalExpense });
  resumen.addRow({});
  resumen.addRow({ label: 'Gastos por categoría' }).font = { bold: true };

  for (const [name, amount] of Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1])) {
    resumen.addRow({ label: name, valor: amount });
  }

  resumen.getColumn('valor').numFmt = '#,##0.00';

  return workbook.xlsx.writeBuffer();
}

module.exports = { buildMovementsExcel };
