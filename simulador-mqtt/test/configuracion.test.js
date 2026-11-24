const { test } = require('node:test');
const assert = require('node:assert/strict');
const { crearMensaje, leerConfiguracion } = require('../configuracion');

test('Genera el contrato de estado ocupado que espera CarPark', () => {
  assert.equal(crearMensaje('EM-ZB-PUERTO-RICO', 'ocupado'), '{"id":"EM-ZB-PUERTO-RICO","estado":"ocupado"}');
});
test('Genera el estado libre', () => {
  assert.equal(crearMensaje('EM-ZB-PUERTO-RICO', 'libre'), '{"id":"EM-ZB-PUERTO-RICO","estado":"libre"}');
});
test('Rechaza estados incorrectos e identificadores no válidos', () => {
  assert.throws(() => crearMensaje('EM-ZB-PUERTO-RICO', 'free'));
  assert.throws(() => crearMensaje('plaza 1', 'libre'));
});
test('Utiliza topic, identificador e intervalo de prueba por defecto', () => {
  const c = leerConfiguracion([], {});
  assert.equal(c.topic, 'carpark/sitios/estado');
  assert.equal(c.id, 'EM-ZB-PUERTO-RICO');
  assert.equal(c.intervalo, 5000);
  assert.equal(c.estado, null);
});
test('Permite enviar una sola publicación con un estado elegido', () => {
  const c = leerConfiguracion(['--id','EM-ZB-NAVARRA','--estado','ocupado'], {});
  assert.equal(c.id, 'EM-ZB-NAVARRA');
  assert.equal(c.estado, 'ocupado');
});
test('Rechaza intervalos demasiado rápidos y estados no reconocidos', () => {
  assert.throws(() => leerConfiguracion(['--intervalo','20'], {}));
  assert.throws(() => leerConfiguracion(['--estado','sin_conexion'], {}));
});


test('Acepta los 13 tramos reales de El Masnou', () => {
  const tramos = require('../../src/data/tramos-el-masnou.json');
  const ids = Object.keys(tramos);

  assert.equal(ids.length, 13);

  for (const id of ids) {
    const mensaje = crearMensaje(id, 'libre');

    assert.deepEqual(JSON.parse(mensaje), {
      id,
      estado: 'libre'
    });
  }

  assert.throws(() => {
    crearMensaje('TRAMO-INVENTADO', 'libre');
  });
});
