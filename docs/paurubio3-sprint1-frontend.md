# Car Park — Entregable Frontend / Sprint 1 (paurubio3)

Este documento recoge el resultado de las tareas **#42–#53** asignadas a `@paurubio3`. Sirve como especificación funcional y técnica para implementar el frontend del MVP y como cierre de Sprint 1.

## 1. Usuario y flujo principal — #42

**Usuario principal:** conductor que busca una plaza de aparcamiento.

Flujo:
1. Abrir Car Park.
2. Obtener ubicación del dispositivo, solicitando permiso si hace falta.
3. Mostrar mapa centrado en la posición actual.
4. Consultar plazas disponibles al backend.
5. Aplicar filtros opcionales.
6. Seleccionar una plaza para ver su detalle.
7. Pulsar **Cómo llegar** para abrir la navegación del dispositivo hacia las coordenadas de la plaza.
8. Recibir cambios de disponibilidad en tiempo real mientras permanece en la pantalla.

Estados UX mínimos: carga, ubicación denegada, error de API, sin plazas, plaza seleccionada y actualización recibida.

## 2. Pantallas del MVP — #43

- **Mapa:** pantalla principal; ubicación del usuario, plazas, filtros y estado de conexión.
- **Detalle de plaza:** identificador, estado, coordenadas y datos disponibles; acción «Cómo llegar».
- **Filtros/búsqueda:** estado de plaza y criterios disponibles según la API.
- **Navegación:** no requiere un navegador propio en el MVP; delega en Google Maps/Apple Maps mediante URL de navegación.

La aplicación debe ser usable en móvil y escritorio.

## 3. Wireframe — #44

### Mapa

```
┌──────────────────────────────────────┐
│ Car Park                 ● Conectado │
├──────────────────────────────────────┤
│ [ Buscar / dirección... ]            │
│ [ Libres ] [ Ocupadas ] [ Distancia ]│
├──────────────────────────────────────┤
│                                      │
│          MAPA / OPENSTREETMAP        │
│       ○ libre     ● ocupada          │
│             ◎ usuario                │
│                                      │
│                  ┌───────────────┐   │
│                  │ Plaza A-12     │   │
│                  │ Libre · 120 m  │   │
│                  │ [Cómo llegar] │   │
│                  └───────────────┘   │
├──────────────────────────────────────┤
│ Actualizado hace 5 s     [Recentrar] │
└──────────────────────────────────────┘
```

### Detalle de plaza

```
┌──────────────────────────────┐
│ ← Plaza A-12                 │
│ Estado: LIBRE                │
│ Distancia: 120 m             │
│ Coordenadas: lat, lon        │
│                              │
│        [ CÓMO LLEGAR ]       │
└──────────────────────────────┘
```

## 4. Estados visuales — #45

El frontend normaliza los estados recibidos por API/WebSocket:

| Estado | Significado | UI |
|---|---|---|
| `free` | Disponible | Marcador seleccionable como libre |
| `occupied` | Ocupada | Marcador no disponible |
| `unknown` | Sin información fiable | Estado neutro / no seleccionar |
| `reserved` | Reservada, si el backend lo soporta | No disponible |
| `offline` | Sin actualización reciente | Marcador atenuado y aviso |

No se debe depender solo del color: cada estado debe incluir texto/aria-label para accesibilidad.

## 5. Filtros y búsqueda — #46

MVP:
- Estado: libres / ocupadas / desconocidas.
- Distancia respecto al usuario.
- Búsqueda por dirección o zona, si el proveedor de geocodificación está disponible.
- Orden: más cercanas primero.

Los filtros se aplican en frontend sobre el conjunto recibido cuando sea pequeño; si la API soporta parámetros de filtrado, se pueden enviar al backend para reducir datos.

## 6. Información de una plaza — #47

Modelo mínimo esperado:

```json
{
  "id": "A-12",
  "status": "free",
  "latitude": 41.0000,
  "longitude": 2.0000,
  "updatedAt": "2026-10-08T12:00:00Z"
}
```

Campos opcionales futuros: zona, tipo, accesibilidad, cargador EV, precio y restricciones.

## 7. Mapa y geolocalización — #48

Se recomienda **Leaflet + OpenStreetMap** para el MVP por simplicidad y bajo acoplamiento.

