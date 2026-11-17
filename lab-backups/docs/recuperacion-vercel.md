# Reconstruir la web publicada

Vercel sirve la aplicación de Node.js y sus archivos web. Los datos persistentes están en Supabase. El laboratorio Docker reproduce la aplicación contra una copia del catálogo y permite comprobarla antes de proponer un nuevo despliegue.

## Qué hay que conservar

| Componente | Forma de recuperación |
| --- | --- |
| Código | Clon del repositorio y referencia a un commit revisado. Mantener una copia independiente del repositorio. |
| Dependencias | `package-lock.json` y `npm ci`. Las imágenes del laboratorio están fijadas por digest. |
| Configuración de Vercel | Proyecto `car-park`, Node.js 24, raíz del repositorio, integración con GitHub y rama de producción `main`. Registrar dominios y ajustes desde el panel. |
| Variables | Los nombres `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` están documentados. Guardar sus valores y cualquier secreto futuro en un gestor seguro accesible al equipo autorizado. |
| Catálogo | Copias PostgreSQL verificadas de las seis tablas de negocio. |
| Auth, usuarios y Storage | Recuperación específica de Supabase y del proveedor. No están contenidos en el dump reducido de este laboratorio. |
| OAuth | Registro de aplicaciones, callbacks y credenciales de Google, Microsoft y Apple, una vez configurados. |

El dominio observado de producción es `https://car-park-snowy.vercel.app`. También hay aliases propios de Vercel. Un dominio personalizado requeriría conservar sus registros DNS y permisos de administración.

## Procedimiento

1. Recuperar el repositorio y seleccionar el commit que se desea desplegar. Ejecutar sus pruebas.
2. Restaurar y verificar el catálogo en el laboratorio. Revisar aparte la recuperación de los componentes de Supabase que no cubre esta copia.
3. Crear o revisar el proyecto de Vercel con la integración GitHub. Usar la raíz que contiene `package.json` y la aplicación Express.
4. Introducir las variables necesarias mediante el panel o el gestor de secretos. Configurar los callbacks de Auth si se usan.
5. Crear un despliegue de prueba y comprobar `/health`, `/api/sitios` y el mapa. `/health` solo comprueba que el proceso responde.
6. Revisar el resultado y autorizar su paso a producción.

Este trabajo inspecciona Vercel sin cambiar el despliegue de producción. Docker no guarda un backup de la plataforma Vercel ni de sus permisos. Permite reconstruir y probar el código de la aplicación.
