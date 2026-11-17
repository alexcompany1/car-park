-- Script histórico de la importación inicial, anterior a ciudades y direcciones. No ejecutar sobre el esquema actual.
begin;
delete from public.historico_ocupacion where plaza_id in ('CP-001','CP-002','CP-003','CP-004','CP-005','CP-006','CP-007','CP-008','CP-009','CP-010','CP-011','CP-012','CP-013','CP-014','CP-015','CP-016','CP-017','CP-018','CP-019','CP-020','EM-DEMO-001','EM-DEMO-002','EM-DEMO-003','EM-DEMO-004','EM-DEMO-005','EM-DEMO-006','EM-DEMO-007','EM-DEMO-008','EM-DEMO-009','EM-DEMO-010','EM-DEMO-011','EM-DEMO-012','EM-DEMO-013','EM-DEMO-014');
delete from public.dispositivos where plaza_id in ('CP-001','CP-002','CP-003','CP-004','CP-005','CP-006','CP-007','CP-008','CP-009','CP-010','CP-011','CP-012','CP-013','CP-014','CP-015','CP-016','CP-017','CP-018','CP-019','CP-020','EM-DEMO-001','EM-DEMO-002','EM-DEMO-003','EM-DEMO-004','EM-DEMO-005','EM-DEMO-006','EM-DEMO-007','EM-DEMO-008','EM-DEMO-009','EM-DEMO-010','EM-DEMO-011','EM-DEMO-012','EM-DEMO-013','EM-DEMO-014');
-- Solo se eliminan los identificadores de prueba que existían en la copia guardada.
delete from public.plazas where id in ('CP-001','CP-002','CP-003','CP-004','CP-005','CP-006','CP-007','CP-008','CP-009','CP-010','CP-011','CP-012','CP-013','CP-014','CP-015','CP-016','CP-017','CP-018','CP-019','CP-020','EM-DEMO-001','EM-DEMO-002','EM-DEMO-003','EM-DEMO-004','EM-DEMO-005','EM-DEMO-006','EM-DEMO-007','EM-DEMO-008','EM-DEMO-009','EM-DEMO-010','EM-DEMO-011','EM-DEMO-012','EM-DEMO-013','EM-DEMO-014');
insert into public.zonas(nombre,tipo_aparcamiento,tarifa,tiempo_maximo)
select 'El Masnou - zona blava','blue',1.25,120
where not exists (select 1 from public.zonas where nombre='El Masnou - zona blava');
with tramos(id,nombre,latitud,longitud) as (values
('EM-ZB-PUERTO-RICO','Zona blava carrer Puerto Rico',41.4814846,2.3282595),
('EM-ZB-PERE-GRAU','Zona blava carrer Pere Grau',41.4802024,2.32165),
('EM-ZB-SANT-FELIP','Zona blava carrer St Felip',41.4803406,2.3207552),
('EM-ZB-MESTRES-VILLA','Zona blava carrer Mestres Villà',41.4803813,2.3194533),
('EM-ZB-SANT-MIQUEL','Zona blava carrer St Miquel',41.4810886,2.3175382),
('EM-ZB-PINTOR-DOMENEC','Zona blava carrer Pintor Domènech',41.4825414,2.3191099),
('EM-ZB-JOAN-MARAGALL','Zona blava Joan Maragall',41.4810614,2.3269911),
('EM-ZB-CAN-GAIO','Zona blava Torrent de Can Gaio',41.4833113,2.3285279),
('EM-ZB-PLACA-OCATA','Zona blava Plaça Ocata',41.4811754,2.3222569),
('EM-ZB-PRIMER-MAIG','Zona blava St. Miquel/Primer de Maig',41.4793594,2.3111204),
('EM-ZB-AMADEU-I','Zona blava Amadeu I',41.4791264,2.3052817),
('EM-ZB-NAVARRA','Zona blava carrer Navarra',41.4813652,2.3174688),
('EM-ZB-ROMA-FABRA','Zona blava carrer Romà Fabra',41.4814343,2.3159564)
)
insert into public.plazas(id,zona_id,codigo,direccion,latitud,longitud,estado_actual,ultima_actualizacion)
select t.id,z.id,t.id,t.nombre,t.latitud,t.longitud,'unknown',null
from tramos t cross join (select id from public.zonas where nombre='El Masnou - zona blava' order by id limit 1) z;
delete from public.zonas z where z.id in (1,2,3,4,5,6) and not exists (select 1 from public.plazas p where p.zona_id=z.id);
commit;
