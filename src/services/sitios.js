const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env'), quiet: true });
const { createClient } = require('@supabase/supabase-js');

const tramos = require('../data/tramos-el-masnou.json');

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

function mapPlaza({ id, estado_actual, direccion, latitud, longitud, ultima_actualizacion, zonas }) {
  const [estado, texto] = estados[estado_actual] || estados.unknown;
  return {
    id, estado,
    mensaje: tramos[id] ? `${direccion}: ${estado === 'desconocido' ? 'sin datos de ocupación' : texto}` : `La plaza ${id} ${texto}`,
    ...(tramos[id] ? { nombre: direccion, ...tramos[id] } : {}),
    direccion: direccion ?? null,
    latitud: latitud == null ? null : Number(latitud),
    longitud: longitud == null ? null : Number(longitud),
    zona: zonas?.nombre ?? null,
    ultima_actualizacion: ultima_actualizacion ?? null,
  };
}

async function getSitios({ zona } = {}) {
  // Lee en bloques para no truncar la lista con el límite de Supabase.
  const sitios = [];
  const size = 1000;
  for (let start = 0; ; start += size) {
    let query = getClient().from('plazas')
      .select('id,estado_actual,direccion,latitud,longitud,ultima_actualizacion,zonas!inner(nombre)').order('id').range(start, start + size - 1);
    if (zona) query = query.eq('zonas.nombre', zona);
    const { data, error } = await query;
    if (error) throw error;
    sitios.push(...data.map(mapPlaza));
    if (data.length < size) return sitios;
  }
}

module.exports = { getSitios, mapPlaza };
