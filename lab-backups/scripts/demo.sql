-- Datos ficticios, separados del catálogo real del proyecto.
INSERT INTO public.ciudades(nombre) VALUES ('Ciudad de laboratorio');
INSERT INTO public.direcciones(ciudad_id,nombre) VALUES (1,'Calle de ensayo 1'),(1,'Calle de ensayo 2'),(1,'Calle de ensayo 3');
-- Se conserva el nombre de zona que filtra la web. Los registros son ficticios.
INSERT INTO public.zonas(nombre,tipo_aparcamiento,tarifa,tiempo_maximo) VALUES ('El Masnou - zona blava','azul',1,120);
INSERT INTO public.plazas(id,zona_id,codigo,latitud,longitud,estado_actual,direccion_id) VALUES
 ('LAB-001',1,'LAB-001',41.48,2.31,'free',1),
 ('LAB-002',1,'LAB-002',41.481,2.311,'occupied',2),
 ('LAB-003',1,'LAB-003',41.482,2.312,'unknown',3);
INSERT INTO public.dispositivos(plaza_id,tipo_sensor,identificador,estado_conexion) VALUES ('LAB-001','simulado','LAB-SENSOR-001','online');
INSERT INTO public.historico_ocupacion(plaza_id,dispositivo_id,ocupada,fecha_hora) VALUES ('LAB-001',1,false,'2026-11-10T00:00:00Z');
