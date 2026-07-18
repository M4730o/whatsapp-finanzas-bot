const express = require('express');
const router = express.Router();

const { parseMovementMessage } = require('../utils/parser');
const { buildSummaryText } = require('../utils/summary');
const { findOrCreateUser } = require('../services/users');
const { findCategory, listCategoryNames } = require('../services/categories');
const { createMovement, getMonthMovements, getLastMovement, deleteMovement } = require('../services/movements');
const { sendWhatsAppMessage, sendWhatsAppDocument } = require('../services/whatsappClient');
const { buildMovementsExcel } = require('../utils/excel');
const { MESES, getYearMonth } = require('../utils/meses');

const HELP_TEXT = [
  'Comandos disponibles:',
  '• gasto <monto> <categoría> [descripción]',
  '• ingreso <monto> <categoría> [descripción]',
  '• resumen — totales del mes actual',
  '• excel — reporte del mes actual en Excel',
  '• excel anterior — reporte del mes pasado en Excel',
  '• borrar — elimina el último movimiento cargado',
  '',
  'Ejemplo: gasto 500 comida almuerzo',
].join('\n');

/**
 * GET /webhook
 * Verificación inicial que le pide Meta al configurar el webhook.
 */
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const tokenValido = token === process.env.WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && tokenValido) {
    console.log('✅ Webhook verificado correctamente por Meta');
    return res.status(200).send(challenge);
  }

  console.warn('❌ Falló la verificación del webhook (token o modo incorrecto)');
  return res.sendStatus(403);
});

/**
 * POST /webhook
 * Acá llegan los mensajes reales. Respondemos 200 de inmediato (Meta
 * reintenta si no recibe respuesta rápido) y procesamos en background.
 */
router.post('/', (req, res) => {
  res.sendStatus(200);

  handleIncomingEvent(req.body).catch((err) => {
    console.error('❌ Error procesando el mensaje entrante:', err);
  });
});

async function handleIncomingEvent(body) {
  const entry = body?.entry?.[0]?.changes?.[0]?.value;
  const mensaje = entry?.messages?.[0];

  if (!mensaje) {
    console.log('ℹ️  Evento recibido sin mensaje de texto (probablemente status update)');
    return;
  }

  const from = mensaje.from;
  const texto = mensaje.text?.body?.trim();

  if (!texto) {
    await sendWhatsAppMessage(from, 'Por ahora solo entiendo mensajes de texto 🙂');
    return;
  }

  console.log(`📩 Mensaje recibido de ${from}: "${texto}"`);

  const comando = texto.split(/\s+/)[0].toLowerCase();

  if (comando === 'resumen') {
    return handleResumen(from);
  }

  if (comando === 'excel') {
    return handleExcel(from, texto);
  }

  if (comando === 'ayuda') {
    return sendWhatsAppMessage(from, HELP_TEXT);
  }

  if (comando === 'borrar') {
    return handleBorrar(from);
  }

  if (comando === 'gasto' || comando === 'ingreso') {
    return handleMovimiento(from, texto);
  }

  return sendWhatsAppMessage(from, `No entendí ese mensaje 🤔\n\n${HELP_TEXT}`);
}

async function handleMovimiento(from, texto) {
  const parsed = parseMovementMessage(texto);

  if (!parsed) {
    await sendWhatsAppMessage(from, `No pude leer ese movimiento 🤔\n\n${HELP_TEXT}`);
    return;
  }

  const user = await findOrCreateUser(from);
  const category = await findCategory(parsed.categoryName, parsed.type);

  if (!category) {
    const opciones = await listCategoryNames(parsed.type);
    await sendWhatsAppMessage(
      from,
      `No conozco la categoría "${parsed.categoryName}" 🤔\nProbá con: ${opciones.join(', ')}`
    );
    return;
  }

  await createMovement({
    userId: user.id,
    categoryId: category.id,
    type: parsed.type,
    amount: parsed.amount,
    description: parsed.description,
  });

  const emoji = parsed.type === 'expense' ? '💸' : '💰';
  const tipoLabel = parsed.type === 'expense' ? 'Gasto' : 'Ingreso';
  const detalle = parsed.description ? ` (${parsed.description})` : '';

  await sendWhatsAppMessage(
    from,
    `${emoji} ${tipoLabel} registrado: $${parsed.amount.toFixed(2)} - ${parsed.categoryName}${detalle}`
  );
}

async function handleBorrar(from) {
  const user = await findOrCreateUser(from);
  const last = await getLastMovement(user.id);

  if (!last) {
    await sendWhatsAppMessage(from, 'No tenés movimientos cargados para borrar.');
    return;
  }

  await deleteMovement(last.id);

  const emoji = last.type === 'expense' ? '💸' : '💰';
  const tipoLabel = last.type === 'expense' ? 'gasto' : 'ingreso';
  const categoryName = last.category?.name || 'sin categoría';
  const detalle = last.description ? ` (${last.description})` : '';

  await sendWhatsAppMessage(
    from,
    `🗑️ Borrado el último movimiento: ${emoji} ${tipoLabel} de $${Number(last.amount).toFixed(2)} - ${categoryName}${detalle}`
  );
}

async function handleResumen(from) {
  const user = await findOrCreateUser(from);
  const { year, month } = getYearMonth();

  const movements = await getMonthMovements(user.id, year, month);
  const text = buildSummaryText(movements, { monthLabel: MESES[month - 1] });

  await sendWhatsAppMessage(from, text);
}

async function handleExcel(from, texto) {
  const arg = texto.split(/\s+/)[1]?.toLowerCase();
  const monthsAgo = arg === 'anterior' ? 1 : 0;

  const user = await findOrCreateUser(from);
  const { year, month } = getYearMonth(monthsAgo);

  const movements = await getMonthMovements(user.id, year, month);

  if (!movements.length) {
    await sendWhatsAppMessage(from, `📭 Todavía no registraste movimientos en ${MESES[month - 1]}, no hay nada que exportar.`);
    return;
  }

  const monthLabel = MESES[month - 1];
  const buffer = await buildMovementsExcel(movements, { monthLabel });
  const filename = `reporte-${monthLabel}-${year}.xlsx`;

  await sendWhatsAppDocument(
    from,
    buffer,
    filename,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
}

module.exports = router;
