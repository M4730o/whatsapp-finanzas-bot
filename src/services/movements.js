const { supabase } = require('../db/supabase');

async function createMovement({ userId, categoryId, type, amount, description }) {
  const { data, error } = await supabase
    .from('movements')
    .insert({
      user_id: userId,
      category_id: categoryId,
      type,
      amount,
      description,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Trae todos los movimientos de un usuario dentro de un mes calendario,
 * incluyendo el nombre de la categoría (join) para poder armar el resumen.
 */
async function getMonthMovements(userId, year, month) {
  // month es 1-12 (humano), lo convertimos al rango de fechas del mes
  const start = new Date(Date.UTC(year, month - 1, 1)).toISOString();
  const end = new Date(Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1)).toISOString();

  const { data, error } = await supabase
    .from('movements')
    .select('type, amount, description, created_at, category:categories(name)')
    .eq('user_id', userId)
    .gte('created_at', start)
    .lt('created_at', end)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Trae el último movimiento cargado por un usuario (para el comando "borrar").
 */
async function getLastMovement(userId) {
  const { data, error } = await supabase
    .from('movements')
    .select('id, type, amount, description, created_at, category:categories(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function deleteMovement(id) {
  const { error } = await supabase.from('movements').delete().eq('id', id);
  if (error) throw error;
}

module.exports = { createMovement, getMonthMovements, getLastMovement, deleteMovement };
