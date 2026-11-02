# CarPark

Proyecto académico de aparcamiento inteligente.

## Cómo ejecutar
1. Abre esta carpeta en Visual Studio Code.
2. Instala la extensión Live Server.
3. Abre `index.html` y selecciona **Open with Live Server**.
4. Mantén conexión a Internet para cargar Leaflet, OpenStreetMap y las fuentes web.

## Funciones incluidas
- Mapa interactivo de Barcelona con marcadores.
- Búsqueda por código, calle, zona o estado.
- Filtros por disponibilidad y zona.
- Resumen de plazas libres, ocupadas y totales.
- Panel de detalles y enlace para obtener indicaciones.
- Botón para centrar el mapa en la ubicación del navegador.

## Estructura
```
car-park/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── app.js
└── README.md
```

## Datos de demostración
Las diez plazas, sus estados, distancias y horas de actualización están simulados en `js/app.js`. No representan disponibilidad real ni están conectados a sensores ESP32, MQTT o un backend. La geolocalización del navegador requiere permiso del usuario y un contexto seguro (por ejemplo, localhost mediante Live Server).

Mapa: Leaflet + OpenStreetMap.
