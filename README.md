# CarPark

CarPark muestra los tramos de aparcamiento de la zona azul de El Masnou.

- [Contenido](#contenido)
- [Presentación](#presentación)
- [Infraestructura](#infraestructura)

## Contenido

El catálogo recoge 13 tramos publicados por SUMEM. Su ocupación aún es desconocida.

- [Tramos de El Masnou, fuentes e importación](docs/el-masnou-ubicaciones-reales.md)
- [Coordinación del sprint 2](docs/COORDINACION_SPRINT_2.txt)

## Presentación

### Web y mapa

- [Ver la web publicada en Vercel](https://car-park-snowy.vercel.app/#mapa)
- [Página principal y mapa](CarPark-FUNCIONA/index.html). Edita este archivo para cambiar la web activa.
- [Prototipo del sprint 1](docs/archivo/frontend-sprint-1.html). Se conserva como referencia junto con sus recursos en `css/` y `js/`.

El mapa usa Leaflet y OpenStreetMap y necesita conexión a Internet. El botón **Actualizar** vuelve a consultar la API y los favoritos se guardan en el navegador.

### Entrega del sprint 2

- [Diapositivas en PowerPoint](presentacion-sprint-2/CarPark_Sprint_2.pptx)
- [Diapositivas en PDF](presentacion-sprint-2/CarPark_Sprint_2.pdf)
- [Guion](presentacion-sprint-2/CarPark_Sprint_2_guion.pdf)
- [Vídeo](presentacion-sprint-2/CarPark_Sprint_2_video.mp4)

## Infraestructura

El mapa consulta la API de Express, que lee el catálogo de Supabase.

| Archivo o carpeta | Función |
| --- | --- |
| [server.js](server.js) y [src/app.js](src/app.js) | Arranque local y rutas de Express. |
| [src/services/sitios.js](src/services/sitios.js) | Consulta a Supabase para `GET /api/sitios`. |
| [api/](api/) | Entradas para Vercel. |
| [test/](test/) | Pruebas de la API y de las rutas principales. |
| [simulador-mqtt/](simulador-mqtt/) | Simulador de eventos MQTT. |
| [lab-backups/](lab-backups/) | Laboratorio de copias de seguridad y restauración. |
| [Notas del despliegue inicial](docs/archivo/notas-despliegue-inicial.txt) | Referencia del primer despliegue. |

### Arranque en local

Instala las dependencias con Node.js 20 o posterior.

```bash
npm ci
```

Si todavía no tienes un archivo `.env`, créalo a partir de [`.env.example`](.env.example) y rellena `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`. Después, arranca el servidor.

```bash
npm start
```

Abre [CarPark en local](http://localhost:3000/).

### Pruebas

Ejecuta `npm test` para comprobar la API y las rutas.
