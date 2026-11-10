-- Mantiene la consulta direccion de la versión publicada de la API.
DO $$ BEGIN
 IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='plazas' AND column_name='direccion_id')
    AND NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='plazas' AND column_name='direccion') THEN
  EXECUTE 'CREATE OR REPLACE FUNCTION public.direccion(public.plazas) RETURNS text LANGUAGE sql STABLE SECURITY INVOKER SET search_path='''' AS $f$ SELECT nombre FROM public.direcciones WHERE id=$1.direccion_id $f$';
  REVOKE EXECUTE ON FUNCTION public.direccion(public.plazas) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.direccion(public.plazas) TO anon, authenticated;
 END IF;
END $$;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.ciudades, public.direcciones, public.zonas, public.plazas, public.dispositivos, public.historico_ocupacion TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
