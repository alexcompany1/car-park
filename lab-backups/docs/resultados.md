# Pruebas y resultados — 10 de noviembre de 2026

## Qué se ha ejecutado

Docker Desktop para Linux, contexto `desktop-linux`, con PostgreSQL y clientes 17.11. La aplicación utiliza el código de `main` en `4a9fd3b`. El laboratorio principal está en `/home/user/Documents/proyecto-lab-backups`, rama `feature/lab-backups`; el proyecto habitual de Alex queda separado.

Se ejecutaron tres vías: una instantánea JSON del catálogo obtenida con el conector e importada sobre un esquema reducido, una prueba con datos ficticios y, finalmente, **un pg_dump directo de Supabase con el rol lector a través de Session pooler**. El dump remoto incluye el DDL de las seis tablas y sus datos, y se restauró únicamente en Docker. No es una copia completa de Supabase.

El usuario configuró la contraseña localmente y autorizó los cambios de lectura de `scripts/source-reader.sql`. Se verificó el certificado del servidor con `sslmode=verify-full` y la CA descargada desde la URL HTTPS que utiliza el panel oficial. Las nuevas sesiones de `lector` muestran `default_transaction_read_only=on`, permiten leer las 13 plazas y no tienen privilegios de escritura en las seis tablas.

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
| Backup remoto de Supabase | Dump custom con 1 ciudad, 13 direcciones, 1 zona, 13 plazas, 0 dispositivos y 0 históricos |
| Recuperación del dump remoto | 13 → 0 → 13 plazas por la API; seis tablas y seis claves foráneas verificadas |

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
5. Inicialmente solo se disponía de la clave de API. Tras configurar el usuario PostgreSQL `lector`, se pudo probar también el dump remoto real.
6. La conexión directa no era resoluble desde Docker. Se utilizó Session pooler en el puerto 5432 y se añadió la CA oficial de Supabase para mantener `verify-full`.
7. El rol tenía SELECT pero RLS no le permitía ver filas. Con autorización se añadieron políticas de SELECT solo para `lector` y se activó el modo de lectura por defecto. Una conexión reutilizada del pooler conservó temporalmente la configuración anterior; la siguiente sesión nueva mostró el valor correcto.
8. Los nombres de las restricciones del esquema reducido diferían de los del dump remoto. La restauración sustituye las seis tablas del catálogo dentro de la transacción y repone las políticas y relaciones del dump. El primer intento fallido se revirtió y no cambió los datos locales. Las protecciones y el rollback se volvieron a probar con la copia remota.

## Completado y pendiente

Completado: inspección real de GitHub, Supabase y Vercel; laboratorio Docker; copias locales y pg_dump remoto de Supabase; restauración local del dump remoto; verificación por API; pérdida simulada; protecciones y retención probadas; documentación de reconstrucción de Vercel; guía y memoria LaTeX.

Pendiente: instalar y supervisar la tarea cron; guardar copias cifradas fuera del portátil; probar recuperación de Auth/usuarios y Storage por separado. La plantilla cron está preparada, pero no se ha instalado ninguna tarea periódica.

La memoria LaTeX está entregada como fuente, con los resultados incluidos. No se ha compilado porque este entorno no dispone de un motor LaTeX. Puede subirse `memoria.tex` junto con `resultados.tex` a Overleaf y compilarse allí, o ejecutar `pdflatex memoria.tex` desde `docs/` en un equipo con LaTeX.

En Supabase solo se aplicó la configuración de lectura del rol `lector` autorizada por el usuario: modo de lectura por defecto, SELECT y políticas RLS del catálogo y lectura de sus secuencias. No se cambiaron registros, no se restauró sobre Supabase y no se modificó el despliegue activo de Vercel. La rama se presenta como PR en borrador para revisión, sin incorporarla a main.

## Evidencia del dump remoto y revisión de seguridad

La copia `backup-20261110t171653363116-8841a197-source` terminó a las 17:17:02 UTC. La restauración se verificó a las 17:18:39 UTC. La demostración posterior confirmó 0 plazas a las 17:19:16 UTC y volvió a verificar 13 plazas a las 17:19:19 UTC. Pasaron de nuevo las cinco protecciones de `selftest`, incluido el rollback tras un fallo SQL. Estos tiempos corresponden al 10 de noviembre de 2026, en UTC.

La revisión automática bloqueó inicialmente los permisos por falta de autorización específica. El usuario autorizó después el cambio y se aplicó la migración `configure_catalog_backup_lector`. La contraseña y la CA permanecen locales y excluidas de Git. El directorio de certificados se monta solo en el exportador.

El asesor de seguridad se ejecutó tras aplicar la configuración. Solo informó de [RLS activado sin políticas en public.usuarios](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), tabla que queda fuera del catálogo del laboratorio. No se modificó ese acceso ni se concedió acceso de Auth al rol lector.
