const express = require('express');
const path = require('node:path');
const sitios = require('./data/sitios');
const app = express();
app.disable('x-powered-by');

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/sitios', (req, res) => {
  res.json({
    sitios: sitios.map(({ id, estado }) => ({
      id,
      estado,
      mensaje: `La plaza ${id} ${estado === 'libre' ? 'está disponible' : 'no está disponible'}`,
    })),
  });
});
app.get('/', (req, res) => res.redirect('/api/sitios'));
app.get('/timeline', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'timeline.html'));
});
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
module.exports = app;
