/**
 * Envía un mensaje de texto por WhatsApp usando la Cloud API de Meta.
 * Requiere WHATSAPP_TOKEN y WHATSAPP_PHONE_NUMBER_ID en el .env.
 *
 * Usa fetch nativo — requiere Node 18 o superior.
 */
async function sendWhatsAppMessage(to, body) {
  const url = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body },
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`❌ Error enviando WhatsApp (${res.status}):`, errorBody);
    }

    return res;
  } catch (err) {
    console.error('❌ Excepción enviando WhatsApp:', err.message);
  }
}

/**
 * Sube un archivo binario a la API de Meta (paso previo obligatorio para
 * poder mandarlo como documento) y devuelve el media id generado.
 */
async function uploadMedia(buffer, filename, mimeType) {
  const url = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/media`;

  const form = new FormData();
  form.append('messaging_product', 'whatsapp');
  form.append('file', new Blob([buffer], { type: mimeType }), filename);

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
    body: form,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Error subiendo media a WhatsApp (${res.status}): ${errorBody}`);
  }

  const { id } = await res.json();
  return id;
}

/**
 * Sube un archivo y lo manda como documento por WhatsApp en un solo paso.
 */
async function sendWhatsAppDocument(to, buffer, filename, mimeType) {
  try {
    const mediaId = await uploadMedia(buffer, filename, mimeType);

    const url = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'document',
        document: { id: mediaId, filename },
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`❌ Error enviando documento por WhatsApp (${res.status}):`, errorBody);
    }

    return res;
  } catch (err) {
    console.error('❌ Excepción enviando documento por WhatsApp:', err.message);
  }
}

/**
 * Manda un mensaje de plantilla (template) previamente aprobado por Meta.
 * Es el único tipo de mensaje que se puede mandar sin que el usuario haya
 * escrito antes (fuera de la ventana de 24hs), por eso lo usa el recordatorio
 * mensual automático.
 */
async function sendWhatsAppTemplate(to, templateName, languageCode, bodyParams = []) {
  const url = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components: bodyParams.length
            ? [{ type: 'body', parameters: bodyParams.map((text) => ({ type: 'text', text })) }]
            : [],
        },
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`❌ Error enviando template por WhatsApp (${res.status}):`, errorBody);
    }

    return res;
  } catch (err) {
    console.error('❌ Excepción enviando template por WhatsApp:', err.message);
  }
}

module.exports = { sendWhatsAppMessage, sendWhatsAppDocument, sendWhatsAppTemplate };
