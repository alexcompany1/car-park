# Pruebas y resultados — 10 de noviembre de 2026

## Qué se ha ejecutado

Docker Desktop para Linux, contexto `desktop-linux`, con PostgreSQL y clientes 17.11. La aplicación utiliza el código de `main` en `4a9fd3b`. El laboratorio principal está en `/home/user/Documents/proyecto-lab-backups`, rama `feature/lab-backups`; el proyecto habitual de Alex queda separado.

Se leyó mediante el conector de Supabase una instantánea JSON de las seis tablas del catálogo. Se importó sobre el esquema reducido de laboratorio. **No se ha ejecutado un pg_dump remoto de Supabase**, porque falta configurar su conexión PostgreSQL. Los archivos custom utilizados en estas pruebas sí se han generado con `pg_dump`, desde la base local, y se han restaurado con `pg_restore`.

| Comprobación | Resultado observado |
| --- | --- |
| Catálogo importado | 1 ciudad, 13 direcciones, 1 zona, 13 plazas, 0 dispositivos, 0 históricos |
| Backup local del catálogo | Archivo custom, manifiesto y SHA-256 verificados |
| Pérdida simulada | API con 0 plazas, exclusivamente en Docker |
| Restauración | API con 13 plazas; seis tablas con los mismos recuentos y huellas |
| Relaciones | Seis claves foráneas; una dirección con ciudad inexistente se rechaza |
| Prueba adicional ficticia | 3 plazas, 1 dispositivo y 1 histórico: pérdida y recuperación completas |
| Estados API de la prueba ficticia | `free`, `occupied`, `unknown` traducidos por la API a español y comparados con PostgreSQL |
| Archivo alterado | Restauración rechazada antes de escribir |
| Ruta fuera de backups | Rechazada |
| Destino sin marca de laboratorio | Restauración rechazada; la marca local se repone al terminar la prueba |
| Dos operaciones simultáneas | Segundo bloqueo rechazado |
| Fallo SQL antes de COMMIT | Restauración revertida; datos anteriores conservados |
| Retención | Dos pruebas automáticas correctas: conserva dos de tres copias válidas y respeta carpetas incompletas; un límite inválido no borra archivos |
| Web | Mapa y lista con los 13 tramos recuperados en localhost:3101 |
| Origen remoto sin configurar | Cancelado con mensaje de configuración; no se intentó restaurar en Supabase |

Las huellas se calculan sobre las filas de la propia copia y se comparan después con las filas restauradas. Esto detecta cambios en los datos, no solo diferencias de cantidad.

## Evidencias y tiempos

El archivo [evidencias.jsonl](evidencias.jsonl) contiene eventos reales seleccionados, sin contraseñas ni filas del catálogo. Los logs completos y los dumps se guardan localmente en `logs/` y `backups/`, excluidos de Git. La captura del mapa recuperado queda en `logs/laboratorio-recuperado.png` en el portátil y tampoco se publica.

En el ensayo de 13 plazas, la API vacía se confirmó a las 16:27:39.701 UTC y la recuperación verificada a las 16:27:42.813 UTC: aproximadamente 3,1 segundos. Solo mide este pequeño ensayo local; no establece un tiempo garantizado de recuperación en producción. La prueba ficticia terminó a las 16:31:39 UTC y la retención se comprobó a las 16:36:13 UTC.

Para reproducir la prueba principal desde la raíz del repositorio:

```bash
export CARPARK_DOCKER_CONTEXT=desktop-linux
./lab-backups/scripts/lab.sh demo
```

Si usas Docker Engine con su contexto habitual, omite la primera línea. `demo` conserva el catálogo que ya existe y solo simula su pérdida después de crear una copia local verificada. El primer arranque vacío usa los tres registros ficticios que sí se incluyen en Git.

Para repetir la comprobación de retención, después de crear al menos una copia:

```bash
docker --context desktop-linux compose --project-directory lab-backups --env-file lab-backups/.env -f lab-backups/docker-compose.yml run --rm -T --entrypoint python3 tools -m unittest discover -s /lab/scripts -p test_retention.py
```

## Problemas encontrados y solución

1. El socket Docker predeterminado no respondía. Se utilizó el contexto `desktop-linux` una vez iniciado Docker Desktop.
2. El SDK de Supabase envía peticiones a `/rest/v1`; PostgREST utiliza rutas de tablas. Se añadió Nginx para adaptar ese prefijo sin cambiar el backend.
3. Docker Desktop no publicaba el puerto con una única red interna. La API dispone además de una red puente; PostgreSQL y las restauraciones continúan en la red interna.
4. La dirección está normalizada en otra tabla, mientras que el backend publicado solicita un campo calculado. Se repone esa función tras la restauración.
5. Las credenciales disponibles son de la API de Supabase, no de PostgreSQL. Se pudo ensayar con una lectura del catálogo, dejando explícitamente pendiente la exportación remota oficial.

## Completado y pendiente

Completado: inspección real de GitHub, Supabase y Vercel; laboratorio Docker; copias y restauraciones locales; verificación por API; pérdida simulada; protecciones y retención probadas; documentación de reconstrucción de Vercel; guía y memoria LaTeX.

Pendiente: configurar y probar la conexión PostgreSQL remota de lectura y su dump; revisar su alcance bajo RLS; instalar la tarea cron después de validarla; guardar copias cifradas fuera del portátil; probar recuperación de Auth/usuarios y Storage por separado. La plantilla cron está preparada, pero no se ha instalado ninguna tarea periódica.

La memoria LaTeX está entregada como fuente, con los resultados incluidos. No se ha compilado porque este entorno no dispone de un motor LaTeX. Puede subirse `memoria.tex` junto con `resultados.tex` a Overleaf y compilarse allí, o ejecutar `pdflatex memoria.tex` desde `docs/` en un equipo con LaTeX.

No se ha modificado la base original ni el despliegue activo de Vercel. La rama se presenta como PR en borrador para revisión, sin incorporarla a main.
