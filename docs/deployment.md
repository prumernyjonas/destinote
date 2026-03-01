# Nasazení (Deployment) – Destinote

## Požadavky

- Node.js 22+
- Všechny environment proměnné (viz [.env.example](../.env.example) v kořeni projektu)

## Lokální build a produkční režim

```bash
# Instalace závislostí
npm ci

# Build (vytvoří výstup v .next/standalone)
npm run build

# Spuštění v produkčním režimu
npm run start
```

Aplikace běží na [http://localhost:3000](http://localhost:3000).

## Docker

Projekt obsahuje multi-stage Dockerfile a `compose.yaml`.

### Jak nahrát aktuální verzi projektu do Dockeru

V kořeni projektu (s aktuálním kódem a vyplněným `.env.local`) spusťte:

```bash
# Build potřebuje NEXT_PUBLIC_* z .env.local – předáme je přes --env-file
docker compose --env-file .env.local up -d --build
```

Bez `--env-file .env.local` by build padl (Next.js při prerenderu potřebuje např. `NEXT_PUBLIC_SUPABASE_URL`).

Jen sestavit image bez spuštění:

```bash
docker compose --env-file .env.local build
```

Spustit už sestavený kontejner:

```bash
docker compose up -d
```

Aplikace pak běží na [http://localhost:3000](http://localhost:3000).

**Chcete-li jen image pojmenovat a spustit bez Compose:**

```bash
docker build -t destinote --build-arg NEXT_PUBLIC_SUPABASE_URL="..." --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="..." --build-arg NEXT_PUBLIC_SITE_URL="..." .
docker run -p 3000:3000 --env-file .env.local destinote
```

---

V `compose.yaml` nastavte env soubor a proměnné podle prostředí. Pro produkci nepoužívejte `.env.local` s citlivými údaji v repozitáři – použijte secrets nebo env z hostingového prostředí.

## Environment proměnné

Seznam všech proměnných je v [.env.example](../.env.example). Pro produkci nezapomeňte:

- **NEXT_PUBLIC_SITE_URL** – nastavit na kanonickou URL aplikace (např. `https://destinote.cz`), jinak OAuth callback a odkazy v e-mailech nebudou fungovat správně.
- **Debug endpoint** – `/api/debug/env` je v produkci automaticky vrácen jako 404 (nepřístupný).

## Doporučení pro produkci

1. **Build** – před deployem vždy spusťte `npm run build` a ověřte, že nepadá (TypeScript chyby jsou zapnuté).
2. **Secrets** – API klíče (Supabase service role, Cloudinary, OpenAI, Travelpayouts, Kiwi) nikdy necommitujte; používejte env proměnné z Vercel / Railway / vlastního serveru.
3. **Standalone výstup** – `next.config.ts` má `output: "standalone"`, takže výstup v `.next/standalone` lze zkopírovat na server bez celého `node_modules`.

## Vercel

Pro deploy na Vercel přidejte env proměnné v dashboardu (Settings → Environment Variables). Build command: `npm run build`, Output directory ponechte výchozí. Vercel automaticky detekuje Next.js.
