# Seznam technologií projektu Destinote

## Frontend Framework a Runtime

- **Next.js** 16.1.1 - React framework s App Router, server-side rendering a API routes
- **React** 19.1.0 - UI knihovna
- **React DOM** 19.1.0 - React renderer pro web
- **TypeScript** 5.x - Typovaný JavaScript
- **Node.js** 22.15.1 - Runtime prostředí (v Docker kontejneru)

## Styling a UI

- **Tailwind CSS** 4.x - Utility-first CSS framework
- **PostCSS** - CSS post-processor
- **Framer Motion** 12.24.0 - Knihovna pro animace
- **Lottie React** 2.4.1 - Animace z JSON souborů
- **React Icons** 5.5.0 - Ikony
- **Flag Icons** 7.5.0 - Vlajky zemí
- **clsx** 2.1.1 - Utility pro podmíněné CSS třídy
- **tailwind-merge** 3.3.1 - Merge utility pro Tailwind třídy

## Backend a Databáze

- **Supabase** - Backend-as-a-Service platforma
  - **@supabase/supabase-js** 2.74.0 - JavaScript klient
  - **@supabase/ssr** 0.7.0 - Server-side rendering podpora
  - **PostgreSQL** - Relační databáze (hostovaná na Supabase)
  - **Supabase Auth** - Autentifikace uživatelů
  - **Supabase Storage** - Ukládání souborů

## Mapy a Geografické služby

- **MapLibre GL** 5.15.0 - Open-source mapová knihovna
- **MapTiler SDK** 3.9.0 - Mapové služby a tile servery
- **GeoJSON** - Formát pro geografická data

## Cloud Services a API

- **Cloudinary** (next-cloudinary 6.16.0) - Správa a optimalizace obrázků
- **OpenAI** 6.14.0 - AI API pro generování průvodců zeměmi
- **Travelpayouts API** - API pro vyhledávání letenek (Aviasales)
- **Kiwi.com API** - API pro vyhledávání letenek

## Utility knihovny

- **slugify** 1.6.6 - Generování URL-friendly textů
- **i18n-iso-countries** 7.14.0 - ISO kódy zemí a lokalizace
- **dotenv** 17.2.3 - Načítání environment proměnných

## Vývojové nástroje

- **ESLint** 9.x - Linter pro JavaScript/TypeScript
- **eslint-config-next** 16.1.1 - ESLint konfigurace pro Next.js
- **tsx** 4.19.2 - TypeScript executor
- **TypeScript typy:**
  - @types/node 20.x
  - @types/react 19.2.7
  - @types/react-dom 19.2.3
  - @types/geojson 7946.0.16

## Deployment a Containerizace

- **Docker** - Containerizace aplikace
- **Docker Compose** - Orchestrace kontejnerů
- **Alpine Linux** - Minimální Linux distribuce pro Docker image
- **pnpm** 10.15.0 - Package manager

## Build a Development

- **Turbopack** - Next.js bundler (používán v dev módu)
- **Standalone output** - Next.js standalone build pro Docker

## Architektura

- **App Router** - Next.js 13+ routing systém
- **Server Components** - React Server Components
- **API Routes** - Next.js API endpoints
- **Server Actions** - Server-side funkce (pokud použity)

## Externí integrace

- **Google OAuth** - Přihlašování přes Google (lh3.googleusercontent.com)
- **Supabase CDN** - Content delivery network pro Supabase assets
- **Cloudinary CDN** - Content delivery network pro obrázky (res.cloudinary.com)
- **Pravatar** - Placeholder avatary (i.pravatar.cc)

## Formátování a konvence

- **ES2017** - JavaScript target verze
- **ES Modules** - Modulární systém
- **JSX** - React syntax extension
- **Strict mode** - TypeScript strict režim
