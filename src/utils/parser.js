// Formato esperado: "<gasto|ingreso> <monto> <categoria> [descripcion...]"
// Ejemplos válidos:
//   gasto 500 comida
//   gasto 500 comida almuerzo con amigos
//   ingreso 15000 sueldo
const COMMAND_REGEX = /^(gasto|ingreso)\s+(\d+(?:[.,]\d+)?)\s+(\S+)\s*(.*)$/i;

/**
 * Parsea un mensaje de texto y devuelve el movimiento estructurado,
 * o null si el texto no matchea el formato esperado.
 */
function parseMovementMessage(text) {
  const match = text.trim().match(COMMAND_REGEX);
  if (!match) return null;

  const [, tipoRaw, montoRaw, categoria, descripcion] = match;
  const amount = parseFloat(montoRaw.replace(',', '.'));

  if (Number.isNaN(amount) || amount <= 0) return null;

  return {
    type: tipoRaw.toLowerCase() === 'gasto' ? 'expense' : 'income',
    amount,
    categoryName: categoria.toLowerCase(),
    description: descripcion.trim() || null,
  };
}

module.exports = { parseMovementMessage };
