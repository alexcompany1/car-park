// Suscriptor de prueba: muestra los mensajes que llegan al broker.
// No modifica la base de datos; sirve como evidencia de que MQTT funciona.

const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mqtt = require('mqtt');
const { ESTADOS } = require('./configuracion');

const url = process.env.MQTT_URL || 'mqtt://127.0.0.1:1883';
const topic = process.env.MQTT_TOPIC || 'carpark/sitios/estado';
const cliente = mqtt.connect(url, {
  username: process.env.MQTT_USERNAME || undefined,
  password: process.env.MQTT_PASSWORD || undefined,
  reconnectPeriod: 2000,
});

cliente.on('connect', () => {
  console.log('Suscriptor conectado al broker:', url);
  cliente.subscribe(topic, { qos: 1 }, (error) => {
    if (error) console.error('Error de suscripción:', error.message);
    else console.log('Escuchando el topic:', topic);
  });
});

cliente.on('message', (recibidoTopic, contenido) => {
  const mensaje = contenido.toString();
  try {
    const dato = JSON.parse(mensaje);
    if (typeof dato.id !== 'string' || !ESTADOS.includes(dato.estado)) {
      console.warn('Formato incorrecto:', mensaje);
      return;
    }
    console.log(`[RECIBIDO] ${new Date().toISOString()} | ${recibidoTopic} | plaza ${dato.id}: ${dato.estado}`);
  } catch {
    console.warn('No es un mensaje JSON válido:', mensaje);
  }
});

cliente.on('reconnect', () => console.log('Reconectando...'));
cliente.on('error', (error) => console.error('Error MQTT:', error.message));
process.on('SIGINT', () => cliente.end());
