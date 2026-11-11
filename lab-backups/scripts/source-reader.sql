-- Configuración aplicada con autorización al rol lector en Supabase.
-- Referencia para revisión del administrador; no la ejecuta lab.sh.
-- Requiere el rol lector ya creado. No contiene contraseñas.
-- Limita la configuración a lectura del catálogo y sus secuencias.
ALTER ROLE lector SET default_transaction_read_only = on;
GRANT USAGE ON SCHEMA public TO lector;
DO $$ DECLARE t text; seq text; BEGIN
 FOREACH t IN ARRAY ARRAY['ciudades','direcciones','zonas','plazas','dispositivos','historico_ocupacion'] LOOP
  EXECUTE format('GRANT SELECT ON TABLE public.%I TO lector',t);
  IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname='carpark_backup_lector_select') THEN
   EXECUTE format('CREATE POLICY carpark_backup_lector_select ON public.%I FOR SELECT TO lector USING (true)',t);
  END IF;
  seq := pg_get_serial_sequence(format('public.%I',t),'id');
  IF seq IS NOT NULL THEN EXECUTE format('GRANT SELECT ON SEQUENCE %s TO lector',seq); END IF;
 END LOOP;
END $$;
