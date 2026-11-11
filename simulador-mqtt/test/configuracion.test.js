const { test } = require('node:test');
const assert = require('node:assert/strict');
const { crearMensaje, leerConfiguracion } = require('../configuracion');

test('Genera el contrato de estado ocupado que espera CarPark', () => {
  assert.equal(crearMensaje('CP-001', 'ocupado'), '{"id":"CP-001","estado":"ocupado"}');
});
test('Genera el estado libre', () => {
  assert.equal(crearMensaje('CP-001', 'libre'), '{"id":"CP-001","estado":"libre"}');
});
test('Rechaza estados incorrectos e identificadores no válidos', () => {
  assert.throws(() => crearMensaje('CP-001', 'free'));
  assert.throws(() => crearMensaje('plaza 1', 'libre'));
});
test('Utiliza topic, identificador e intervalo de prueba por defecto', () => {
  const c = leerConfiguracion([], {});
  assert.equal(c.topic, 'carpark/sitios/estado');
  assert.equal(c.id, 'CP-001');
  assert.equal(c.intervalo, 5000);
  assert.equal(c.estado, null);
});
test('Permite enviar una sola publicación con un estado elegido', () => {
  const c = leerConfiguracion(['--id','CP-002','--estado','ocupado'], {});
  assert.equal(c.id, 'CP-002');
  assert.equal(c.estado, 'ocupado');
});
test('Rechaza intervalos demasiado rápidos y estados no reconocidos', () => {
  assert.throws(() => leerConfiguracion(['--intervalo','20'], {}));
  assert.throws(() => leerConfiguracion(['--estado','sin_conexion'], {}));
});
