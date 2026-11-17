# CarPark: simulador MQTT de Marc (Sprint 2)

## Qué hace

Simula una plaza de zona azul: publica `libre` y `ocupado` en un broker MQTT.
No necesita sensores ni ESP32. Usa el contrato propuesto en `COORDINACION_SPRINT_2.txt`:

- **Topic:** `carpark/sitios/estado`
- **Payload:** `{"id":"CP-001","estado":"libre"}` o `{"id":"CP-001","estado":"ocupado"}`
- **QoS:** 1 (con confirmación del broker)
- **Retain:** false (evita reutilizar automáticamente estados viejos)
- **ID de plaza:** texto (`CP-001`, por ejemplo)

> Confirmar con Alex los nombres definitivos del topic, ID y formato antes de integrar con Supabase. La publicación MQTT por sí sola **no** modifica la base de datos.

## Requisitos

- Node.js 20 o superior y npm
- Broker MQTT: se incluye uno **solo de pruebas locales** con Docker Compose; requiere Docker Desktop en Windows

## Cómo arrancarlo en Windows (PowerShell)

Abre PowerShell en la carpeta `simulador-mqtt` (dentro del repositorio `car-park`).

### Paso 1. Comprobar Node y Docker

```powershell
node -v
docker compose version
```

Si no tienes Docker, puedes usar un broker Mosquitto instalado en tu PC. Configura la URL con `MQTT_URL` y salta el paso Docker.

### Paso 2. Encender el broker local

```powershell
docker compose up -d
```

El broker escucha por el puerto TCP **1883**. En el ejemplo, Docker lo expone solo en `127.0.0.1`, no a toda la red.

### Paso 3. Instalar dependencias del simulador

```powershell
npm install
npm test
```

`npm install` descarga `mqtt` y `dotenv`. `npm test` comprueba el formato de los mensajes sin conectarse a Internet ni a MQTT.

### Paso 4. Abrir un suscriptor de prueba (Terminal 1)

```powershell
npm run escuchar
```

Se suscribe al topic y muestra cada mensaje recibido. Deja esta terminal abierta.

### Paso 5. Publicar un estado ocupado (Terminal 2)

```powershell
npm start -- --estado ocupado
```

Deberías ver en Terminal 1 algo parecido a:

```text
[RECIBIDO] ... | carpark/sitios/estado | plaza CP-001: ocupado
```

### Paso 6. Publicar un estado libre (Terminal 2)

```powershell
npm start -- --estado libre
```

### Paso 7. Simular cambios automáticos (Terminal 2)

```powershell
npm start
```

Alterna estados de `CP-001` cada 5 segundos. Detener con `Ctrl + C`.

Para cambiar el ID y el intervalo:

```powershell
npm start -- --id CP-002 --intervalo 3000
```

### Paso 8. Parar el broker al terminar

```powershell
docker compose down
```

## ¿Qué hace cada componente?

- `simulador.js`: se conecta al broker y **publica** cambios de una plaza.
- `escuchar.js`: se suscribe al topic y **recibe** los cambios; sirve para demostrar la comunicación.
- `configuracion.js`: fija topic, ID y estado; valida los datos.
- `test/configuracion.test.js`: comprueba formato y entradas incorrectas.
- `compose.yaml` y `mosquitto.conf`: crean un broker Mosquitto local de demostración.
- `.env.example`: configuración de ejemplo. Si hace falta un broker distinto, copia a `.env` y cambia la URL.

## Cómo comprobar la integración con Alex y Pau

1. **Marc**: ejecuta el suscriptor y publica `ocupado`, después `libre`. Guarda capturas de las dos terminales.
2. **Alex**: crea/ejecuta un suscriptor MQTT real en el backend; valida `id` y `estado` y actualiza `public.plazas.estado_actual` con `occupied` o `free` según corresponda. Debe usar credenciales con permisos adecuados y autorización del dispositivo; no exponer claves privilegiadas al simulador ni a GitHub.
3. **Pau**: consulta `GET /api/sitios`, que leerá desde Supabase. Comprueba que `CP-001` cambió de `ocupado` a `libre` tras las publicaciones, **solo si Alex ha conectado ya el flujo MQTT→Supabase**.

**Importante:** en el estado actual del repositorio, la API REST es de solo lectura, por lo que los mensajes de Marc **no** se reflejarán en ella hasta que Alex implemente y pruebe la recepción MQTT y la actualización de base de datos. Vercel serverless no debe considerarse un suscriptor MQTT permanente; el suscriptor necesitará un proceso en ejecución continua aparte.

## Seguridad y decisiones de diseño

- El broker incluido permite conexiones sin contraseña **solo para la prueba local**. Nunca exponerlo a Internet.
- En despliegues compartidos utilizar cuentas de MQTT, autorización por topic y TLS (`mqtts://`).
- `MQTT_USERNAME` y `MQTT_PASSWORD` pueden definirse en `.env` local, ignorado por Git.
- `QoS 1` permite duplicados; Alex debe evitar que lecturas repetidas produzcan efectos indeseados.
- `retain:false` y estados cambiantes evitan prometer que una plaza está libre sin una lectura reciente.
- MQTT se usa en lugar de consultas HTTP continuas desde sensores porque es ligero y permite publicar/suscribirse a cambios. Para la web, REST sigue siendo adecuado para consultar el estado actual.

## Capturas para la entrega

- `npm test` con los tests correctos.
- Terminal `npm run escuchar` escuchando el topic.
- Terminal con publicación `ocupado` y recepción en el suscriptor.
- Terminal con publicación `libre` y recepción en el suscriptor.
- Si existe integración, captura de la API y del mapa antes y después del cambio.
- Commit y Pull Request en la rama personal de Marc.

## Cómo incluirlo en GitHub

Desde la raíz de `car-park`, después de copiar aquí la carpeta `simulador-mqtt`:

```powershell
git switch main
git pull --ff-only origin main
git switch -c feature/marc-simulador-mqtt
git add simulador-mqtt
git commit -m "feat(iot): anade simulador MQTT de plazas"
git push -u origin feature/marc-simulador-mqtt
```

Abre una Pull Request hacia `main` para que Alex y Pau la revisen. Si la rama ya existe, usa `git switch feature/marc-simulador-mqtt` en vez de `git switch -c`.
