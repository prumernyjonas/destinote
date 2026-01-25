# Mapa kódu - Kde najít konkrétní funkce

Tento dokument vám pomůže rychle najít, kde jsou implementovány různé funkce v projektu. Ideální pro obhajobu!

---

## 🔐 AUTENTIFIKACE A REGISTRACE

### Přihlášení uživatele
**Kde:** `src/app/prihlaseni/page.tsx`
- **Co dělá:** Formulář pro přihlášení
- **Jak funguje:**
  1. Uživatel vyplní email a heslo
  2. Volá se `login()` z `useAuth` hooku (řádek 62)
  3. Hook volá `authUtils.login()` z `src/utils/supabase.ts` (řádek 143)
  4. Supabase ověří přihlašovací údaje
  5. Uživatel je přesměrován na dashboard

**Související soubory:**
- `src/hooks/useAuth.tsx` - Auth hook s login funkcí (řádek 249)
- `src/utils/supabase.ts` - Auth utility funkce (řádek 143)

### Registrace uživatele
**Kde:** `src/app/registrace/page.tsx`
- **Co dělá:** Formulář pro registraci
- **Jak funguje:**
  1. Uživatel vyplní email, heslo, přezdívku
  2. Kontrola dostupnosti emailu a přezdívky (řádky 194-230)
  3. Volá se `register()` z `useAuth` hooku (řádek 147)
  4. Vytvoří se účet v Supabase
  5. Odešle se email pro potvrzení

**Související soubory:**
- `src/hooks/useAuth.tsx` - Auth hook s register funkcí (řádek 291)
- `src/utils/supabase.ts` - Auth utility funkce

### OAuth přihlášení (Google)
**Kde:** `src/app/auth/callback/route.ts`
- **Co dělá:** Zpracovává OAuth callback po přihlášení přes Google
- **Jak funguje:**
  1. Google přesměruje na `/auth/callback?code=...`
  2. Vymění se kód za session (řádek 50)
  3. Vytvoří se nebo aktualizuje uživatel v databázi (řádek 90-120)
  4. Přesměruje se na dashboard

---

## 🗺️ INTERAKTIVNÍ MAPA

### Zobrazení mapy s navštívenými zeměmi
**Kde:** `src/components/DashboardPublicWorldMap.tsx`
- **Co dělá:** Zobrazuje interaktivní mapu světa s možností označit navštívené země
- **Jak funguje:**
  1. Načte GeoJSON data z `/countries-hd.json` (řádek 160)
  2. Vytvoří mapu pomocí MapTiler SDK (řádek 118)
  3. Načte navštívené země uživatele z API (řádek 222-250)
  4. Označí navštívené země zelenou barvou (řádek 280-310)
  5. Při kliknutí na zemi se zobrazí popup s tlačítkem (řádek 283)

**Klíčové funkce:**
- `setupLayersAndHandlers()` - nastavení mapy a vrstev (řádek 156)
- `onClick` - kliknutí na zemi (řádek 283)
- `saveVisit()` - uložení navštívené země (řádek 379-450)

**Související soubory:**
- `src/app/api/visited/country/route.ts` - API endpoint pro uložení navštívené země
- `src/app/api/visited/route.ts` - API endpoint pro načtení navštívených zemí

### Označení země jako navštívené
**Kde:** `src/components/guides/VisitedButton.tsx`
- **Co dělá:** Tlačítko na detailu země pro označení jako navštívené
- **Jak funguje:**
  1. Načte stav, jestli je země navštívená (řádek 45-89)
  2. Při kliknutí volá API `/api/visited/country` (řádek 91-178)
  3. Aktualizuje lokální stav

**Související soubory:**
- `src/app/api/visited/country/route.ts` - API endpoint (POST)

---

## 📝 ČLÁNKY

### Vytvoření nového článku
**Kde:** `src/app/dashboard/articles/new/page.tsx`
- **Co dělá:** Formulář pro vytvoření nového článku
- **Jak funguje:**
  1. Uživatel vyplní název, perex, obsah (řádky 8-32)
  2. Při odeslání se vytvoří článek přes API (řádek 115)
  3. Přesměruje se na editor článku (řádek 133)

**Související soubory:**
- `src/app/api/articles/route.ts` - API endpoint pro vytvoření článku (POST, řádek 49)

