# Modelo visual de Pau

Se integra sobre main conservando Express, Supabase, los tramos, el laboratorio
Docker y el simulador previo del equipo. Las copias antiguas de la rama pau se
conservan como archivos históricos; no sustituyen las rutas ni las pruebas de main.

- Página activa: CarPark-FUNCIONA/index.html. index.html de la raíz contiene la
  misma página para la entrada estática de Vercel.
- Se reutiliza la portada WebP que main ya tenía, sin imágenes base64 duplicadas.
- Marcadores P con distintivo verde/rojo, selección y detalle; sin líneas.
- Cuatro contadores, tarjetas, filtros y registro de los últimos seis cambios.
- Datos del proyecto: consultas secuenciales cada 5 segundos a /api/sitios.
  Al fallar una consulta no se anuncia disponibilidad previa como confirmada.
- Demo visual: simulación en el navegador, identificada y separada de la API.
  Cambiar de modo cancela las peticiones para evitar mezclar estados.
- CarPark-MQTT-Local conserva el simulador, el servidor MQTT/SSE y sus pruebas.
  No cambia el contrato ni las dependencias del backend de main. Su listener MQTT
  usa carpark/elmasnou/tramos/+/estado y los IDs reales. El simulador previo en
  simulador-mqtt sigue disponible con su propio contrato.

La página publicada no recibe MQTT directamente: muestra lo que devuelve la API.
Para MQTT de extremo a extremo en local se usa CarPark-MQTT-Local. El pipeline
MQTT -> Supabase del backend de producción sigue dependiendo de su integración.
No se ha modificado la base de datos ni se han añadido credenciales.

Pruebas: npm ci y npm test en la raíz. En CarPark-MQTT-Local: npm ci y npm test.
