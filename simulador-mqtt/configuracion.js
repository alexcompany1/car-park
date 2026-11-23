// Este módulo define el formato acordado con el backend y valida las opciones.
// No requiere hardware ni conexión con Supabase.

const ESTADOS = ['libre', 'ocupado'];
const TRAMOS = require('../src/data/tramos-el-masnou.json');
const TRAMOS_VALIDOS = new Set(Object.keys(TRAMOS));

function crearMensaje(id, estado) {
if (typeof id !== 'string' || !TRAMOS_VALIDOS.has(id)) {
  throw new Error('El identificador no corresponde a un tramo real de El Masnou.');
}
  if (!ESTADOS.includes(estado)) {
    throw new Error('El estado solo puede ser "libre" u "ocupado".');
  }
  // El backend espera exactamente estos dos campos.
  return JSON.stringify({ id, estado });
}

function leerConfiguracion(argumentos, entorno) {
  const opciones = {};
  for (let i = 0; i < argumentos.length; i++) {
    const clave = argumentos[i];
    if (!['--id', '--estado', '--intervalo'].includes(clave)) {
      throw new Error(`Opción no reconocida: ${clave}`);
    }
    if (!argumentos[i + 1] || argumentos[i + 1].startsWith('--')) {
      throw new Error(`Falta valor para ${clave}`);
    }
    opciones[clave] = argumentos[++i];
  }

  const id = opciones['--id'] || entorno.PLAZA_ID || 'EM-ZB-PUERTO-RICO';
  const estado = opciones['--estado'] || null;
  const intervaloTexto = opciones['--intervalo'] || entorno.INTERVALO_MS || '5000';
  const intervalo = Number(intervaloTexto);
  if (!Number.isInteger(intervalo) || intervalo < 1000 || intervalo > 3600000) {
    throw new Error('El intervalo debe ser un número de milisegundos entre 1000 y 3600000.');
  }
  // Validamos los valores antes de abrir la conexión.
  crearMensaje(id, estado || 'libre');

  return {
    id,
    estado,
    intervalo,
    url: entorno.MQTT_URL || 'mqtt://127.0.0.1:1883',
    topic: entorno.MQTT_TOPIC || 'carpark/sitios/estado',
    username: entorno.MQTT_USERNAME || undefined,
    password: entorno.MQTT_PASSWORD || undefined,
  };
}

module.exports = { ESTADOS, crearMensaje, leerConfiguracion };
