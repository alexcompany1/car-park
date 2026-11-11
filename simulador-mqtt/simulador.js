// Simulador MQTT de Marc para CarPark.
// Uso 1: npm start                          (cambia de libre a ocupado cada 5 s)
// Uso 2: npm start -- --estado ocupado      (envía una vez y termina)
// Uso 3: npm start -- --id CP-002 --intervalo 3000

const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mqtt = require('mqtt');
const { crearMensaje, leerConfiguracion } = require('./configuracion');

let config;
try {
  config = leerConfiguracion(process.argv.slice(2), process.env);
} catch (error) {
  console.error('Error de configuración:', error.message);
  process.exit(1);
}

const cliente = mqtt.connect(config.url, {
  username: config.username,
  password: config.password,
  reconnectPeriod: 2000, // Reintenta cada 2 segundos si falla el broker.
  connectTimeout: 10000,
});

let temporizador;
let siguiente = 'libre';
let cerrando = false;
let envioUnicoEnCurso = false;

function publicar() {
  if (cerrando || !cliente.connected || envioUnicoEnCurso) return;
  const estado = config.estado || siguiente;
  const mensaje = crearMensaje(config.id, estado);
  if (config.estado) envioUnicoEnCurso = true;

  // QoS 1 solicita confirmación del broker. retain:false evita publicar
  // un estado antiguo como si fuese la última disponibilidad fiable.
  cliente.publish(config.topic, mensaje, { qos: 1, retain: false }, (error) => {
    if (error) {
      console.error('No se pudo publicar:', error.message);
      if (config.estado) envioUnicoEnCurso = false;
      return;
    }
    console.log(`[PUBLICADO] Topic: ${config.topic} | ${mensaje}`);
    if (config.estado) {
      cerrando = true;
      cliente.end();
    } else {
      siguiente = estado === 'libre' ? 'ocupado' : 'libre';
    }
  });
}

cliente.on('connect', () => {
  console.log('Conectado al broker MQTT:', config.url);
  if (config.estado) {
    publicar();
  } else {
    if (temporizador) clearInterval(temporizador);
    publicar();
    temporizador = setInterval(publicar, config.intervalo);
  }
});

cliente.on('close', () => {
  if (temporizador) clearInterval(temporizador);
  temporizador = undefined;
});

cliente.on('reconnect', () => console.log('Reconectando con el broker...'));
cliente.on('error', (error) => console.error('Error MQTT:', error.message));

process.on('SIGINT', () => {
  console.log('\nSimulador detenido.');
  cerrando = true;
  if (temporizador) clearInterval(temporizador);
  cliente.end();
});
