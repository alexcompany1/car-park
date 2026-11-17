# Estacionamientos reales en El Masnou

Actualización: 03/11/2026.

## Fuente y alcance

Se importaron 13 tramos de zona blava en superficie del Google My Maps enlazado
por SUMEM, empresa municipal. Se excluyó el polígono de un aparcamiento soterrado.
No es un inventario de plazas individuales ni una comprobación en calle actual.
La existencia y geometría corresponden al mapa publicado; no se conoce el número
de plazas ni la ocupación actual de cada tramo.

Página municipal de referencia:
https://www.sumemelmasnou.cat/ca/serveis/zones-regulades/zona-blava-
Mapa enlazado:
https://www.google.com/maps/d/viewer?mid=1kat7R6rgPvW5CaKGRf9cbbzaefyLxbc
Exportación KML consultada:
https://www.google.com/maps/d/kml?mid=1kat7R6rgPvW5CaKGRf9cbbzaefyLxbc&forcekml=1

Calles y ámbitos: Puerto Rico, Pere Grau, Sant Felip, Mestres Villà,
Sant Miquel, Pintor Domènech, Joan Maragall, Torrent de Can Gaio,
Plaça Ocata, Sant Miquel/Primer de Maig, Amadeu I, Navarra y Romà Fabra.
Se conserva el nombre publicado por la fuente.

## Base de datos

La tabla plazas contiene ahora 13 registros EM-ZB-... en la zona
El Masnou - zona blava. Cada registro representa un tramo, no una plaza.
La dirección guarda el nombre del tramo y el punto se calcula a mitad de
recorrido de la línea del KML. La línea completa se conserva en
src/data/tramos-el-masnou.json y la API la incorpora como geometria.
Todos tienen estado_actual=unknown y ultima_actualizacion=null.
No se inventa disponibilidad ni una hora de medición.
La zona contiene tarifa ordinaria 1.25 y tiempo máximo 120 según la página
consultada. No se muestran como tarifa universal: existen condiciones y
bonificaciones para residentes y tipos de vehículo.

Se retiraron 34 plazas de prueba (20 CP-... y 14 EM-DEMO-...), sus seis zonas
sin plazas restantes, 10 dispositivos simulados y 20 entradas de historial
asociadas. La operación se ejecutó dentro de una transacción.
No se modificaron el esquema ni los permisos de Supabase.
El SQL ejecutado está en importar-tramos-reales-el-masnou.sql.

Antes se guardó una copia local recuperable en:
backups/antes-ubicaciones-reales-2026-11-03/datos.json
backups/antes-ubicaciones-reales-2026-11-03/restaurar.sql
La carpeta backups está excluida de GitHub. Restaurar añade los datos
anteriores sin borrar los tramos nuevos y evita duplicar identificadores.

## API y web

GET /api/sitios devuelve todos los registros.
GET /api/sitios?zona=El%20Masnou%20-%20zona%20blava filtra los tramos.
La respuesta conserva id, estado, mensaje, direccion, latitud, longitud,
zona y ultima_actualizacion, y añade nombre, tipo_ubicacion=tramo,
fuente_url y geometria para los tramos del catálogo.
La web muestra nombres reales, líneas del KML y ocupación desconocida.
Cómo llegar apunta al punto representativo del tramo, no a una plaza reservada.
Para identificar plazas individuales y medir ocupación hace falta una fuente
más detallada y conectar los sensores o el simulador explícitamente.
