# Struktura projektu Destinote - Kompletní přehled

## 📁 Hlavní struktura projektu

```
Destinote-test/
├── commands/          # Dokumentace příkazů (nepoužívá se v kódu)
├── docs/              # Dokumentace projektu
├── fonts/             # Fonty (duplikát - také v public/)
├── public/            # Statické soubory
├── scripts/           # Utility skripty (nepoužívají se automaticky)
├── src/               # Hlavní zdrojový kód
│   ├── app/           # Next.js App Router stránky a API
│   ├── components/    # React komponenty
│   ├── hooks/         # React hooks
│   ├── lib/           # Knihovny a utility
│   ├── styles/        # CSS styly
│   ├── types/         # TypeScript typy
│   └── utils/         # Utility funkce
└── [konfigurační soubory]
```

---

## ✅ POUŽÍVANÉ SLOŽKY A SOUBORY

### 📂 `/src/app/` - Next.js stránky a API routes

#### **Stránky (pages):**
- ✅ `/` - Hlavní stránka (`page.tsx`)
- ✅ `/prihlaseni` - Přihlášení (`prihlaseni/page.tsx`)
- ✅ `/registrace` - Registrace (`registrace/page.tsx`)
- ✅ `/zapomenute-heslo` - Zapomenuté heslo (`zapomenute-heslo/page.tsx`)
- ✅ `/obnovit-heslo` - Obnovení hesla (`obnovit-heslo/page.tsx`)
- ✅ `/dashboard` - Dashboard (přesměrování, hlavní dashboard není samostatná stránka)
- ✅ `/dashboard/articles/new` - Nový článek (`dashboard/articles/new/page.tsx`)
- ✅ `/dashboard/articles/[id]/edit` - Editace článku (`dashboard/articles/[id]/edit/page.tsx`)
- ✅ `/komunita` - Komunita/Feed článků (`komunita/page.tsx`)
- ✅ `/clanek/[slug]` - Detail článku (`clanek/[slug]/page.tsx`)
- ✅ `/clanek/novy` - Nový článek (alternativní cesta) (`clanek/novy/page.tsx`)
- ✅ `/profil/[nickname]` - Profil uživatele (`profil/[nickname]/page.tsx`)
- ✅ `/zeme` - Seznam zemí (`zeme/page.tsx`)
- ✅ `/zeme/[continent]` - Seznam zemí v kontinentu (`zeme/[continent]/page.tsx`)
- ✅ `/zeme/[continent]/[country]` - Detail země (`zeme/[continent]/[country]/page.tsx`)
- ✅ `/hledat` - Vyhledávání (`hledat/page.tsx`)
- ✅ `/zebricek` - Žebříček (`zebricek/page.tsx`)
- ✅ `/letenky` - Letenky (`letenky/page.tsx`)
- ✅ `/nastaveni` - Nastavení (`nastaveni/page.tsx`)
- ✅ `/nastaveni/[slug]` - Nastavení s parametrem (redirect na hlavní) (`nastaveni/[slug]/page.tsx`)
- ✅ `/admin` - Admin panel (`admin/page.tsx`)
- ✅ `/admin/articles` - Správa článků (`admin/articles/page.tsx`)
- ✅ `/admin/comments` - Správa komentářů (`admin/comments/page.tsx`)
- ✅ `/admin/users` - Správa uživatelů (`admin/users/page.tsx`)
- ✅ `/napoveda` - Nápověda (`napoveda/page.tsx`)
- ✅ `/ochrana` - Ochrana osobních údajů (`ochrana/page.tsx`)
- ✅ `/podminky` - Podmínky použití (`podminky/page.tsx`)

