function formatMoney(n) {
  return `$${n.toFixed(2)}`;
}

/**
 * Arma un resumen legible en texto plano para mandar por WhatsApp,
 * a partir de la lista de movimientos del mes (con category ya incluida).
 */
function buildSummaryText(movements, { monthLabel } = {}) {
  if (!movements.length) {
    return `📭 Todavía no registraste movimientos${monthLabel ? ` en ${monthLabel}` : ' este mes'}.`;
  }

  let totalIncome = 0;
  let totalExpense = 0;
  const expenseByCategory = {};

  for (const m of movements) {
    const amount = Number(m.amount);
    const categoryName = m.category?.name || 'sin categoría';

    if (m.type === 'income') {
      totalIncome += amount;
    } else {
      totalExpense += amount;
      expenseByCategory[categoryName] = (expenseByCategory[categoryName] || 0) + amount;
    }
  }

  const balance = totalIncome - totalExpense;
  const balanceEmoji = balance >= 0 ? '✅' : '⚠️';

  const categoryLines = Object.entries(expenseByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount]) => `  • ${name}: ${formatMoney(amount)}`)
    .join('\n');

  return [
    `📊 *Resumen${monthLabel ? ` — ${monthLabel}` : ' del mes'}*`,
    ``,
    `💰 Ingresos: ${formatMoney(totalIncome)}`,
    `💸 Gastos: ${formatMoney(totalExpense)}`,
    `${balanceEmoji} Balance: ${formatMoney(balance)}`,
    ``,
    `Gastos por categoría:`,
    categoryLines || '  (sin gastos registrados)',
    ``,
    `Movimientos registrados: ${movements.length}`,
  ].join('\n');
}

module.exports = { buildSummaryText };
