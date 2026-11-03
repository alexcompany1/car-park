# Carpark

Web y API de estacionamiento de El Masnou.

## Arranque

Configura .env a partir de .env.example con la URL y la clave publicable
existentes de Supabase. No sobrescribas un .env ya configurado.

```bash
npm ci
npm start
```

Abre http://localhost:3000. La web activa está en CarPark-FUNCIONA/index.html.
El mapa de Leaflet/OpenStreetMap necesita Internet y consulta tu API.
GET /api/sitios devuelve los registros de Supabase.
Actualizar vuelve a consultar; los favoritos se guardan en el navegador.

Hay 13 tramos reales de zona blava del mapa de Google My Maps enlazado por
SUMEM. No son plazas individuales: su ocupación es desconocida.
Se retiraron los datos de prueba tras guardar una copia local en backups/.

```bash
npm test
```

Fuentes, importación y copia de seguridad: docs/el-masnou-ubicaciones-reales.md.