### Editace článku
**Kde:** `src/app/dashboard/articles/[id]/edit/page.tsx`
- **Co dělá:** Editor článku s možností úpravy textu, obrázků, fotek
- **Jak funguje:**
  1. Načte existující článek z API (řádek 85-150)
  2. Uživatel upraví obsah
  3. Uložení přes API `/api/articles/[id]` (PUT, řádek 700-750)
  4. Upload obrázků přes Cloudinary (řádek 400-500)

**Klíčové funkce:**
- `loadArticle()` - načtení článku (řádek 85)
- `handleSave()` - uložení změn (řádek 700)
- `handleGalleryFilesSelect()` - upload fotek (řádek 400)

**Související soubory:**
- `src/app/api/articles/[id]/route.ts` - API endpoint pro úpravu (PUT, řádek 146)
- `src/lib/articles/imageUtils.ts` - Utility pro práci s obrázky
- `src/components/articles/ArticleFormFields.tsx` - Formulářové pole

### Zobrazení článku
**Kde:** `src/app/clanek/[slug]/page.tsx`
- **Co dělá:** Zobrazuje detail článku
- **Jak funguje:**
  1. Načte článek podle slugu z API (řádek 74-100)
  2. Zobrazí obsah, obrázky, komentáře
  3. Zobrazí informace o autorovi

**Související soubory:**
- `src/app/api/articles/slug/[slug]/route.ts` - API endpoint pro článek podle slugu

### Seznam článků (Komunita)
**Kde:** `src/app/komunita/page.tsx`
- **Co dělá:** Zobrazuje feed všech článků
- **Jak funguje:**
  1. Načte články z API `/api/articles` (řádek 136-165)
  2. Filtruje podle země a vyhledávání (řádek 168-207)
  3. Zobrazí v mřížce s kartami

---

## 🌍 PRŮVODCE ZEMÍ

### Zobrazení průvodce země
**Kde:** `src/components/guides/CountryGuide.tsx`
- **Co dělá:** Zobrazuje kompletní průvodce země s informacemi, mapou, články
- **Jak funguje:**
  1. Načte uložený průvodce z databáze (řádek 1051)
  2. Načte informace o zemi z REST Countries API (řádek 987-1042)
  3. Načte články o zemi (řádek 937-985)
  4. Zobrazí mapu země, průvodce, statistiky

**Klíčové funkce:**
- `fetchStoredGuide()` - načtení průvodce z DB (řádek 1051)
- `fetchCountryInfo()` - načtení dat z REST Countries API (řádek 987)
- `fetchCountryArticles()` - načtení článků o zemi (řádek 937)

**Související soubory:**
- `src/app/zeme/[continent]/[country]/page.tsx` - Stránka detailu země
- `src/components/guides/CountryMap.tsx` - Mapa konkrétní země
- `src/lib/ai/generateGuides.ts` - Generování průvodců pomocí AI

### Mapa konkrétní země
**Kde:** `src/components/guides/CountryMap.tsx`
- **Co dělá:** Zobrazuje mapu s vyznačenou konkrétní zemí
- **Jak funguje:**
  1. Načte GeoJSON s všemi zeměmi (řádek 288)
  2. Filtruje a zvýrazní konkrétní zemi podle ISO2 kódu (řádek 329-352)

---

## 👤 PROFIL UŽIVATELE

### Zobrazení profilu
**Kde:** `src/app/profil/[nickname]/page.tsx`
- **Co dělá:** Zobrazuje veřejný profil uživatele
- **Jak funguje:**
  1. Načte uživatele podle přezdívky z API (řádek 65-100)
  2. Zobrazí statistiky, mapu navštívených zemí, články
  3. Možnost sledování uživatele

**Související soubory:**
- `src/app/api/users/[id]/route.ts` - API endpoint pro profil
- `src/components/profile/ProfileHero.tsx` - Hero sekce profilu
- `src/components/profile/ProfileStats.tsx` - Statistiky

### Sledování uživatele
**Kde:** `src/components/profile/FollowButton.tsx`
- **Co dělá:** Tlačítko pro sledování/odsledování uživatele
- **Jak funguje:**
  1. Při kliknutí volá API `/api/users/[id]/follow` (POST/DELETE)
  2. Aktualizuje lokální stav

**Související soubory:**
- `src/app/api/users/[id]/follow/route.ts` - API endpoint

---

## 🔍 VYHLEDÁVÁNÍ

