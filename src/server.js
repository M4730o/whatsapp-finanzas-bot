require('dotenv').config();
const express = require('express');
const webhookRouter = require('./routes/webhook');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Bot de finanzas por WhatsApp — corriendo ✅');
});

app.use('/webhook', webhookRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
  console.log(`   Webhook disponible en http://localhost:${PORT}/webhook`);
});