#### **API Routes:**
- ✅ `/api/articles` - Seznam článků
- ✅ `/api/articles/[id]` - Detail článku
- ✅ `/api/articles/[id]/submit` - Odeslání článku ke schválení
- ✅ `/api/articles/[id]/cover` - Upload obálky článku
- ✅ `/api/articles/[id]/photos` - Správa fotek článku
- ✅ `/api/articles/slug/[slug]` - Článek podle slugu
- ✅ `/api/articles/[id]/comments` - Komentáře k článku
- ✅ `/api/comments/[id]` - Správa komentáře
- ✅ `/api/comments/[id]/like` - Lajk komentáře
- ✅ `/api/users/[id]` - Profil uživatele
- ✅ `/api/users/[id]/follow` - Sledování uživatele
- ✅ `/api/users/[id]/followers` - Seznam sledujících
- ✅ `/api/users/[id]/following` - Seznam sledovaných
- ✅ `/api/users/[id]/friends` - Seznam přátel
- ✅ `/api/users/avatar` - Upload avatara
- ✅ `/api/users/check-email` - Kontrola emailu
- ✅ `/api/users/check-nickname` - Kontrola přezdívky
- ✅ `/api/users/update-profile` - Aktualizace profilu
- ✅ `/api/countries/list` - Seznam zemí
- ✅ `/api/search` - Vyhledávání
- ✅ `/api/visited` - Navštívené země
- ✅ `/api/visited/country` - Označení země jako navštívené
- ✅ `/api/leaderboard` - Žebříček
- ✅ `/api/images/upload` - Upload obrázků
- ✅ `/api/images/signature` - Cloudinary signature
- ✅ `/api/auth/logout` - Odhlášení
- ✅ `/api/auth/role` - Role uživatele
- ✅ `/api/auth/me-role` - Moje role
- ✅ `/api/admin/articles` - Admin: správa článků
- ✅ `/api/admin/articles/[id]/approve` - Schválení článku
- ✅ `/api/admin/articles/[id]/reject` - Zamítnutí článku
- ✅ `/api/admin/comments/[id]` - Admin: správa komentáře
- ✅ `/api/admin/users` - Admin: správa uživatelů
- ✅ `/api/flights/deals` - Nabídky letenek
- ✅ `/api/flights/debug` - Debug letenek (používá se pro vývoj)
- ✅ `/api/debug/env` - Debug environment proměnných (používá se pro vývoj)

#### **Auth:**
- ✅ `/auth/callback` - OAuth callback (`auth/callback/route.ts`)

### 📂 `/src/components/` - React komponenty

#### **UI komponenty:**
- ✅ `ui/Button.tsx` - Tlačítko
- ✅ `ui/Card.tsx` - Karta
- ✅ `ui/Input.tsx` - Input pole
- ✅ `ui/LoadingSpinner.tsx` - Loading spinner
- ✅ `ui/Skeleton.tsx` - Skeleton loader
- ✅ `ui/Toast.tsx` - Toast notifikace
- ✅ `ui/ErrorMessage.tsx` - Chybová zpráva
- ✅ `ui/GradientText.tsx` - Gradient text
- ✅ `ui/GradientText.css` - CSS pro gradient text

#### **Layout:**
- ✅ `layout/Navbar.tsx` - Navigační lišta

#### **Mapy:**
- ✅ `VectorWorldMap.tsx` - Vektorová mapa (starší verze)
- ✅ `PublicWorldMap.tsx` - Veřejná mapa
- ✅ `DashboardPublicWorldMap.tsx` - Mapa v dashboardu

#### **Články:**
- ✅ `articles/ArticleComments.tsx` - Komentáře k článku
- ✅ `articles/ArticleFormFields.tsx` - Formulář pro článek
- ✅ `articles/ArticleImageGallery.tsx` - Galerie obrázků
- ✅ `articles/ArticlePhotoGallery.tsx` - Galerie fotek
- ✅ `articles/ArticlesTeaser.tsx` - Teaser článků
- ✅ `articles/ImageUploadButton.tsx` - Upload obrázku

#### **Průvodci:**
- ✅ `guides/CountryGuide.tsx` - Průvodce zemí
- ✅ `guides/CountryMap.tsx` - Mapa země
- ✅ `guides/RegionGuide.tsx` - Průvodce regionem/kontinentem
- ✅ `guides/CountriesCarousel.tsx` - Karusel zemí
- ✅ `guides/VisitedButton.tsx` - Tlačítko "Navštívené"
- ✅ `guides/AddArticleButton.tsx` - Tlačítko "Přidat článek"
- ✅ `guides/actions.ts` - Server actions

