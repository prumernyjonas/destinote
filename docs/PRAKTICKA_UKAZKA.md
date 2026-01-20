# Plán praktické ukázky webu - Destinote

## Časový rozvrh (doporučený: 10-15 minut)

---

## 1. ÚVOD A PŘEHLED (1-2 minuty)

### Co ukázat:
- **Úvodní stránka** (`/`)
  - Představení aplikace
  - Hlavní funkce (6 kartiček s ikonami)
  - Statistiky komunity
  - Design a UX

### Co říct:
> "Destinote je cestovatelská sociální platforma, která kombinuje interaktivní mapy, sdílení zážitků a gamifikaci. Začneme na úvodní stránce, která představuje hlavní funkce aplikace."

### Akce:
- Scrollování po stránce
- Ukázka hlavních sekcí
- Přechod na registraci/přihlášení

---

## 2. REGISTRACE A PŘIHLÁŠENÍ (1-2 minuty)

### Co ukázat:
- **Registrace** (`/registrace`)
  - Formulář s validací
  - Možnost přihlášení přes Google (pokud je implementováno)
  - Design formuláře

### Co říct:
> "Uživatelé se mohou zaregistrovat buď klasickým způsobem, nebo přes Google OAuth. Po registraci získají přístup k osobnímu dashboardu."

### Akce:
- Ukázka registračního formuláře
- Přihlášení (použijte testovací účet)
- Přechod na dashboard

---

## 3. DASHBOARD - HLAVNÍ CENTRUM (3-4 minuty)

### 3.1 Přehled dashboardu
**Co ukázat:**
- Statistiky cestovatele (počet zemí, kontinentů, odznaků, level)
- Navigační karty: Mapa cest, Moje články, Odznaky

**Co říct:**
> "Dashboard je osobní centrum každého cestovatele. Zde vidí své statistiky a má přístup ke všem hlavním funkcím."

### 3.2 Mapa cest (TAB: Mapa cest)
**Co ukázat:**
- Interaktivní světová mapa
- Označení navštívených zemí (kliknutím na zemi)
- Přidání/odebrání navštívené země
- Vizuální reprezentace cest

**Co říct:**
> "Interaktivní mapa umožňuje uživatelům označit navštívené země. Mapa je vytvořená pomocí MapLibre GL a GeoJSON dat z Natural Earth Data. Uživatelé mohou kliknout na zemi a označit ji jako navštívenou."

**Akce:**
- Kliknutí na několik zemí (např. Česká republika, Německo, Itálie)
- Ukázka, jak se mapa aktualizuje
- Ukázka statistik (počet zemí se aktualizuje)

### 3.3 Moje články (TAB: Moje články)
**Co ukázat:**
- Seznam vlastních článků
- Možnost vytvoření nového článku
- Editace existujících článků

**Co říct:**
> "Uživatelé mohou psát a sdílet články o svých cestách. Každý článek může obsahovat text, fotografie a být přiřazen k konkrétní zemi."

**Akce:**
- Kliknutí na "Nový článek" (přechod na editor)
- Nebo ukázka existujícího článku

### 3.4 Odznaky (TAB: Odznaky)
**Co ukázat:**
- Systém odznaků a úspěchů
- Progres k dalším odznakům
- Gamifikační prvky

**Co říct:**
> "Gamifikační systém motivuje uživatele k cestování. Za různé úspěchy získávají odznaky - například za návštěvu určitého počtu zemí nebo kontinentů."

---

## 4. VYTVÁŘENÍ ČLÁNKU (2-3 minuty)

### Co ukázat:
- **Editor článků** (`/clanek/novy` nebo `/dashboard/articles/new`)
  - Formulář pro vytvoření článku
  - Upload obrázků
  - Výběr destinace/země
  - Textový editor
  - Náhled článku

### Co říct:
> "Editor článků umožňuje uživatelům vytvářet bohaté cestopisy s fotografiemi. Články jsou následně zveřejněny v komunitě a mohou být přiřazeny k konkrétní zemi."

### Akce:
- Ukázka formuláře
- Ukázka uploadu obrázku (pokud je implementováno)
- Výběr země z dropdownu
- Ukázka, jak se článek ukládá

---

## 5. PROHLÍŽENÍ ZEMÍ (2 minuty)