### Vyhledávání
**Kde:** `src/app/hledat/page.tsx`
- **Co dělá:** Globální vyhledávání zemí a článků
- **Jak funguje:**
  1. Uživatel zadá dotaz
  2. Volá se API `/api/search?q=...` (řádek 45-100)
  3. Zobrazí se výsledky - země a články

**Související soubory:**
- `src/app/api/search/route.ts` - API endpoint pro vyhledávání

---

## 📊 DASHBOARD

### Hlavní dashboard
**Kde:** `src/app/dashboard/page.tsx` (pokud existuje, nebo přesměrování)
- **Co dělá:** Osobní centrum uživatele
- **Obsahuje:**
  - Mapa navštívených zemí (`DashboardPublicWorldMap`)
  - Seznam článků (`ArticlesList`)
  - Statistiky (`StatsCards`)
  - Odznaky (`BadgesGrid`)

**Související komponenty:**
- `src/components/dashboard/StatsCards.tsx` - Statistiky
- `src/components/dashboard/ArticlesList.tsx` - Seznam článků
- `src/components/dashboard/BadgesGrid.tsx` - Odznaky

---

## 🎯 ADMIN PANEL

### Správa článků
**Kde:** `src/app/admin/articles/page.tsx`
- **Co dělá:** Seznam článků čekajících na schválení
- **Jak funguje:**
  1. Načte články se statusem "pending" (řádek 50-80)
  2. Zobrazí v seznamu s možností schválit/zamítnout
  3. Při schválení volá `/api/admin/articles/[id]/approve` (řádek 100-150)

**Související soubory:**
- `src/app/api/admin/articles/[id]/approve/route.ts` - Schválení článku
- `src/app/api/admin/articles/[id]/reject/route.ts` - Zamítnutí článku
- `src/components/admin/ArticleReviewDrawer.tsx` - Drawer pro recenzi

---

## 🗄️ API ENDPOINTY - Přehled

### Články
- `GET /api/articles` - Seznam článků (`src/app/api/articles/route.ts`)
- `POST /api/articles` - Vytvoření článku (`src/app/api/articles/route.ts`)
- `GET /api/articles/[id]` - Detail článku (`src/app/api/articles/[id]/route.ts`)
- `PUT /api/articles/[id]` - Úprava článku (`src/app/api/articles/[id]/route.ts`)
- `POST /api/articles/[id]/submit` - Odeslání ke schválení (`src/app/api/articles/[id]/submit/route.ts`)
- `GET /api/articles/slug/[slug]` - Článek podle slugu (`src/app/api/articles/slug/[slug]/route.ts`)

### Uživatelé
- `GET /api/users/[id]` - Profil uživatele (`src/app/api/users/[id]/route.ts`)
- `POST /api/users/[id]/follow` - Sledování (`src/app/api/users/[id]/follow/route.ts`)
- `PUT /api/users/update-profile` - Aktualizace profilu (`src/app/api/users/update-profile/route.ts`)

### Země
- `GET /api/countries/list` - Seznam zemí (`src/app/api/countries/list/route.ts`)

### Navštívené země
- `GET /api/visited` - Seznam navštívených (`src/app/api/visited/route.ts`)
- `POST /api/visited/country` - Označit jako navštívené (`src/app/api/visited/country/route.ts`)

### Vyhledávání
- `GET /api/search?q=...` - Vyhledávání (`src/app/api/search/route.ts`)

---

## 🎨 KOMPONENTY - Přehled

### UI komponenty
- `src/components/ui/Button.tsx` - Tlačítko
- `src/components/ui/Card.tsx` - Karta
- `src/components/ui/Input.tsx` - Input pole
- `src/components/ui/Toast.tsx` - Toast notifikace

### Mapy
- `src/components/DashboardPublicWorldMap.tsx` - Mapa v dashboardu
- `src/components/PublicWorldMap.tsx` - Veřejná mapa
- `src/components/VectorWorldMap.tsx` - Vektorová mapa (starší)
- `src/components/guides/CountryMap.tsx` - Mapa konkrétní země

### Články
- `src/components/articles/ArticleComments.tsx` - Komentáře
- `src/components/articles/ArticleFormFields.tsx` - Formulář
- `src/components/articles/ArticleImageGallery.tsx` - Galerie obrázků

---

## 🔑 KLÍČOVÉ UTILITY A KNIHOVNY

### Autentifikace
- `src/hooks/useAuth.tsx` - React hook pro autentifikaci
- `src/utils/supabase.ts` - Auth utility funkce

