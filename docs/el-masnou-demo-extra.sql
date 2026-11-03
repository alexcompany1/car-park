-- Diez puntos de demostración; posiciones aproximadas, no plazas verificadas.
with ejemplos(id,direccion,latitud,longitud,estado) as (
 values
 ('EM-DEMO-005','Entorno de Carrer Itàlia · demo aproximada',41.48268,2.31587,'free'),
 ('EM-DEMO-006','Entorno de Carrer Itàlia · demo aproximada',41.48232,2.3162,'occupied'),
 ('EM-DEMO-007','Entorno de Edifici Centre · demo aproximada',41.48261,2.3164,'free'),
 ('EM-DEMO-008','Entorno de Mercat Vell · demo aproximada',41.47862,2.31612,'free'),
 ('EM-DEMO-009','Entorno de Mare de Déu de Lourdes · demo aproximada',41.4783,2.31648,'occupied'),
 ('EM-DEMO-010','Entorno de Mercat Vell · demo aproximada',41.47855,2.31665,'unknown'),
 ('EM-DEMO-011','Entorno de Bonaventura Bassegoda · demo aproximada',41.48078,2.31617,'free'),
 ('EM-DEMO-012','Entorno de Marcel·lina Monteys · demo aproximada',41.48043,2.31658,'offline'),
 ('EM-DEMO-013','Entorno de Flos i Calcat · demo aproximada',41.48196,2.3174,'free'),
 ('EM-DEMO-014','Entorno de Dones del Tèxtil · demo aproximada',41.48163,2.31696,'reserved')
)
insert into public.plazas(id,zona_id,codigo,direccion,latitud,longitud,estado_actual)
select e.id,z.id,e.id,e.direccion,e.latitud,e.longitud,e.estado
from ejemplos e cross join (select id from public.zonas where nombre='El Masnou (demo)' order by id limit 1) z
on conflict(id) do nothing
returning id;
