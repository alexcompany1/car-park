# Laboratorio de backups y recuperación de CarPark

El laboratorio levanta PostgreSQL 17, PostgREST, una pasarela Nginx y una instancia de la web y la API de Express. Permite guardar el catálogo en formato `pg_dump`, perder sus datos de forma controlada y comprobar su recuperación mediante la API.

El alcance son seis tablas de negocio. Las cuentas de Supabase Auth, `usuarios`, Storage, las claves de OAuth y la configuración de Vercel requieren procedimientos separados. Una copia de este laboratorio no representa una copia completa de Supabase.

## Arranque

Necesitas Docker Engine o Docker Desktop con Compose, Python 3 y conexión para descargar las imágenes e instalar las dependencias de la aplicación. La base de datos original utiliza PostgreSQL 17.11. Los clientes y el servidor de laboratorio usan la misma versión principal y la imagen está fijada por digest.

Desde la raíz de esta rama:

```bash
./lab-backups/scripts/lab.sh configure
./lab-backups/scripts/lab.sh up
```

Con Docker Desktop para Linux, si tu contexto predeterminado no funciona:

```bash
export CARPARK_DOCKER_CONTEXT=desktop-linux
./lab-backups/scripts/lab.sh up
```

Abre <http://localhost:3101/> y <http://localhost:3101/api/sitios>. El primer arranque normal carga tres registros ficticios. El puerto de la API solo escucha en la interfaz local del portátil. PostgreSQL y PostgREST no publican puertos.

`configure` crea `.env` y las credenciales exclusivas de este laboratorio en `.local/`. Conserva ambos junto con el volumen PostgreSQL. Volver a ejecutarlo mantiene las credenciales existentes. No copies aquí el `.env` de producción.

## Demostración completa

```bash
./lab-backups/scripts/lab.sh demo
```

El comando arranca el entorno, crea una copia, comprueba sus datos, borra solo las plazas y sus lecturas del laboratorio, confirma que la API devuelve una lista vacía, restaura y compara las seis tablas y sus relaciones. También prueba el rechazo de una copia corrupta, de rutas ajenas a `backups/` y la reversión de una restauración interrumpida.

Las copias se guardan en `backups/backup-.../`. Cada carpeta contiene `archive.dump` y `manifest.json`. El manifiesto guarda SHA-256, columnas, recuentos y huellas de las filas de la propia instantánea del dump. Los logs completos están en `logs/`.

## Operaciones por separado

```bash
./lab-backups/scripts/lab.sh backup-local
./lab-backups/scripts/lab.sh verify
./lab-backups/scripts/lab.sh simulate-loss --confirm CARPARK_LAB_ONLY
./lab-backups/scripts/lab.sh restore
./lab-backups/scripts/lab.sh verify
./lab-backups/scripts/lab.sh selftest
./lab-backups/scripts/lab.sh status
./lab-backups/scripts/lab.sh stop
```

`restore` y `verify` aceptan el nombre exacto de una carpeta `backup-*`. Sin nombre usan la última copia completa. El script rechaza rutas con `/`, enlaces simbólicos y copias sin manifiesto válido. `stop` conserva el volumen y los backups.

## Copia del catálogo desde Supabase

Edita localmente `.local/source-service.conf`. Obtén el host y el usuario del apartado **Connect** de Supabase. Usa la conexión directa o el pooler de sesión, normalmente en el puerto 5432. Para entornos sin IPv6 suele hacer falta el pooler de sesión. Completa la contraseña exclusivamente en ese archivo. La clave publicable de la API no sirve para `pg_dump`.

Se recomienda un usuario PostgreSQL dedicado que pueda leer las seis tablas, secuencias y las filas permitidas por RLS. Su creación y concesión de permisos debe revisarse aparte en Supabase. El script solicita una sesión de solo lectura y verifica TLS y la versión 17 antes de exportar. `--enable-row-security` respeta lo que el usuario de origen puede leer, por lo que el alcance real depende de sus permisos.