### Databáze
- `src/utils/supabase-db.ts` - Databázové utility funkce
- `src/lib/supabase/client.ts` - Supabase klient (browser)
- `src/lib/supabase/server.ts` - Supabase klient (server)
- `src/lib/supabase/admin.ts` - Supabase admin klient

### Obrázky
- `src/lib/articles/imageUtils.ts` - Utility pro upload obrázků (Cloudinary)

### AI
- `src/lib/ai/generateGuides.ts` - Generování průvodců pomocí OpenAI

---

## 📍 RYCHLÉ ODPOVĚDI NA ČASTÉ OTÁZKY

### "Kde se ukládají navštívené země?"
**Odpověď:** 
- Frontend: `src/components/DashboardPublicWorldMap.tsx` (řádek 379-450)
- API: `src/app/api/visited/country/route.ts` (POST)
- Databáze: Tabulka `user_visited_countries`

### "Kde se získávají informace o zemích?"
**Odpověď:**
- REST Countries API: `src/components/guides/CountryGuide.tsx` (řádek 987-1042)
- Funkce: `fetchCountryInfo()` volá `https://restcountries.com/v3.1/alpha/{iso2}`

### "Kde se generují průvodce zemí?"
**Odpověď:**
- AI generování: `src/lib/ai/generateGuides.ts` (řádek 36)
- Uložení: `src/lib/ai/guideStore.ts`
- Zobrazení: `src/components/guides/CountryGuide.tsx` (řádek 1051)

### "Jak funguje upload obrázků?"
**Odpověď:**
- Utility: `src/lib/articles/imageUtils.ts`
- API: `src/app/api/images/upload/route.ts`
- Cloudinary: Používá se pro ukládání obrázků

### "Kde se kontroluje, jestli je uživatel admin?"
**Odpověď:**
- Hook: `src/hooks/useIsAdmin.ts`
- API: `src/app/api/auth/me-role/route.ts`
- Utility: `src/app/api/_utils/auth.ts` - funkce `getUserRole()`

### "Kde se vytváří slug z názvu?"
**Odpověď:**
- Utility: `src/utils/slugify.ts`
- Použití: Při vytváření článku (`src/app/api/articles/[id]/route.ts`, řádek 193)

---

## 🗺️ STRUKTURA SLOŽEK - Co kde najít

```
src/
├── app/                    # Next.js stránky a API
│   ├── api/               # API endpoints
│   │   ├── articles/      # API pro články
│   │   ├── users/         # API pro uživatele
│   │   ├── visited/       # API pro navštívené země
│   │   └── admin/         # Admin API
│   ├── dashboard/         # Dashboard stránky
│   ├── komunita/          # Komunita/Feed
│   ├── clanek/            # Články
│   ├── zeme/              # Země a průvodce
│   └── profil/            # Profily uživatelů
│
├── components/            # React komponenty
│   ├── ui/               # UI komponenty (Button, Card, Input)
│   ├── guides/          # Průvodci zemí
│   ├── articles/        # Komponenty pro články
│   ├── profile/         # Komponenty profilu
│   └── dashboard/       # Dashboard komponenty
│
├── hooks/                # React hooks
│   └── useAuth.tsx      # Auth hook
│
├── lib/                  # Knihovny
│   ├── supabase/        # Supabase klienti
│   ├── ai/              # AI generování
│   └── articles/        # Utility pro články
│
└── utils/                # Utility funkce
    ├── supabase.ts      # Supabase utility
    └── slugify.ts       # Slugifikace
```

---

## 💡 TIPY PRO OBHAJOBU

1. **Před obhajobou si projděte:**
   - Hlavní stránky: `/src/app/`
   - API endpoints: `/src/app/api/`
   - Klíčové komponenty: `/src/components/`

2. **Připravte si odpovědi na:**
   - "Kde se ukládají data?" → Supabase databáze
   - "Jak funguje autentifikace?" → `useAuth` hook + Supabase Auth
   - "Odkud berete data o zemích?" → REST Countries API
   - "Jak funguje mapa?" → MapLibre GL + GeoJSON

3. **Mějte otevřené:**
   - IDE s projektem
   - Dokumentaci zdrojů dat (`docs/ZDROJE_DAT.md`)
   - Tento dokument (`docs/MAPA_KODU.md`)

---

**Hodně štěstí při obhajobě! 🚀**
