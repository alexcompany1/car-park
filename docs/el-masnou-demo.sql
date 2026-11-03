with nueva_zona as (
  insert into public.zonas (nombre,tipo_aparcamiento,tarifa,tiempo_maximo)
  select 'El Masnou (demo)','demo',0,null
  where not exists (select 1 from public.zonas where nombre='El Masnou (demo)')
  returning id
), zona as (
  select id from nueva_zona
  union all select id from public.zonas where nombre='El Masnou (demo)'
), ejemplos(id,direccion,latitud,longitud,estado) as (
  values
  ('EM-DEMO-001','Carrer Itàlia, 50 · Edifici Centre (referencia)',41.4824948,2.3160770,'free'),
  ('EM-DEMO-002','Carrer Mare de Déu de Lourdes, 6 · Mercat Vell (referencia)',41.4784440,2.3163141,'occupied'),
  ('EM-DEMO-003','Carrer Bonaventura Bassegoda · Marcel·lina Monteys (referencia)',41.4805947,2.3163827,'unknown'),
  ('EM-DEMO-004','Carrer Flos i Calcat, 10 · Dones del Tèxtil (referencia)',41.4818043,2.3171815,'reserved')
)
insert into public.plazas(id,zona_id,codigo,direccion,latitud,longitud,estado_actual)
select e.id,z.id,e.id,e.direccion,e.latitud,e.longitud,e.estado
from ejemplos e cross join (select id from zona limit 1) z
on conflict (id) do nothing
returning id,direccion,latitud,longitud,estado_actual;
