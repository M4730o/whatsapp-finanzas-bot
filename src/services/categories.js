const { supabase } = require('../db/supabase');

/**
 * Busca una categoría por nombre y tipo (expense/income).
 * Devuelve null si no existe — el llamador decide qué hacer con eso.
 */
async function findCategory(name, type) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('name', name)
    .eq('type', type)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Lista los nombres de categorías disponibles para un tipo dado,
 * útil para sugerirle opciones al usuario cuando escribe una que no existe.
 */
async function listCategoryNames(type) {
  const { data, error } = await supabase
    .from('categories')
    .select('name')
    .eq('type', type)
    .order('name');

  if (error) throw error;
  return data.map((c) => c.name);
}

module.exports = { findCategory, listCategoryNames };