Responsabilidades:
- Leaflet renderiza mapa y marcadores.
- Geolocation API obtiene la posición del usuario.
- OpenStreetMap aporta los tiles, respetando sus políticas de uso.
- La posición del usuario no se persiste en el frontend salvo que una futura funcionalidad lo requiera.

Fallback:
- Si el usuario deniega geolocalización, mostrar una vista de mapa por defecto y permitir búsqueda manual.
- Si falla el proveedor de tiles, mantener mensaje de error sin bloquear el resto de la aplicación.

## 8. Actualización en tiempo real — #49

Flujo:

```
Backend ── WebSocket ──> Frontend
                           │
                           ├─ validar mensaje
                           ├─ actualizar plaza por id
                           ├─ actualizar marcador
                           └─ mostrar timestamp
```

Formato recomendado:

```json
{
  "type": "parking.updated",
  "parkingSpotId": "A-12",
  "status": "occupied",
  "updatedAt": "2026-10-08T12:01:10Z"
}
```

El cliente debe:
- Rechazar mensajes sin `parkingSpotId` o `status` válido.
- Actualizar solo la plaza afectada.
- Mostrar estado de conexión.
- Intentar reconexión con backoff.
- Mantener los últimos datos conocidos mientras está desconectado y marcarlos como potencialmente obsoletos.

## 9. Necesidades de la API — #50

El frontend necesita inicialmente:

### GET /api/parking-spots

Respuesta:

```json
{
  "data": [
    {
      "id": "A-12",
      "status": "free",
      "latitude": 41.0000,
      "longitude": 2.0000,
      "updatedAt": "2026-10-08T12:00:00Z"
    }
  ]
}
```

Parámetros futuros: `lat`, `lon`, `radius`, `status`.

### GET /api/parking-spots/:id

Devuelve el detalle de una plaza.

### WebSocket /ws

Emite eventos `parking.updated`.

### GET /health

Ya existe en el proyecto y se puede utilizar para comprobar disponibilidad del servicio.

Errores: JSON consistente con `error` y HTTP 4xx/5xx según el caso.

## 10. Navegación y ruta — #51

El MVP no implementa cálculo de rutas propio. Al seleccionar una plaza, **Cómo llegar** construye una URL de navegación con sus coordenadas:

- Google Maps: `https://www.google.com/maps/dir/?api=1&destination=LAT,LON`
- Apple Maps: `https://maps.apple.com/?daddr=LAT,LON`

La aplicación puede elegir el destino según plataforma o permitir que el sistema operativo gestione el enlace.

## 11. Arquitectura Frontend — #52

```
┌─────────────────────────────┐
│          UI / Pages         │
│ Mapa · Detalle · Filtros    │
└──────────────┬──────────────┘
               │
       ┌───────▼────────┐
       │ Frontend state │
       │ spots + user   │
       │ + connection   │
       └───┬─────────┬──┘
           │         │
     REST API      WebSocket
           │         │
       ┌───▼─────────▼───┐
       │      Backend    │
       └─────────────────┘
```

Principios:
- API client aislado de componentes de UI.
- Modelo de plaza normalizado por `id`.
- WebSocket actualiza el mismo store usado por el mapa.
- Componentes de mapa no contienen lógica de negocio de API.
- Geolocalización se encapsula en un servicio/hook.
- Errores y estados de carga son explícitos.

## 12. Cierre de Sprint 1 — #53

Checklist del trabajo de Frontend:

- [x] Usuario y flujo principal definidos.
- [x] Pantallas del MVP definidas.
- [x] Wireframe del mapa y detalle definido.
- [x] Estados visuales definidos.
- [x] Filtros y búsqueda definidos.
- [x] Modelo de información de plaza definido.
- [x] Estrategia de mapa/geolocalización definida.
- [x] Protocolo de actualización en tiempo real definido.
- [x] Necesidades de API documentadas.
- [x] Navegación a destino definida.
- [x] Arquitectura Frontend documentada.

### Siguiente Sprint

Implementar primero:
1. Estructura de la aplicación y componentes.
2. Integración de mapa.
3. Cliente REST.
4. Marcadores y filtros.
5. WebSocket + reconexión.
6. Detalle de plaza y navegación.
7. Tests de estados y errores.
