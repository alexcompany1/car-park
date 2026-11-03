# Carpark: API del Sprint 2

## Arrancar
Necesitas Node.js 20 o superior y npm. Desde la carpeta del repositorio:

```bash
npm ci
cp .env.example .env
```

Completa `.env` con `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` del proyecto
Carpark. En esta copia local ya está configurado; conserva ese archivo.
La clave publicable respeta los permisos de lectura y RLS de Supabase.
`.env` está excluido de Git. No hace falta una clave de administrador.

```bash
npm start
```

Abre http://localhost:3000/api/sitios. Usa `npm run dev` para reiniciar al guardar.
Puedes cambiar el puerto con `PORT=3001 npm start`.
En un despliegue configura ambas variables en el entorno del servidor.

## GET /api/sitios
Consulta `public.plazas` en Supabase en cada petición y devuelve HTTP 200:

```json
{
  "sitios": [
    { "id": "CP-001", "estado": "libre", "mensaje": "La plaza CP-001 está disponible" },
    { "id": "CP-002", "estado": "ocupado", "mensaje": "La plaza CP-002 no está disponible" }
  ]
}
```

Los identificadores son textos de la base de datos, no números.
El frontend debe usar `estado` para decidir la disponibilidad y `mensaje`
para mostrar el texto. Traducciones de `estado_actual`:

- `free` -> `libre`
- `occupied` -> `ocupado`
- `unknown` -> `desconocido`
- `reserved` -> `reservado`
- `offline` -> `sin_conexion`

Un valor no reconocido se trata como desconocido, nunca como libre.
Sin plazas devuelve `{"sitios":[]}`. Si falla la conexión o falta configuración,
responde HTTP 503 con un mensaje genérico, sin datos de prueba de respaldo.
La respuesta utiliza `Cache-Control: no-store`.

## Archivos y comprobaciones
- `server.js`: arranque local.
- `src/app.js`: rutas de Express.
- `src/services/sitios.js`: conexión, consulta y traducción de estados.
- `api/sitios.js`: reutiliza la aplicación en Vercel.

`/` muestra la web de `CarPark-FUNCIONA`, conectada a `/api/sitios`. Se conservan `/timeline` y `/health`;
`/health` indica que el proceso responde, no comprueba la base de datos.
Las rutas desconocidas devuelven HTTP 404.

```bash
npm test
curl http://localhost:3000/api/sitios
```

Las pruebas automáticas utilizan consultas sustituidas para comprobar respuestas,
estados, lista vacía y fallos sin depender de Internet. La comprobación real del
29/10/2026 devolvió 20 plazas de Supabase. Estar guardadas en la base de datos
no demuestra que su ocupación provenga de sensores reales. MQTT sigue pendiente.
El proyecto estaba pausado y se reactivó para realizar la comprobación.
El despliegue de esta versión en Vercel no se ha verificado.


## Frontend conectado (03/11/2026)
Arranca todo con `npm start` y abre http://localhost:3000.
La web principal utiliza `CarPark-FUNCIONA/index.html`; también se sirve
bajo `/CarPark-FUNCIONA/`. Necesita el servidor, no debe abrirse por doble clic.
El botón Actualizar consulta la API sin modificar la ocupación.
Los favoritos permanecen en el navegador; los estados se leen de Supabase.
El esquema del mapa es ilustrativo: las posiciones se distribuyen relativamente
según coordenadas, pero el dibujo de calles no es un mapa geográfico real.
Cómo llegar abre las coordenadas de la plaza en Google Maps.

La API añade `direccion`, `latitud`, `longitud`, `zona` y
`ultima_actualizacion`, conservando `id`, `estado` y `mensaje`.
Las zonas se consultan mediante la relación `plazas.zona_id -> zonas.id`.
Las fotografías decorativas del encabezado se conservan; no se atribuyen
fotografías de muestra a las plazas de la base de datos.
La web anterior en la raíz se conserva como referencia, pero el servidor
muestra la nueva carpeta. No se ha desplegado esta integración en Vercel.


## Actualización El Masnou
La prueba actual reemplaza el esquema ilustrativo por un mapa real con Leaflet
y OpenStreetMap. El frontend consulta el filtro opcional `zona=El Masnou (demo)`.
Se muestran cuatro referencias reales de aparcamientos con estados simulados.
El resto de los registros se conserva. Ver `el-masnou-demo.md` para las fuentes.


## Estado actual: ubicaciones reales (03/11/2026)
Esta sección sustituye los ejemplos de demostración anteriores.
La base de datos contiene 13 tramos reales de estacionamiento, con todos los
estados desconocidos. La web filtra por El Masnou - zona blava y muestra sus
nombres y geometrías. Ver el-masnou-ubicaciones-reales.md para fuentes,
contrato añadido y recuperación de los datos de prueba eliminados.
