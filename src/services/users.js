const { supabase } = require('../db/supabase');

/**
 * Busca un usuario por su número de WhatsApp. Si no existe, lo crea.
 * Así el primer mensaje de cualquier persona ya lo da de alta solo.
 */
async function findOrCreateUser(phoneNumber) {
  const { data: existing, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('phone_number', phoneNumber)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing;

  const { data: created, error: insertError } = await supabase
    .from('users')
    .insert({ phone_number: phoneNumber })
    .select()
    .single();

  if (insertError) throw insertError;

  console.log(`👤 Usuario nuevo creado: ${phoneNumber}`);
  return created;
}

module.exports = { findOrCreateUser };
