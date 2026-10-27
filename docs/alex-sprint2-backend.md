# Carpark: API de prueba del Sprint 2

## Arrancar
Necesitas Node.js 20 o superior y npm. Desde la carpeta del repositorio:

```bash
npm ci
npm start
```

Abre http://localhost:3000/api/sitios.
Usa `npm run dev` para reiniciar automáticamente al guardar cambios.
El puerto se puede cambiar con `PORT=3001 npm start`.

## GET /api/sitios
Devuelve HTTP 200 y JSON:

```json
{
  "sitios": [
    { "id": 1, "estado": "libre", "mensaje": "La plaza 1 está disponible" },
    { "id": 2, "estado": "ocupado", "mensaje": "La plaza 2 no está disponible" }
  ]
}
```

Cada plaza tiene un identificador estable. El frontend debe usar `estado`
(`libre` u `ocupado`) para decidir el color o la disponibilidad.
`mensaje` es el texto para el usuario.
La lista permite incluir varias plazas; sin plazas devolvería `{"sitios": []}`.

Los datos son simulados y fijos. La conexión con Supabase/PostgreSQL y
las actualizaciones MQTT quedan para próximas tareas.

## Archivos
- `server.js`: arranca el servidor local.
- `src/app.js`: define las rutas de Express.
- `src/data/sitios.js`: contiene las plazas simuladas.
- `api/sitios.js`: reutiliza la aplicación para la ruta de Vercel.

Se conservan `/`, `/timeline` y `/health`.
Las rutas desconocidas responden HTTP 404 en JSON.

## Verificar
```bash
npm test
curl http://localhost:3000/api/sitios
```

Las pruebas comprueban los dos estados, el JSON, las rutas existentes y el 404.
Se ejecutan localmente. La ruta de Vercel debe verificarse al desplegar la rama.
