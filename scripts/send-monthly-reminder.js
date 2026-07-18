require('dotenv').config();

const { supabase } = require('../src/db/supabase');
const { sendWhatsAppTemplate } = require('../src/services/whatsappClient');
const { MESES, getYearMonth } = require('../src/utils/meses');

// Debe coincidir exactamente con el nombre e idioma del template aprobado
// en Meta Business Manager > WhatsApp Manager > Plantillas de mensajes.
const TEMPLATE_NAME = 'reporte_mensual_recordatorio';
const TEMPLATE_LANGUAGE = 'es_AR';

async function main() {
  const { month } = getYearMonth(1); // mes que acaba de terminar
  const monthLabel = MESES[month - 1];

  const { data: users, error } = await supabase.from('users').select('phone_number');
  if (error) throw error;

  if (!users.length) {
    console.log('No hay usuarios registrados, no se manda ningún recordatorio.');
    return;
  }

  for (const user of users) {
    await sendWhatsAppTemplate(user.phone_number, TEMPLATE_NAME, TEMPLATE_LANGUAGE, [monthLabel]);
    console.log(`📨 Recordatorio de "${monthLabel}" mandado a ${user.phone_number}`);
  }
}

main().catch((err) => {
  console.error('❌ Error mandando recordatorios mensuales:', err);
  process.exit(1);
});