### 5.1 Seznam zemí
**Co ukázat:**
- **Stránka zemí** (`/zeme`)
  - Seznam všech zemí
  - Filtrování podle kontinentů
  - Vyhledávání

**Co říct:**
> "Uživatelé mohou procházet všechny země světa, filtrovat je podle kontinentů a hledat konkrétní destinace."

### 5.2 Detail země
**Co ukázat:**
- **Detail země** (`/zeme/[continent]/[country]` nebo `/country/thailand`)
  - Informace o zemi (rozloha, hlavní město, populace, jazyky, měny)
  - Mapa země
  - Články uživatelů o této zemi
  - Cestovní tipy (pokud jsou implementovány)

**Co říct:**
> "Každá země má svou detailní stránku s informacemi z REST Countries API - rozloha, hlavní město, populace, jazyky a měny. Uživatelé zde vidí také články ostatních cestovatelů o této destinaci."

**Akce:**
- Kliknutí na konkrétní zemi (např. Thajsko, Itálie)
- Ukázka informací o zemi
- Scrollování k článkům
- Ukázka mapy země

---

## 6. KOMUNITA A SOCIÁLNÍ FUNKCE (2 minuty)

### 6.1 Komunita
**Co ukázat:**
- **Stránka komunity** (`/komunita`)
  - Feed článků od ostatních uživatelů
  - Možnost lajkování a komentování
  - Sledování uživatelů

**Co říct:**
> "Uživatelé mohou sledovat články ostatních cestovatelů, lajkovat je a komentovat. To vytváří sociální aspekt platformy."

### 6.2 Profil uživatele
**Co ukázat:**
- **Profil uživatele** (`/profil/[nickname]`)
  - Statistiky uživatele
  - Mapa navštívených zemí
  - Články uživatele
  - Možnost sledování

**Co říct:**
> "Každý uživatel má svůj veřejný profil, kde ostatní vidí jeho statistiky, navštívené země a články. Uživatelé se mohou navzájem sledovat."

**Akce:**
- Kliknutí na profil jiného uživatele
- Ukázka jeho statistik a mapy
- Ukázka tlačítka "Sledovat"

### 6.3 Žebříček
**Co ukázat:**
- **Žebříček** (`/zebricek`)
  - Top cestovatelé podle skóre
  - Počet navštívených zemí
  - Ranking systém

**Co říct:**
> "Žebříček motivuje uživatele k aktivitě. Zobrazuje nejaktivnější cestovatele podle skóre a počtu navštívených zemí."

---

## 7. VYHLEDÁVÁNÍ (1 minuta)

### Co ukázat:
- **Vyhledávání** (`/hledat`)
  - Vyhledávání zemí
  - Vyhledávání článků
  - Vyhledávání uživatelů
  - Autocomplete funkce

### Co říct:
> "Globální vyhledávání umožňuje rychle najít země, články nebo uživatele. Vyhledávání podporuje české názvy zemí."

**Akce:**
- Vyhledání konkrétní země (např. "Thajsko")
- Ukázka výsledků

---

## 8. NASTAVENÍ PROFILU (1 minuta)

### Co ukázat:
- **Nastavení** (`/nastaveni`)
  - Profilové nastavení
  - Bezpečnost
  - Soukromí
  - Notifikace

### Co říct:
> "Uživatelé mohou upravit svůj profil, změnit heslo, nastavit soukromí a další preference."

**Akce:**
- Rychlý přehled sekcí nastavení
- Ukázka profilového nastavení

---

## 9. ADMIN PANEL (volitelné, pokud je relevantní) (1-2 minuty)

### Co ukázat:
- **Admin panel** (`/admin`)
  - Správa článků (schvalování)
  - Správa uživatelů
  - Správa komentářů

### Co říct:
> "Pro administrátory je k dispozici admin panel pro správu obsahu - schvalování článků, moderování komentářů a správa uživatelů."

**Akce:**
- Ukázka admin dashboardu
- Ukázka schvalování článku (pokud je implementováno)

---

## 10. ZÁVĚR A TECHNICKÉ DETAILE (1-2 minuty)