En Session pooler, un rol llamado `lector` se conecta como `lector.REFERENCIA_DEL_PROYECTO`, con su propia contraseña. Los permisos SQL se conceden a `lector`, sin ese sufijo. El archivo [source-reader.sql](scripts/source-reader.sql) configura lectura del catálogo con RLS y el modo de solo lectura por defecto. Se aplicó con autorización en este proyecto; en otros entornos requiere revisión del administrador y `lab.sh` no lo aplica. El pooler no propagó la opción de sesión enviada mediante `PGOPTIONS` durante el ensayo, por eso el exportador comprueba también el valor efectivo y cancela si está desactivado. El modo por defecto no sustituye a los permisos: el rol tampoco debe tener privilegios de escritura.

Para verificar el certificado del servidor, descarga la CA desde **Database settings → SSL → Download certificate** y guárdala en `.local/certificates/supabase-ca.crt`. El enlace que utiliza el panel oficial también permite descargarla desde la raíz del repositorio:

```bash
curl --fail --location --proto '=https' https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt -o lab-backups/.local/certificates/supabase-ca.crt
```

Mantén `sslmode=verify-full` y pon `sslrootcert=/certificates/supabase-ca.crt` en `source-service.conf`: esta es la ruta dentro del contenedor. Solo el exportador recibe esa carpeta de certificados. La descarga, la conexión con TLS verificado y la exportación remota mediante `lector` se probaron. El dump se restauró en Docker y se verificaron sus 13 plazas, las seis tablas y sus seis relaciones. El rol `lector` se crea sin login en el laboratorio para que se puedan restaurar las políticas que lo nombran.

```bash
./lab-backups/scripts/lab.sh backup-source
./lab-backups/scripts/lab.sh restore
./lab-backups/scripts/lab.sh verify
```

La conexión remota se monta únicamente en `backup-source`. Ese servicio tiene salida a Internet y no recibe las credenciales administrativas del laboratorio. Los servicios que restauran solo disponen de la red interna y del destino fijo `db/carpark_lab`.

## Instantánea del catálogo obtenida por el conector

Si se dispone de una instantánea válida, debe guardarse localmente en `.local/source-snapshot.json` para cargarla en un laboratorio vacío. `configure` crea un archivo vacío de ejemplo si aún no existe; ese ejemplo no contiene datos para importar:

```bash
./lab-backups/scripts/lab.sh configure
./lab-backups/scripts/lab.sh import-snapshot
./lab-backups/scripts/lab.sh demo
```

Esta instantánea JSON contiene datos leídos de Supabase y se carga sobre el esquema reducido de `scripts/schema.sql`. No es un dump SQL del servidor original. Sirve para ensayar la recuperación con el catálogo real cuando falta la conexión PostgreSQL. El primer `import-snapshot` exige un catálogo vacío y no sobrescribe tablas existentes.

## Seguridad y recuperación

- Las escrituras usan una conexión fija a `db`, el nombre `carpark_lab`, una marca en la base de datos y un identificador aleatorio de la instancia. No aceptan una URL de destino.
- La restauración se hace en una transacción. Si falla un comando, PostgreSQL revierte la operación.
- El bloqueo de archivos evita que dos operaciones compitan por las copias. Los backups incompletos usan un nombre temporal y solo se publican al terminar.
- La retención conserva siete copias válidas por origen, configurable con `KEEP_BACKUPS`. Se aplica después de una copia exitosa. Las carpetas incompletas o corruptas quedan para revisión manual.
- `.local/`, `.env`, `backups/` y `logs/` están excluidos de Git. El contexto de construcción del backend solo incluye los archivos que necesita.
- Las credenciales se montan como secretos de Compose. `.local/` tiene permisos 0700 en el host. Algunos archivos internos tienen modo 0444 para que los lean los usuarios de los contenedores, protegidos en el host por el directorio privado.
- Las copias locales están sin cifrar y heredan la protección del directorio. Una copia fuera del portátil debe cifrarse y guardarse con acceso restringido. SHA-256 detecta daños, pero no autentica una copia frente a un atacante que también pueda cambiar el manifiesto.

El volumen PostgreSQL y las copias están en el mismo portátil. Para cubrir una avería del disco hace falta una copia cifrada en otro soporte y una prueba de recuperación desde ese soporte.

## Documentación

- [Infraestructura y arquitectura](docs/arquitectura.md)
- [Resultados y evidencias](docs/resultados.md)
- [Reconstrucción de Vercel](docs/recuperacion-vercel.md)
- [Automatización con cron](docs/cron.example)
- [Memoria LaTeX y preguntas del profesor](docs/memoria.tex)
