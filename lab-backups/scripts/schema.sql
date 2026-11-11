-- Modelo del catálogo consultado en Supabase el 10 de noviembre de 2026.
-- Este esquema reducido pertenece al laboratorio. No incluye Auth ni Storage.
CREATE TABLE public.ciudades (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 nombre text NOT NULL UNIQUE CHECK (btrim(nombre) <> '')
);
CREATE TABLE public.direcciones (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 ciudad_id bigint NOT NULL REFERENCES public.ciudades(id),
 nombre text NOT NULL CHECK (btrim(nombre) <> ''),
 UNIQUE (ciudad_id, nombre)
);
CREATE TABLE public.zonas (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 nombre varchar NOT NULL,
 tipo_aparcamiento varchar NOT NULL,
 tarifa numeric NOT NULL CHECK (tarifa >= 0),
 tiempo_maximo integer CHECK (tiempo_maximo IS NULL OR tiempo_maximo > 0)
);
CREATE TABLE public.plazas (
 id varchar PRIMARY KEY,
 zona_id bigint NOT NULL REFERENCES public.zonas(id),
 codigo varchar NOT NULL UNIQUE,
 latitud numeric NOT NULL CHECK (latitud BETWEEN -90 AND 90),
 longitud numeric NOT NULL CHECK (longitud BETWEEN -180 AND 180),
 estado_actual varchar NOT NULL CHECK (estado_actual IN ('free','occupied','unknown','reserved','offline')),
 ultima_actualizacion timestamptz,
 direccion_id bigint NOT NULL REFERENCES public.direcciones(id)
);
CREATE TABLE public.dispositivos (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 plaza_id varchar NOT NULL REFERENCES public.plazas(id),
 tipo_sensor varchar NOT NULL,
 identificador varchar NOT NULL UNIQUE,
 estado_conexion varchar NOT NULL CHECK (estado_conexion IN ('online','offline')),
 ultima_comunicacion timestamptz,
 UNIQUE (id, plaza_id)
);
CREATE TABLE public.historico_ocupacion (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 plaza_id varchar NOT NULL REFERENCES public.plazas(id),
 dispositivo_id bigint NOT NULL,
 ocupada boolean NOT NULL,
 fecha_hora timestamptz NOT NULL,
 FOREIGN KEY (dispositivo_id, plaza_id) REFERENCES public.dispositivos(id, plaza_id)
);
CREATE INDEX ON public.direcciones(ciudad_id);
CREATE INDEX ON public.plazas(direccion_id);
CREATE INDEX ON public.plazas(zona_id);
CREATE INDEX ON public.dispositivos(plaza_id);
CREATE INDEX ON public.historico_ocupacion(plaza_id, fecha_hora);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['ciudades','direcciones','zonas','plazas','dispositivos','historico_ocupacion'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY consultar ON public.%I FOR SELECT TO anon, authenticated USING (true)',t);
 END LOOP;
END $$;
