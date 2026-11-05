# CarPark

CarPark muestra los tramos de aparcamiento de la zona azul de El Masnou. El mapa consulta la API de Express, que lee los datos de Supabase. Los 13 tramos representan ubicaciones publicadas por SUMEM. Su ocupación aún es desconocida.

[Ver la web publicada en Vercel](https://car-park-snowy.vercel.app/#mapa)

## Arranque en local

Con Node.js 20 o posterior, instala las dependencias:

```bash
npm ci
```

Si todavía no tienes un archivo `.env`, créalo a partir de [`.env.example`](.env.example) y rellena `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`. Después, arranca el servidor:

```bash
npm start
```

Abre [CarPark en local](http://localhost:3000/). El mapa usa Leaflet y OpenStreetMap y necesita conexión a Internet.

## Dónde está cada cosa

| Archivo o carpeta | Contenido |
| --- | --- |
| [CarPark-FUNCIONA/index.html](CarPark-FUNCIONA/index.html) | Web activa y mapa. Edita este archivo para cambiar la página principal. |
| [server.js](server.js) y [src/app.js](src/app.js) | Arranque local y rutas de Express. |
| [src/services/sitios.js](src/services/sitios.js) | Consulta a Supabase para `GET /api/sitios`. |
| [api/](api/) y [vercel.json](vercel.json) | Entradas y configuración para Vercel. |
| [test/](test/) | Pruebas de la API y de las rutas principales. |
| [docs/](docs/) | Documentación, fuentes de los datos y notas de los sprints. |

## Pruebas y documentación

Ejecuta `npm test` para comprobar la API y las rutas. En el mapa, el botón **Actualizar** vuelve a consultar la API y los favoritos se guardan en el navegador.

- [Coordinación del sprint 2](docs/COORDINACION_SPRINT_2.txt)
- [Tramos de El Masnou, fuentes e importación](docs/el-masnou-ubicaciones-reales.md)
- [Prototipo del sprint 1](docs/archivo/frontend-sprint-1.html). Se conserva como referencia junto con sus recursos en `css/` y `js/`.
- [Notas del despliegue inicial](docs/archivo/notas-despliegue-inicial.txt)
