# Inicio de sesión de CarPark

El mapa sigue disponible sin cuenta. La web ofrece los proveedores que Supabase tiene habilitados. Los favoritos siguen guardados en el navegador.

1. Registra la aplicación web en Google Cloud, Microsoft Entra ID y Apple Developer. Usa en cada proveedor la URL de callback que muestra Supabase Auth.
2. En Supabase, entra en Authentication → Sign In / Providers. Configura y activa los proveedores con sus credenciales. Guarda los secretos en el panel de Supabase.
3. En Authentication → URL Configuration, configura el sitio publicado y permite las URLs de vuelta que use el equipo, como `https://car-park-snowy.vercel.app/` y `http://localhost:3000/`.
4. Prueba cada botón con una cuenta autorizada. Comprueba que la sesión sigue activa al recargar, que se puede cerrar y que el mapa sigue accesible sin cuenta.

[Google](https://supabase.com/docs/guides/auth/social-sign-in/auth-google) · [Microsoft](https://supabase.com/docs/guides/auth/social-sign-in/auth-azure) · [Apple](https://supabase.com/docs/guides/auth/social-sign-in/auth-apple)
