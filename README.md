# TaxiNum

TaxiNum es una app web movil para taxistas. El taxista entra con Google,
captura su nombre publico, foto, numero de cuenta/CLABE o dato de transferencia,
y genera un QR que lleva al cliente a una pagina publica para copiar ese numero.

## Stack

- Next/Vinext + React + TypeScript
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

La app funciona en modo demo si no existen variables de Supabase. Para activar
Google real, crea `.env.local` usando `.env.example` como referencia.

## Supabase

1. Ejecuta `supabase/schema.sql` en el SQL editor de tu proyecto Supabase.
2. En Authentication > Providers, activa Google.
3. Agrega el redirect URL de tu sitio en Supabase.
4. Crea `.env.local` con:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

El QR apunta a `/t/[slug]`. Esa pagina publica consulta una vista limitada para
mostrar solo nombre, foto, numero de transferencia y telefono cuando el taxista
decide hacerlo visible.

