# Prueba de El Masnou (03/11/2026)

La web CarPark-FUNCIONA utiliza Leaflet 1.9.4 y OpenStreetMap para mostrar calles
reales. Se conserva la atribución de OpenStreetMap y se necesita Internet.
La consulta es GET /api/sitios?zona=El%20Masnou%20(demo).
Sin el filtro, la API sigue devolviendo todas las plazas.

Se añadieron cuatro registros EM-DEMO-001 a EM-DEMO-004 a public.plazas y la
zona El Masnou (demo). Se conservaron las 20 plazas y cinco zonas anteriores.
No se modificó el esquema ni los permisos de Supabase.
Los estados free, occupied, unknown y reserved son ejemplos elegidos para
probar la interfaz: no indican la disponibilidad de los aparcamientos reales.
La tarifa 0 de la zona demo es un valor técnico de prueba, no una tarifa real.

Los puntos son referencias de equipamientos, no posiciones de plazas
individuales. Las coordenadas se obtuvieron de los destinos de los enlaces
de Google Maps publicados por SUMEM en su página oficial:
https://www.sumemelmasnou.cat/ca/serveis/aparcaments-soterrats-municipals

- Edifici Centre: Carrer Itàlia, 50; 41.4824948, 2.3160770.
  https://goo.gl/maps/WV9sGB7SWVRMxQpu7
- Mercat Vell: Carrer Mare de Déu de Lourdes, 6; 41.4784440, 2.3163141.
  https://goo.gl/maps/NbfqhANUMC4PFum76
- Marcel·lina Monteys: entrada por Bonaventura Bassegoda; 41.4805947, 2.3163827.
  https://goo.gl/maps/99wcPXZGGNfGeF6d8
- Dones del Tèxtil: Carrer Flos i Calcat, 10; 41.4818043, 2.3171815.
  https://goo.gl/maps/nwHyWrFFA2FytkSh6

El fichero el-masnou-demo.sql documenta la inserción ejecutada y permite
repetirla sin duplicar esos identificadores. No cambia estados ya existentes.
Para probar, npm start y abrir localhost:3000. Durante la revisión se utilizó
localhost:3001 para no interferir con otro servidor local.

Pendiente: identificar plazas individuales reales con datos autorizados,
conectar el simulador MQTT y subir los cambios a GitHub cuando se solicite.


## Diez puntos adicionales
Se añadieron EM-DEMO-005 a EM-DEMO-014 a la misma zona. Ahora hay 14 puntos.
Sus coordenadas son desplazamientos aproximados alrededor de los cuatro
aparcamientos de referencia. No representan plazas individuales verificadas
ni ubicaciones geográficas obtenidas de una fuente oficial. La dirección
incluye demo aproximada y sus estados son ficticios.
La inserción está documentada en el-masnou-demo-extra.sql; se conservan las
20 plazas anteriores de Barcelona y los cuatro puntos iniciales del Masnou.
