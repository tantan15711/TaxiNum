# TaxiNum

TaxiNum es una app web movil para taxistas. El taxista entra con Google,
captura su nombre publico, foto, numero de cuenta/CLABE o dato de transferencia,
y genera un QR que lleva al cliente a una pagina publica para copiar ese numero.

## Stack

- Next.js + React + TypeScript
- Supabase Auth con Google
- Supabase Postgres + Row Level Security
- Supabase Storage para fotos de perfil
- QR descargable en PNG y PDF

## Desarrollo

```bash
npm install
npm run dev
npm run build
```

La app ya trae configurado el proyecto publico de Supabase. Las variables de
entorno siguen disponibles para sobreescribir el proyecto desde Vercel o local.

## Supabase

1. Ejecuta `supabase/schema.sql` en el SQL editor de tu proyecto Supabase.
2. En Authentication > Providers, activa Google.
3. Agrega el redirect URL de tu sitio en Supabase.
4. Crea `.env.local` con:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://zruhqmpfpihdyebrjqef.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_4ZEWx37JbaENJ3JlZmGi_Q_4torUIOo
```

El QR apunta a `/t/[slug]`. Esa pagina publica consulta una vista limitada para
mostrar solo nombre, foto, numero de transferencia y telefono cuando el taxista
decide hacerlo visible.

## Deploy en Vercel

1. Sube este repositorio a GitHub.
2. En Vercel, importa el repositorio.
3. Usa los defaults de Next.js:
   - Build Command: `npm run build`
   - Install Command: `npm install`
   - Output Directory: no configurar
4. En Supabase Authentication, agrega estos redirect URLs:
   - `http://localhost:3000`
   - `https://TU-DOMINIO-DE-VERCEL.vercel.app`

La API URL que usa el SDK debe ser la base del proyecto:
`https://zruhqmpfpihdyebrjqef.supabase.co`. No uses `/rest/v1/` en
`NEXT_PUBLIC_SUPABASE_URL`.
