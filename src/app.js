const express = require('express');
const path = require('node:path');
const { getSitios } = require('./services/sitios');
function createApp(loadSitios = getSitios) {
  const app = express();
  app.disable('x-powered-by');

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/api/sitios', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const { zona } = req.query;
    if (zona !== undefined && (typeof zona !== 'string' || !zona.trim() || zona.length > 100)) {
      return res.status(400).json({ error: 'La zona debe ser un texto de entre 1 y 100 caracteres.' });
    }
    try {
      res.json({ sitios: await loadSitios({ zona }) });
    } catch {
      res.status(503).json({ error: 'No se han podido consultar las plazas. Inténtalo de nuevo más tarde.' });
    }
  });
  app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'CarPark-FUNCIONA', 'index.html')));
  app.use('/CarPark-FUNCIONA', express.static(path.join(__dirname, '..', 'CarPark-FUNCIONA')));
  app.use('/css', express.static(path.join(__dirname, '..', 'css')));
  app.use('/js', express.static(path.join(__dirname, '..', 'js')));
  app.get('/timeline', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'timeline.html'));
  });
  app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
  return app;
}
module.exports = createApp();
module.exports.createApp = createApp;
