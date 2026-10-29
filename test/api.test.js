const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createApp } = require('../src/app');
const { mapPlaza } = require('../src/services/sitios');
const app = createApp(async () => [
  mapPlaza({ id: 'CP-001', estado_actual: 'free' }),
  mapPlaza({ id: 'CP-002', estado_actual: 'occupied' }),
]);

test('API de Carpark y rutas existentes', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise(resolve => server.close(resolve)));
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(base + '/api/sitios');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/json/);
  assert.deepEqual(await response.json(), { sitios: [
    { id: 'CP-001', estado: 'libre', mensaje: 'La plaza CP-001 está disponible' },
    { id: 'CP-002', estado: 'ocupado', mensaje: 'La plaza CP-002 no está disponible' },
  ] });
  const missing = await fetch(base + '/no-existe');
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { error: 'Ruta no encontrada' });
  const health = await fetch(base + '/health');
  assert.deepEqual(await health.json(), { status: 'ok' });
  const home = await fetch(base + '/', { redirect: 'manual' });
  assert.equal(home.status, 302);
  assert.equal(home.headers.get('location'), '/api/sitios');
  for (const route of ['/timeline']) {
    const page = await fetch(base + route);
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-type'), /text\/html/);
    await page.text();
  }
});

test('Los estados desconocidos, reservados y sin conexión no se anuncian libres', () => {
  for (const [value, expected] of [['unknown', 'desconocido'], ['reserved', 'reservado'], ['offline', 'sin_conexion'], ['otro', 'desconocido']]) {
    assert.equal(mapPlaza({ id: 'CP-004', estado_actual: value }).estado, expected);
  }
});

test('Una base de datos vacía devuelve una lista vacía; un fallo devuelve 503 sin detalles internos', async t => {
  for (const [loader, status, body] of [
    [async () => [], 200, { sitios: [] }],
    [async () => { throw new Error('detalle privado'); }, 503, { error: 'No se han podido consultar las plazas. Inténtalo de nuevo más tarde.' }],
  ]) {
    const server = createApp(loader).listen(0, '127.0.0.1');
    t.after(() => new Promise(resolve => server.close(resolve)));
    await once(server, 'listening');
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/sitios`);
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), body);
  }
});