#### **Profil:**
- ✅ `profile/ProfileHeader.tsx` - Hlavička profilu
- ✅ `profile/ProfileHero.tsx` - Hero sekce profilu
- ✅ `profile/ProfileTabs.tsx` - Taby profilu
- ✅ `profile/ProfileStats.tsx` - Statistiky profilu
- ✅ `profile/ProfileStatItem.tsx` - Položka statistiky
- ✅ `profile/ArticleCard.tsx` - Karta článku
- ✅ `profile/ArticleList.tsx` - Seznam článků
- ✅ `profile/FollowButton.tsx` - Tlačítko sledování
- ✅ `profile/FollowersModal.tsx` - Modal sledujících
- ✅ `profile/AvatarCropModal.tsx` - Modal pro ořez avatara
- ✅ `profile/AvatarLightbox.tsx` - Lightbox avatara
- ✅ `profile/ProfileSettingsTab.tsx` - Nastavení profilu
- ✅ `profile/StatusBadge.tsx` - Status badge

#### **Dashboard:**
- ✅ `dashboard/StatsCards.tsx` - Statistiky
- ✅ `dashboard/ArticlesList.tsx` - Seznam článků
- ✅ `dashboard/BadgesGrid.tsx` - Mřížka odznaků
- ✅ `dashboard/VisitedCountriesList.tsx` - Seznam navštívených zemí

#### **Admin:**
- ✅ `admin/ArticleReviewDrawer.tsx` - Drawer pro recenzi článku
- ✅ `admin/PendingArticleCard.tsx` - Karta čekajícího článku
- ✅ `admin/UserDetailPanel.tsx` - Panel detailu uživatele

#### **Letenky:**
- ✅ `flights/FlightsWidget.tsx` - Widget letenek
- ✅ `flights/FlightDealCard.tsx` - Karta nabídky letenek

#### **Auth:**
- ✅ `auth/AuthShell.tsx` - Shell pro autentifikaci

#### **Ostatní:**
- ✅ `RoleLogger.tsx` - Logger rolí (používá se pro debug)

### 📂 `/src/hooks/` - React hooks
- ✅ `useAuth.tsx` - Hook pro autentifikaci
- ✅ `useIsAdmin.ts` - Hook pro kontrolu admin role

### 📂 `/src/lib/` - Knihovny a utility

#### **Supabase:**
- ✅ `supabase/client.ts` - Supabase klient (browser)
- ✅ `supabase/server.ts` - Supabase klient (server)
- ✅ `supabase/admin.ts` - Supabase admin klient

#### **AI:**
- ✅ `ai/generateGuides.ts` - Generování průvodců pomocí AI
- ✅ `ai/guideStore.ts` - Ukládání průvodců

#### **Články:**
- ✅ `articles/authUtils.ts` - Auth utility pro články
- ✅ `articles/imageUtils.ts` - Utility pro obrázky

#### **Letenky:**
- ✅ `flights/kiwi.ts` - Kiwi.com API
- ✅ `flights/travelpayouts.ts` - Travelpayouts API
- ✅ `flights/cache.ts` - Cache pro letenky

#### **Fonty:**
- ✅ `fonts.ts` - Konfigurace fontů

### 📂 `/src/utils/` - Utility funkce
- ✅ `supabase.ts` - Supabase utility (starší verze)
- ✅ `supabase-db.ts` - Supabase databázové utility
- ✅ `slugify.ts` - Slugifikace textu
- ✅ `password.ts` - Utility pro hesla
- ✅ `cn.ts` - Utility pro className (clsx)

### 📂 `/src/types/` - TypeScript typy
- ✅ `database.ts` - Typy databáze
- ✅ `auth.ts` - Typy autentifikace
- ✅ `globals.d.ts` - Globální typy

### 📂 `/src/styles/` - CSS styly
- ✅ `globals.css` - Globální CSS styly

### 📂 `/public/` - Statické soubory
- ✅ `countries.json` - GeoJSON zemí (základní)
- ✅ `countries-hd.json` - GeoJSON zemí (vysoké rozlišení)
- ✅ `logo.svg` - Logo SVG
- ✅ `logo.png` - Logo PNG
- ✅ `logo-sm2.png` - Logo malé
- ✅ `bg.png` - Pozadí
- ✅ `globe.png` - Glóbus
- ✅ `wrld.png` - Svět
- ✅ `Travel.json` - Lottie animace
- ✅ `Insider-loading.json` - Lottie animace
- ✅ `fonts/Marble-Regular.woff2` - Font Marble

