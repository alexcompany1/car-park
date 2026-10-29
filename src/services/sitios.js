const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env'), quiet: true });
const { createClient } = require('@supabase/supabase-js');

const estados = {
  free: ['libre', 'está disponible'],
  occupied: ['ocupado', 'no está disponible'],
  unknown: ['desconocido', 'tiene disponibilidad desconocida'],
  reserved: ['reservado', 'está reservada'],
  offline: ['sin_conexion', 'no tiene conexión con el sensor'],
};

let client;
function getClient() {
  if (!client) {
    const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env;
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      throw new Error('Falta la configuración de Supabase');
    }
    client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (url, options) => fetch(url, {
          ...options,
          signal: AbortSignal.timeout(10000),
        }),
      },
    });
  }
  return client;
}

function mapPlaza({ id, estado_actual }) {
  const [estado, texto] = estados[estado_actual] || estados.unknown;
  return { id, estado, mensaje: `La plaza ${id} ${texto}` };
}

async function getSitios() {
  // Lee en bloques para no truncar la lista con el límite de Supabase.
  const sitios = [];
  const size = 1000;
  for (let start = 0; ; start += size) {
    const { data, error } = await getClient().from('plazas')
      .select('id,estado_actual').order('id').range(start, start + size - 1);
    if (error) throw error;
    sitios.push(...data.map(mapPlaza));
    if (data.length < size) return sitios;
  }
}

module.exports = { getSitios, mapPlaza };
