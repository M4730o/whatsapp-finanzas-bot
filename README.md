# Bot de finanzas por WhatsApp

Registrá gastos e ingresos por WhatsApp y generá reportes mensuales en Excel.

## Estado actual

- [x] Esqueleto del servidor Express
- [x] Webhook de WhatsApp (verificación + recepción de mensajes)
- [x] Conexión a Supabase configurada
- [x] Schema de base de datos
- [x] Parsing de mensajes y guardado en base de datos
- [x] Respuestas por WhatsApp (confirmación de movimiento, resumen en texto)
- [x] Comando para borrar el último movimiento
- [x] Generación de reporte Excel (comando `excel`, mes actual)
- [x] Recordatorio mensual automático (GitHub Actions + template de WhatsApp)
- [ ] Gráficos y estadísticas (categorías top, días de mayor gasto, etc.)

## Comandos disponibles por WhatsApp

```
gasto <monto> <categoría> [descripción]
ingreso <monto> <categoría> [descripción]
resumen
excel
excel anterior
borrar
ayuda
```

Ejemplos:
```
gasto 500 comida almuerzo con amigos
ingreso 15000 sueldo
resumen
excel
excel anterior
borrar
```

`borrar` elimina el último movimiento cargado (para corregir errores de tipeo: se borra y se vuelve a cargar bien).

`excel` genera y manda un archivo `.xlsx` del mes actual, con una hoja de detalle de movimientos y otra de resumen (totales por categoría, ingresos/gastos/balance). `excel anterior` hace lo mismo pero con el mes pasado — es lo que conviene pedir cuando llega el recordatorio automático de principio de mes.

Categorías disponibles por defecto (ver `sql/schema.sql`): comida, transporte, servicios, entretenimiento, salud, otros (gastos) / sueldo, freelance, otros (ingresos).

> Requiere Node 18 o superior (se usa `fetch` nativo para hablar con la API de WhatsApp).

## Setup paso a paso

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear el proyecto en Supabase

1. Andá a [supabase.com](https://supabase.com) y creá un proyecto gratis
2. En **SQL Editor**, pegá y ejecutá el contenido de `sql/schema.sql`
3. En **Project Settings > API**, copiá:
   - `Project URL` → va en `SUPABASE_URL`
   - `service_role` key (no la `anon`) → va en `SUPABASE_SERVICE_ROLE_KEY`

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Completá `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. Las de WhatsApp las completamos en el paso 5.

### 4. Levantar el servidor local

```bash
npm run dev
```

Deberías ver `🚀 Servidor escuchando en http://localhost:3000`.

### 5. Exponer el servidor con ngrok

```bash
ngrok http 3000
```

Copiá la URL `https://xxxx.ngrok-free.app` que te da — la vas a necesitar en el siguiente paso.

### 6. Crear la app en Meta for Developers

1. Andá a [developers.facebook.com](https://developers.facebook.com), creá una app con el caso de uso **WhatsApp**
2. Esto te da un número de prueba y un WABA ID automáticamente
3. En **WhatsApp > API Setup**, copiá el token temporal y el `Phone Number ID` → completá `WHATSAPP_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID` en tu `.env`

### 7. Configurar el webhook en Meta

1. En **WhatsApp > Configuration**, hacé clic en "Edit" en Webhook
2. Callback URL: `https://xxxx.ngrok-free.app/webhook` (tu URL de ngrok + `/webhook`)
3. Verify token: el mismo valor que pusiste en `WEBHOOK_VERIFY_TOKEN` en tu `.env`
4. Guardá y confirmá que Meta lo marca como verificado
5. Suscribite al campo `messages`

### 8. Probar el flujo completo

Desde tu celular, mandá un mensaje al número de prueba. Deberías ver en tu terminal:

```
📩 Mensaje recibido de 549XXXXXXXXX: "hola"
```

Si ves eso, el flujo end-to-end funciona 🎉 — el siguiente paso es agregar el parsing de gastos/ingresos.

## Recordatorio mensual automático

Como WhatsApp no permite mandar mensajes "libres" iniciados por el negocio
fuera de la ventana de 24hs desde el último mensaje del usuario, el cron no
manda el Excel directo: manda un mensaje de **template pre-aprobado** avisando
que el reporte está listo, y vos le respondés `excel anterior` para recibirlo
(eso reabre la ventana de 24hs y el bot ya sabe responder ese comando).

### 1. Crear el template en Meta

En **Meta Business Manager > WhatsApp Manager > Plantillas de mensajes**,
creá una plantilla nueva con:

- **Nombre**: `reporte_mensual_recordatorio`
- **Categoría**: Utilidad (Utility)
- **Idioma**: Español (ARG) — `es_AR`
- **Cuerpo**:
  ```
  Tu reporte de finanzas de {{1}} ya está disponible. Respondé *excel anterior* para recibirlo.
  ```
  Como texto de ejemplo para `{{1}}`, poné algo como `junio`.

Mandá la plantilla a revisión — Meta suele aprobar plantillas de utilidad en
minutos u horas. Si cambiás el nombre o el idioma, actualizá
`TEMPLATE_NAME`/`TEMPLATE_LANGUAGE` en `scripts/send-monthly-reminder.js`.

### 2. Probar el script en local

```bash
npm run send-monthly-reminder
```

Te debería llegar el mensaje de plantilla por WhatsApp. Si el template todavía
no está aprobado, Meta devuelve un error 400 explicando por qué.

### 3. Subir el proyecto a GitHub

```bash
git init
git add .
git commit -m "Bot de finanzas por WhatsApp"
git remote add origin <URL de tu repo en GitHub>
git push -u origin main
```

### 4. Cargar los secrets en GitHub

En el repo, andá a **Settings > Secrets and variables > Actions** y creá:

- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

El workflow `.github/workflows/monthly-reminder.yml` corre automáticamente el
día 1 de cada mes a las 13:00 UTC (10:00 Argentina). También lo podés disparar
a mano desde la pestaña **Actions > Recordatorio mensual > Run workflow**.

## Estructura del proyecto

```
whatsapp-finanzas-bot/
├── src/
│   ├── server.js              # punto de entrada
│   ├── routes/
│   │   └── webhook.js         # verificación, recepción y ruteo de comandos
│   ├── services/
│   │   ├── users.js           # buscar/crear usuario por número
│   │   ├── categories.js      # buscar categorías
│   │   ├── movements.js       # crear movimientos, traer resumen mensual
│   │   └── whatsappClient.js  # enviar mensajes por WhatsApp
│   ├── utils/
│   │   ├── parser.js          # parsea "gasto 500 comida ..."
│   │   ├── summary.js         # arma el texto del resumen
│   │   ├── excel.js           # arma el archivo .xlsx del reporte mensual
│   │   └── meses.js           # nombres de meses y cálculo de año/mes
│   └── db/
│       └── supabase.js        # cliente de base de datos
├── scripts/
│   └── send-monthly-reminder.js  # dispara el template de recordatorio (cron)
├── .github/workflows/
│   └── monthly-reminder.yml   # GitHub Actions: corre el script el día 1 de cada mes
├── sql/
│   └── schema.sql             # tablas: users, categories, movements
├── .env.example
└── package.json
```
