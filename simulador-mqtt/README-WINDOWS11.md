# CarPark - Simulador MQTT de Marc (Windows 11, sin Docker)

Este simulador envía mensajes MQTT con el estado **libre** u **ocupado** de una plaza. Incluye un receptor de prueba que confirma los mensajes recibidos. No modifica la base de datos ni el frontend por sí solo.

## 1. Requisitos

- Windows 11 y PowerShell
- Node.js 20 o superior (`node -v`)
- Mosquitto para Windows 64 bits: https://mosquitto.org/download/
- Git (si vas a subir los archivos al repositorio)

**No hace falta Docker**. Los archivos `compose.yaml` y `mosquitto.conf` son opcionales y corresponden a la alternativa con Docker.

## 2. Iniciar Mosquitto

En PowerShell, comprueba si ya está iniciado como servicio:

```powershell
Get-Service mosquitto -ErrorAction SilentlyContinue
```

Si aparece `Running`, continúa. Si no, abre otra ventana de PowerShell y ejecuta:

```powershell
& "C:\Program Files\mosquitto\mosquitto.exe" -v
```

Deja la ventana abierta. Si indica `Address already in use`, comprueba si ya hay un broker escuchando en el puerto 1883; no arranques una segunda instancia.

## 3. Instalar dependencias y comprobar el simulador

Extrae el ZIP; copia la carpeta `simulador-mqtt` dentro de la carpeta del proyecto `car-park`.

Abre PowerShell en `simulador-mqtt` y ejecuta:

```powershell
npm.cmd install
npm.cmd test
```

`npm.cmd install` instala `mqtt` y `dotenv`. `npm.cmd test` comprueba el formato de los mensajes y la validación de opciones.

## 4. Recibir los mensajes

Abre una ventana de PowerShell dentro de la carpeta `simulador-mqtt`:

```powershell
npm.cmd run escuchar
```

Deja la ventana abierta para ver los mensajes entrantes.

## 5. Publicar estados de una plaza

En otra ventana de PowerShell, también en `simulador-mqtt`:

```powershell
npm.cmd start -- --estado ocupado
npm.cmd start -- --estado libre
```

En la ventana del receptor deberían aparecer las dos publicaciones. Para simular cambios automáticos cada 5 segundos:

```powershell
npm.cmd start
```

Detén el programa con `Ctrl+C`.

Para simular la plaza CP-002 con intervalo de 3 segundos:

```powershell
npm.cmd start -- --id CP-002 --intervalo 3000
```

## 6. Formato que debes acordar con Alex

- Topic propuesto: `carpark/sitios/estado`
- Mensaje: `{"id":"CP-001","estado":"ocupado"}` o `{"id":"CP-001","estado":"libre"}`
- QoS: 1
- Retain: false
- Identificadores: texto, por ejemplo `CP-001`.

Verifica los IDs reales de Supabase con Alex. El backend todavía debe implementar un suscriptor MQTT y una actualización de la base de datos para que los cambios aparezcan en la API y en el mapa.

## 7. Capturas para el profesor

1. `npm.cmd test` con las pruebas superadas.
2. Receptor escuchando mensajes del topic.
3. Envío y recepción de `ocupado`.
4. Envío y recepción de `libre`.
5. Simulación de cambios automáticos.
6. Tu rama y Pull Request en GitHub.

La documentación principal del proyecto está en `README.md`, que también incluye la opción alternativa con Docker.
