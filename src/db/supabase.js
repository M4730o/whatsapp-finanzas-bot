const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '⚠️  Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el .env — la conexión a la base de datos va a fallar.'
  );
}

// Usamos la service_role key porque el backend corre en un entorno
// confiable (servidor), no en el navegador. Nunca expongas esta key en el cliente.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = { supabase };