### Co říct:
> "Aplikace je postavena na Next.js 14 s TypeScript, používá Supabase pro backend, MapLibre GL pro mapy a Tailwind CSS pro styling. Data o zemích získáváme z REST Countries API a Natural Earth Data."

### Klíčové body k zmínění:
- **Technologie**: Next.js, TypeScript, Supabase, MapLibre GL
- **Zdroje dat**: REST Countries API, Natural Earth Data
- **Funkce**: Interaktivní mapy, sociální síť, gamifikace
- **Responsive design**: Aplikace funguje na mobilu i desktopu

---

## DOPORUČENÝ POŘADÍ PRO OBHAJOBU

### Varianta A: Kompletní ukázka (15 minut)
1. Úvodní stránka
2. Registrace/Přihlášení
3. Dashboard - Mapa cest (označení několika zemí)
4. Vytvoření článku
5. Prohlížení zemí (detail země)
6. Komunita - Feed článků
7. Profil uživatele
8. Žebříček
9. Vyhledávání
10. Závěr

### Varianta B: Zkrácená ukázka (10 minut)
1. Úvodní stránka
2. Přihlášení
3. Dashboard - Mapa cest (označení zemí)
4. Detail země (ukázka informací z API)
5. Vytvoření článku
6. Komunita - Feed
7. Profil uživatele
8. Závěr

---

## TIPY PRO PREZENTACI

### Před obhajobou:
- ✅ **Připravte si testovací účet** s nějakými daty (navštívené země, články)
- ✅ **Otestujte všechny funkce** - ujistěte se, že vše funguje
- ✅ **Připravte si poznámky** - co říct u každé sekce
- ✅ **Nastavte si rozlišení obrazovky** - ideálně 1920x1080 pro prezentaci
- ✅ **Zkontrolujte internetové připojení** - některé funkce vyžadují API volání

### Během prezentace:
- ✅ **Mluvte pomalu a jasně** - vysvětlujte, co děláte
- ✅ **Zdůrazněte technické aspekty** - odkud berete data, jaké technologie používáte
- ✅ **Ukazujte interaktivitu** - klikněte na různé prvky, scrollujte
- ✅ **Buďte připraveni na otázky** - komise se může zeptat na detaily
- ✅ **Mějte otevřený dokument se zdroji dat** - pro případné dotazy

### Co zdůraznit:
- 🎯 **Interaktivní mapa** - hlavní feature, ukázat označování zemí
- 🎯 **Zdroj dat** - REST Countries API, Natural Earth Data
- 🎯 **Sociální aspekt** - články, komentáře, sledování
- 🎯 **Gamifikace** - odznaky, žebříček, statistiky
- 🎯 **Technologie** - Next.js, TypeScript, Supabase, MapLibre GL

---

## MOŽNÉ OTÁZKY KOMISE A ODPOVĚDI

### "Jak funguje označování zemí na mapě?"
> "Uživatel klikne na zemi na mapě, aplikace odešle požadavek na API endpoint, který uloží informaci do databáze Supabase. Mapa se následně aktualizuje a země se označí jako navštívená."

### "Odkud berete data o zemích?"
> "Informace o zemích (rozloha, hlavní město, populace) získáváme z REST Countries API. Geometrie pro mapu pocházejí z Natural Earth Data ve formátu GeoJSON."

### "Jak funguje systém odznaků?"
> "Systém odznaků je založen na statistikách uživatele - například za návštěvu určitého počtu zemí nebo kontinentů. Odznaky se automaticky přidělují při dosažení určitých milníků."

### "Je aplikace responzivní?"
> "Ano, aplikace je plně responzivní a funguje na mobilních zařízeních, tabletech i desktopu. Používáme Tailwind CSS pro responzivní design."

---

## CHECKLIST PŘED OBHAJOBOU

- [ ] Testovací účet je připraven s daty
- [ ] Všechny hlavní funkce fungují
- [ ] Mapa správně zobrazuje země
- [ ] Články se zobrazují a dají vytvořit
- [ ] Profil uživatele funguje
- [ ] Vyhledávání funguje
- [ ] Dokument se zdroji dat je připraven
- [ ] Prezentační režim je nastaven
- [ ] Internetové připojení je stabilní
- [ ] Poznámky k prezentaci jsou připraveny

---

**Hodně štěstí při obhajobě! 🚀**
