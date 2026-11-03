# Carpark

## Ejecutar frontend y backend juntos

```bash
npm ci
npm start
```

Configura antes `.env` a partir de `.env.example` con la URL y la clave
publicable del proyecto Supabase. Si ya existe, conserva la configuración.
Abre http://localhost:3000: se muestra `CarPark-FUNCIONA/index.html`.
GET /api/sitios devuelve las plazas de Supabase con ubicación y zona.
Actualizar consulta de nuevo los datos. Favoritos se guardan en el navegador.
El mapa de calles de El Masnou utiliza Leaflet y OpenStreetMap.
Los cuatro puntos de referencia tienen estados simulados.
El enlace Cómo llegar utiliza las coordenadas almacenadas. La ocupación no está verificada mediante sensores.

`npm test` ejecuta las pruebas del backend.
Consulta `docs/alex-sprint2-backend.md` para el contrato de la API.
La versión anterior en index.html, css y js se conserva como referencia.

Escenario de prueba y fuentes: docs/el-masnou-demo.md.
