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

`/` redirige a `/api/sitios`. Se conservan `/timeline` y `/health`;
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
