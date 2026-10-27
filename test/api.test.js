const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const app = require('../src/app');

test('API de Carpark y rutas existentes', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise(resolve => server.close(resolve)));
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(base + '/api/sitios');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/json/);
  assert.deepEqual(await response.json(), { sitios: [
    { id: 1, estado: 'libre', mensaje: 'La plaza 1 está disponible' },
    { id: 2, estado: 'ocupado', mensaje: 'La plaza 2 no está disponible' },
  ] });
  const missing = await fetch(base + '/no-existe');
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { error: 'Ruta no encontrada' });
  const health = await fetch(base + '/health');
  assert.deepEqual(await health.json(), { status: 'ok' });
  for (const route of ['/', '/timeline']) {
    const page = await fetch(base + route);
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-type'), /text\/html/);
    await page.text();
  }
});
