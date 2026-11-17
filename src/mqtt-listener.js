
const path = require('node:path');

require('dotenv').config({
  path: path.join(__dirname, '..', '.env'),
  quiet: true
});

const mqtt = require('mqtt');
const { createClient } = require('@supabase/supabase-js');

const BROKER = process.env.MQTT_URL || 'mqtt://127.0.0.1:1883';
const TOPIC = 'carpark/sitios/estado';

// Por seguridad, comenzamos sin escribir en Supabase.
const ESCRIBIR = process.env.MQTT_WRITE_ENABLED === 'true';

// Inicialmente solo permitimos actualizar este tramo de prueba.
const tramos = require('./data/tramos-el-masnou.json');
const TRAMOS_VALIDOS = new Set(Object.keys(tramos));

console.log('Tramos MQTT disponibles:', TRAMOS_VALIDOS.size);
let supabase = null;

if (ESCRIBIR) {
  const url = process.env.SUPABASE_URL;
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !clave) {
    throw new Error('Faltan credenciales privadas de Supabase');
  }

  supabase = createClient(url, clave, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

const cliente = mqtt.connect(BROKER);

cliente.on('connect', () => {
  console.log('Backend conectado a Mosquitto');

  cliente.subscribe(TOPIC, { qos: 1 }, error => {
    if (error) {
      console.error('Error de suscripción:', error.message);
    } else {
      console.log('Backend escuchando:', TOPIC);
    }
  });
});

cliente.on('message', async (topic, mensaje) => {
  if (topic !== TOPIC) return;

  try {
    const datos = JSON.parse(mensaje.toString());

    if (
  typeof datos.id !== 'string' ||
  !TRAMOS_VALIDOS.has(datos.id) ||
  !['libre', 'ocupado'].includes(datos.estado)
) {
  console.log('Mensaje MQTT no permitido:', datos);
  return;
}

    console.log('Mensaje recibido:', datos);

    if (!ESCRIBIR) {
      console.log('Modo prueba: no se modifica Supabase');
      return;
    }

    const nuevoEstado = datos.estado === 'libre'
      ? 'free'
      : 'occupied';

    const { data, error } = await supabase
      .from('plazas')
      .update({
        estado_actual: nuevoEstado,
        ultima_actualizacion: new Date().toISOString()
      })
      .eq('id', datos.id)
      .select('id, estado_actual');

    if (error) throw error;

    if (data.length !== 1) {
      console.log('No se encontró el tramo para actualizar');
      return;
    }

    console.log('Supabase actualizado:', data[0]);

  } catch (error) {
    console.error('Error:', error.message);
  }
});

cliente.on('error', error => {
  console.error('Error MQTT:', error.message);
});