### 📂 `/docs/` - Dokumentace
- ✅ `PRODUCT_BRIEF.md` - Produktový brief
- ✅ `TECHNOLOGIES.md` - Seznam technologií
- ✅ `CODE_EXAMPLES.md` - Příklady kódu
- ✅ `ZDROJE_DAT.md` - Zdroje dat (pro obhajobu)
- ✅ `OBHAJOBA_OTAZKY.md` - Otázky pro obhajobu
- ✅ `PRAKTICKA_UKAZKA.md` - Plán praktické ukázky
- ✅ `UKAZKA_STRUCNY_PREHLED.md` - Stručný přehled ukázky
- ✅ `features/` - Dokumentace feature
- ✅ `sql/` - SQL skripty

---

## ⚠️ NEPOUŽÍVANÉ / ZASTARALÉ SOUBORY

### ❌ `/src/app/country/thailand/` - Zastaralá stránka
- **Soubor:** `src/app/country/thailand/page.tsx`
- **Důvod:** Používá se nová struktura `/zeme/[continent]/[country]`
- **Status:** Zastaralé, ale může být použito jako reference
- **Akce:** Může být smazáno nebo ponecháno jako příklad

### ❌ `/src/app/countries/` - Placeholder stránka
- **Soubor:** `src/app/countries/page.tsx`
- **Důvod:** Pouze placeholder s textem "Přehled zemí – již brzy"
- **Status:** Není funkční, nepoužívá se
- **Akce:** Může být smazáno nebo implementováno

### ❌ `/src/app/nastaveni/[slug]/` - Redirect
- **Soubor:** `src/app/nastaveni/[slug]/page.tsx`
- **Důvod:** Pouze redirect na hlavní nastavení
- **Status:** Technicky se používá, ale je to jen redirect
- **Akce:** Může být ponecháno

### ❌ `/src/lib/.gitkeep` - Prázdný soubor
- **Soubor:** `src/lib/.gitkeep`
- **Důvod:** Pouze pro udržení složky v gitu
- **Status:** Technicky nepotřebný, složka už obsahuje soubory
- **Akce:** Může být smazáno

### ⚠️ `/fonts/` - Fonty (používají se)
- **Složka:** `/fonts/Marble-Regular.woff2`
- **Použití:** Používá se v `src/lib/fonts.ts` (relativní cesta `../fonts/`)
- **Status:** Používá se, ale je také duplikát v `/public/fonts/`
- **Poznámka:** Fonty jsou na dvou místech:
  - `/fonts/` - používá `src/lib/fonts.ts` (Next.js font loader)
  - `/public/fonts/` - používá `src/styles/globals.css` (CSS @font-face)
- **Doporučení:** Zvážit sjednocení na jedno místo

### ❌ `/public/logo (kopie 2).svg` - Duplikát
- **Soubor:** `public/logo (kopie 2).svg`
- **Důvod:** Duplikát loga
- **Status:** Nepoužívá se
- **Akce:** Může být smazáno

---

## 📜 SKRIPTY

### ✅ `/scripts/generate-country-guides.ts`
- **Popis:** Generuje průvodce zemí pomocí OpenAI API
- **Použití:** Manuálně spuštěno pomocí `tsx scripts/generate-country-guides.ts`
- **Status:** Používá se, ale není v package.json scripts
- **Doporučení:** Přidat do package.json jako `"generate-guides": "tsx scripts/generate-country-guides.ts"`

### ✅ `/scripts/generate-missing-guides.ts`
- **Popis:** Generuje chybějící průvodce
- **Použití:** Manuálně spuštěno pomocí `tsx scripts/generate-missing-guides.ts`
- **Status:** Používá se, ale není v package.json scripts
- **Doporučení:** Přidat do package.json jako `"generate-missing": "tsx scripts/generate-missing-guides.ts"`

---

## 📝 DOKUMENTACE

### ✅ `/commands/` - Příkazy pro AI asistenta
- **Soubor:** `code_review.md` - Šablona pro code review
- **Soubor:** `create_brief.md` - Šablona pro vytvoření briefu
- **Soubor:** `plan_feature.md` - Šablona pro plánování feature
- **Status:** Používá se pro komunikaci s AI, ne v kódu
- **Akce:** Ponechat

