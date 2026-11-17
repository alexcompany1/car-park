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


## Demostración MQTT + Backend + Supabase

Carpark permite simular cambios de ocupación en los 13 tramos
de zona azul de El Masnou utilizando MQTT.

### Requisitos

- Node.js 20 o superior
- Docker y Docker Compose
- Acceso al proyecto Supabase
- Archivo `.env` configurado

### Configuración

Crear un archivo `.env` en la raíz del proyecto con:

SUPABASE_URL=URL_DEL_PROYECTO
SUPABASE_PUBLISHABLE_KEY=CLAVE_PUBLICA
SUPABASE_SERVICE_ROLE_KEY=CLAVE_PRIVADA_SERVIDOR
MQTT_URL=mqtt://127.0.0.1:1883
MQTT_WRITE_ENABLED=false

La clave privada nunca debe subirse a GitHub ni
utilizarse en el navegador.

Para permitir actualizaciones durante una demostración
autorizada, establecer MQTT_WRITE_ENABLED=true.
Se recomienda utilizar datos de prueba.

### Instalación

Desde la raíz del repositorio:

```bash
npm ci
```

### Iniciar la demostración

En Linux:

```bash
./iniciar-demo.sh
```

Este script arranca:
- Mosquitto mediante Docker Compose.
- El servidor Express.
- El suscriptor MQTT del backend.

Abrir la web en:

http://localhost:3000

### Simular cambios

En otra terminal:

```bash
cd simulador-mqtt
npm ci
npm start -- --id EM-ZB-NAVARRA --estado ocupado
```

Para marcar el tramo como libre:

```bash
npm start -- --id EM-ZB-NAVARRA --estado libre
```

También se pueden utilizar los demás identificadores
definidos en `src/data/tramos-el-masnou.json`.

### Funcionamiento

1. El simulador publica un mensaje MQTT.
2. Mosquitto distribuye el mensaje.
3. `src/mqtt-listener.js` valida el identificador y estado.
4. El backend actualiza `plazas` en Supabase.
5. Express devuelve el nuevo estado mediante `/api/sitios`.
6. La web muestra el cambio de ocupación.

### Seguridad

El broker Mosquitto incluido es solo para pruebas locales.

El suscriptor MQTT necesita estar ejecutándose para recibir
mensajes. Vercel no aloja este proceso permanente.

Cuando finalicen las pruebas:
- Cambiar MQTT_WRITE_ENABLED=false.
- Reiniciar el suscriptor MQTT.
- Detener Docker si ya no se necesita.

Para detener el broker:

```bash
docker compose -f simulador-mqtt/compose.yaml down
```

