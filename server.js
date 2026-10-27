const app = require('./src/app');
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Carpark disponible en http://localhost:${port}`));