### ✅ `/docs/` - Dokumentace projektu
- **Status:** Všechny soubory jsou relevantní
- **Akce:** Ponechat vše

---

## 🎯 SHRNUTÍ

### ✅ Používá se:
- **Všechny hlavní stránky** v `/src/app/` (kromě výjimek výše)
- **Všechny API routes** v `/src/app/api/`
- **Všechny komponenty** v `/src/components/`
- **Všechny hooks** v `/src/hooks/`
- **Všechny utility** v `/src/lib/` a `/src/utils/`
- **Všechny statické soubory** v `/public/` (kromě duplikátů)
- **Dokumentace** v `/docs/`

### ❌ Nepoužívá se / Zastaralé:
1. `/src/app/country/thailand/page.tsx` - zastaralá struktura
2. `/src/app/countries/page.tsx` - pouze placeholder
3. `/src/lib/.gitkeep` - prázdný soubor
4. `/public/logo (kopie 2).svg` - duplikát

### ⚠️ Duplikáty (používají se oba):
1. `/fonts/` a `/public/fonts/` - fonty jsou na dvou místech (oba se používají)

### ⚠️ Skripty (nejsou v package.json):
1. `scripts/generate-country-guides.ts` - manuální spuštění
2. `scripts/generate-missing-guides.ts` - manuální spuštění

---

## 📋 DOPORUČENÍ

### 1. Přidat skripty do package.json:
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "generate-guides": "tsx scripts/generate-country-guides.ts",
    "generate-missing": "tsx scripts/generate-missing-guides.ts"
  }
}
```

### 2. Smazat nepotřebné soubory:
- `/src/app/country/thailand/page.tsx` (pokud není potřeba jako reference)
- `/src/app/countries/page.tsx` (nebo implementovat)
- `/src/lib/.gitkeep`
- `/public/logo (kopie 2).svg`
- `/fonts/` (pokud se nepoužívá)

### 3. Zkontrolovat použití fontů:
- Ověřit, zda se fonty z `/fonts/` skutečně používají
- Pokud ne, smazat složku

---

## 🗺️ MAPA PROJEKTU - Kde co najít

### Frontend stránky:
- **Hlavní stránka:** `/src/app/page.tsx`
- **Autentifikace:** `/src/app/prihlaseni/`, `/src/app/registrace/`
- **Dashboard:** `/src/app/dashboard/`
- **Komunita:** `/src/app/komunita/`
- **Články:** `/src/app/clanek/`
- **Země:** `/src/app/zeme/`
- **Profil:** `/src/app/profil/`
- **Nastavení:** `/src/app/nastaveni/`
- **Admin:** `/src/app/admin/`

### API:
- **Články:** `/src/app/api/articles/`
- **Uživatelé:** `/src/app/api/users/`
- **Země:** `/src/app/api/countries/`
- **Vyhledávání:** `/src/app/api/search/`
- **Admin:** `/src/app/api/admin/`

### Komponenty:
- **UI:** `/src/components/ui/`
- **Mapy:** `/src/components/` (VectorWorldMap, PublicWorldMap, DashboardPublicWorldMap)
- **Články:** `/src/components/articles/`
- **Průvodci:** `/src/components/guides/`
- **Profil:** `/src/components/profile/`

### Utility:
- **Supabase:** `/src/lib/supabase/`
- **AI:** `/src/lib/ai/`
- **Letenky:** `/src/lib/flights/`
- **Databáze:** `/src/utils/supabase-db.ts`

### Statické soubory:
- **Mapy:** `/public/countries.json`, `/public/countries-hd.json`
- **Obrázky:** `/public/logo.*`, `/public/bg.png`, `/public/globe.png`
- **Fonty:** `/public/fonts/`

### Dokumentace:
- **Obhajoba:** `/docs/ZDROJE_DAT.md`, `/docs/OBHAJOBA_OTAZKY.md`, `/docs/PRAKTICKA_UKAZKA.md`
- **Technologie:** `/docs/TECHNOLOGIES.md`
- **SQL:** `/docs/sql/`

---

**Poslední aktualizace:** 2024
