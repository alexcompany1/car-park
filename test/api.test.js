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
    { id: 'CP-001', estado: 'libre', mensaje: 'La plaza CP-001 está disponible', direccion: null, latitud: null, longitud: null, zona: null, ultima_actualizacion: null },
    { id: 'CP-002', estado: 'ocupado', mensaje: 'La plaza CP-002 no está disponible', direccion: null, latitud: null, longitud: null, zona: null, ultima_actualizacion: null },
  ] });
  const missing = await fetch(base + '/no-existe');
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { error: 'Ruta no encontrada' });
  const health = await fetch(base + '/health');
  assert.deepEqual(await health.json(), { status: 'ok' });
  const home = await fetch(base + '/', { redirect: 'manual' });
  assert.equal(home.status, 200);
  assert.match(await home.text(), /id="mapStage"/);
  for (const file of ['/js/app.js', '/css/styles.css']) {
    const asset = await fetch(base + file);
    assert.equal(asset.status, 200);
    await asset.text();
  }
  for (const route of ['/timeline', '/api/timeline']) {
    const response = await fetch(base + route);
    assert.equal(response.status, 404);
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

 test('La API conserva ubicación y zona y convierte coordenadas numéricas', () => {
  const result = mapPlaza({ id: 'CP-001', estado_actual: 'free', direcciones: { nombre: 'Calle 1' }, latitud: '41.3', longitud: '2.1', zonas: { nombre: 'Centro' }, ultima_actualizacion: '2026-11-03T10:00:00Z' });
  assert.equal(result.latitud, 41.3);
  assert.equal(result.longitud, 2.1);
  assert.equal(result.zona, 'Centro');
  assert.equal(result.direccion, 'Calle 1');
  assert.equal(result.ultima_actualizacion, '2026-11-03T10:00:00Z');
});


test('El filtro de zona llega a la consulta y rechaza parámetros con formato incorrecto', async t => {
  let received;
  const server=createApp(async options => { received=options; return []; }).listen(0,'127.0.0.1');
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}`;
  const valid=await fetch(base+'/api/sitios?zona='+encodeURIComponent('El Masnou (demo)'));
  assert.equal(valid.status,200);
  await valid.json();
  assert.deepEqual(received,{zona:'El Masnou (demo)'});
  for(const query of ['zona=','zona=a&zona=b']) {
    const invalid=await fetch(base+'/api/sitios?'+query);
    assert.equal(invalid.status,400);
    await invalid.json();
  }
});


test('Los tramos reales tienen nombre, geometría verificable y ocupación desconocida', () => {
  const catalog = require('../src/data/tramos-el-masnou.json');
  assert.equal(Object.keys(catalog).length,13);
  for (const [id,source] of Object.entries(catalog)) {
    assert.ok(id.length<=20);
    const result=mapPlaza({id,estado_actual:'unknown',direcciones:{nombre:'Zona blava carrer Navarra'},latitud:41.4813652,longitud:2.3174688,zonas:{nombre:'El Masnou - zona blava'}});
    assert.equal(result.nombre,'Zona blava carrer Navarra');
    assert.equal(result.tipo_ubicacion,'tramo');
    assert.equal(result.estado,'desconocido');
    assert.match(result.mensaje,/sin datos de ocupación/);
    assert.match(result.fuente_url,/google.com/);
    assert.equal(source.geometria.type,'LineString');
    for(const [lng,lat] of source.geometria.coordinates) {
      assert.ok(lat>41.47 && lat<41.50);
      assert.ok(lng>2.30 && lng<2.34);
    }
  }
});
