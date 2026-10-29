const express = require('express');
const path = require('node:path');
const { getSitios } = require('./services/sitios');
function createApp(loadSitios = getSitios) {
  const app = express();
  app.disable('x-powered-by');

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/api/sitios', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      res.json({ sitios: await loadSitios() });
    } catch {
      res.status(503).json({ error: 'No se han podido consultar las plazas. Inténtalo de nuevo más tarde.' });
    }
  });
  app.get('/', (req, res) => res.redirect('/api/sitios'));
  app.get('/timeline', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'timeline.html'));
  });
  app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
  return app;
}
module.exports = createApp();
module.exports.createApp = createApp;
