# Zdroje dat pro projekt Destinote

Tento dokument obsahuje přehled všech zdrojů dat používaných v projektu, vhodný pro obhajobu.

## 1. Geografická data pro mapy (GeoJSON)

### Soubory
- `/public/countries.json` - základní GeoJSON s geometriemi zemí
- `/public/countries-hd.json` - vysoké rozlišení GeoJSON s geometriemi zemí

### Zdroj
**Natural Earth Data** - veřejně dostupný zdroj geografických dat
- Název datasetu: `ne_10m_admin_0_countries` (viditelné v metadata souboru countries-hd.json)
- Natural Earth poskytuje vektorová geografická data v různých rozlišeních
- Data jsou volně dostupná a vhodná pro komerční i nekomerční použití
- URL: https://www.naturalearthdata.com/

### Obsahuje
- Geometrie hranic všech zemí světa
- ISO kódy zemí (ISO3166-1-Alpha-2, ISO3166-1-Alpha-3)
- Alternativní kódy (ADM0_A3, ISO_A2, ISO_A3)
- Názvy zemí v různých jazycích

### Použití v projektu
- Zobrazení interaktivní mapy světa
- Vizuální reprezentace navštívených zemí
- Interakce s mapou (kliknutí na zemi, hover efekty)
- Zobrazení jednotlivých zemí na detailních stránkách

---

## 2. Informace o zemích (rozloha, hlavní město, populace, jazyky, měny)

### Zdroj
**REST Countries API** - veřejné REST API pro informace o zemích
- URL: `https://restcountries.com/v3.1/alpha/{iso2}`
- Verze API: v3.1
- Dokumentace: https://restcountries.com/

### Použití v projektu
- Endpoint: `https://restcountries.com/v3.1/alpha/{iso2}?fields=population,capital,languages,currencies,area`
- Voláno v: `src/components/guides/CountryGuide.tsx` (funkce `fetchCountryInfo`)

### Získané informace
- **Populace** (population) - počet obyvatel
- **Hlavní město** (capital) - seznam hlavních měst
- **Jazyky** (languages) - oficiální jazyky země
- **Měny** (currencies) - používané měny včetně symbolů
- **Rozloha** (area) - rozloha v km²

### Aktualizace dat
- **REST Countries API** je open-source projekt bez veřejně dokumentovaného pevného harmonogramu aktualizací
- Pouze nejnovější verze API (v3.1) dostává aktivní aktualizace a vylepšení
- **Frekvence aktualizací**:
  - **Populace**: Aktualizuje se častěji (mění se každý rok)
  - **Hlavní město, rozloha, kódy zemí**: Statická data, mění se zřídka (pouze při změnách hranic nebo administrativních změnách)
  - **Jazyky, měny**: Relativně stabilní, aktualizují se při oficiálních změnách
- V projektu se data načítají dynamicky při každém zobrazení stránky, takže uživatelé vždy vidí nejnovější dostupná data z API

### Poznámka
- Data jsou získávána dynamicky při načtení stránky průvodce zemí
- Jazyky, měny a hlavní města jsou následně přeloženy do češtiny pomocí vlastních překladových funkcí
- Pro produkční prostředí by bylo možné implementovat cachování (např. aktualizace každých 24 hodin) pro lepší výkon

---

## 3. Seznam zemí a jejich metadata

### Zdroj 1: Databáze Supabase
- Tabulka: `countries`
- Obsahuje:
  - `id` - unikátní identifikátor
  - `name` - anglický název země
  - `name_cs` - český název země
  - `iso_code` - ISO 3166-1 Alpha-2 kód (např. "CZ", "US")
  - `continent` - kontinent
  - `continent_slug` - URL slug pro kontinent
  - `slug` - URL slug pro zemi

### Zdroj 2: Knihovna i18n-iso-countries
- NPM balíček: `i18n-iso-countries` (verze 7.14.0)
- Použití: pro překlady názvů zemí do češtiny
- Registrace českého locale: `i18n-iso-countries/langs/cs.json`
- Používáno v: `src/app/api/countries/list/route.ts`, `src/app/api/search/route.ts`

### Zdroj 3: CSV export
- Soubor: `/countries_export.csv`
- Obsahuje: ISO kódy, anglické názvy, kontinenty
- Použití: pravděpodobně pro import dat do databáze

---

## 4. Mapové služby

### MapTiler SDK
- NPM balíček: `@maptiler/sdk` (verze 3.9.0)
- Poskytuje: mapové dlaždice (tiles) pro zobrazení map
- Použití: základní mapové podklady (satelitní, terénní, atd.)

### MapLibre GL
- NPM balíček: `maplibre-gl` (verze 5.15.0)
- Open-source knihovna pro zobrazení interaktivních map
- Použití: renderování GeoJSON dat na mapě, interakce s mapou

---

## 5. Vlajky zemí

### Flag Icons
- NPM balíček: `flag-icons` (verze 7.5.0)
- Poskytuje: SVG ikony vlajek všech zemí
- Standard: ISO 3166-1 Alpha-2 kódy

---

## Shrnutí zdrojů dat

| Typ dat | Zdroj | Formát | Aktualizace |
|---------|-------|--------|-------------|
| Geometrie zemí | Natural Earth Data | GeoJSON | Statické soubory (ruční aktualizace) |
| Rozloha, populace, hlavní město | REST Countries API | JSON (REST API) | Dynamické načítání (API aktualizuje podle potřeby) |
| Jazyky, měny | REST Countries API | JSON (REST API) | Dynamické načítání (API aktualizuje podle potřeby) |
| Seznam zemí | Supabase databáze | PostgreSQL | Lokální databáze (ruční aktualizace) |
| České názvy zemí | i18n-iso-countries | NPM balíček | Statická knihovna (aktualizace při upgradu balíčku) |
| Mapové dlaždice | MapTiler | Tiles API | Externí služba (automatické aktualizace) |
| Vlajky | Flag Icons | SVG | NPM balíček (aktualizace při upgradu balíčku) |

---

## Odpovědi na časté otázky komise

### "Odkud berete země na mapě?"
Země na mapě pocházejí z **Natural Earth Data**, což je veřejně dostupný zdroj geografických dat. Používáme GeoJSON soubory (`countries.json` a `countries-hd.json`), které obsahují geometrie hranic všech zemí světa. Data jsou ve formátu GeoJSON a zobrazujeme je pomocí knihovny MapLibre GL.

### "Odkud berete informace o rozloze, hlavním městě, populaci?"
Tyto informace získáváme z **REST Countries API** (restcountries.com). Při zobrazení průvodce konkrétní země voláme jejich API endpoint, který vrací aktuální data o populaci, hlavním městě, rozloze, jazycích a měnách. Data se načítají dynamicky při každém zobrazení stránky.

### "Jak zajišťujete české názvy zemí?"
České názvy zemí získáváme z několika zdrojů:
1. **Databáze Supabase** - obsahuje pole `name_cs` s českými názvy
2. **Knihovna i18n-iso-countries** - jako fallback pro země, které nemají český název v databázi
3. Pokud ani jeden zdroj neobsahuje český název, použije se anglický název

### "Jsou data aktuální?"
- **Geometrie zemí**: Statické soubory, aktualizujeme je ručně při změnách hranic
- **Informace o zemích** (populace, rozloha): Dynamicky z REST Countries API
  - REST Countries API je open-source projekt, který aktualizuje data podle potřeby
  - Populace se aktualizuje častěji (každý rok)
  - Statická data (hlavní město, rozloha, kódy) se aktualizují pouze při oficiálních změnách
  - Data se načítají při každém zobrazení stránky, takže uživatelé vidí nejnovější dostupná data
- **Seznam zemí v databázi**: Aktualizujeme ručně při přidání nových zemí

### "Jak často se aktualizují data z REST Countries API?"
REST Countries API nemá veřejně dokumentovaný pevný harmonogram aktualizací. Je to open-source projekt, který:
- Aktualizuje pouze nejnovější verzi API (v3.1)
- Aktualizuje data podle potřeby - populace častěji, statická data zřídka
- V projektu načítáme data dynamicky při každém zobrazení, takže uživatelé vždy vidí nejnovější dostupná data

### "Jak řešíte licenční podmínky?"
- **Natural Earth Data**: Volně dostupné pro komerční i nekomerční použití
- **REST Countries API**: Veřejné API bez autentizace, vhodné pro komerční použití
- **i18n-iso-countries**: MIT licence
- **Flag Icons**: MIT licence
- **MapLibre GL**: BSD licence (open-source)
- **MapTiler**: Komerční služba s bezplatnou úrovní

### "Kolik zemí projekt podporuje?"
Projekt podporuje všechny suverénní státy světa (195 podle OSN) plus některá závislá území. Přesný počet závisí na tom, jaké země jsou v databázi a v GeoJSON souborech.

---

## Technické detaily

### ISO kódy
Projekt používá standardní ISO 3166-1 kódy:
- **ISO 3166-1 Alpha-2**: Dvoupísmenné kódy (např. "CZ", "US")
- **ISO 3166-1 Alpha-3**: Třípísmenné kódy (např. "CZE", "USA")

### Normalizace dat
V kódu je implementována normalizace pro speciální případy:
- Somaliland je mapován na Somálsko (ISO kód "SOM")
- Zpracování závislých území a sporných území

### Optimalizace
- GeoJSON soubory jsou načítány jednou a cachovány v paměti
- REST Countries API volání jsou optimalizována - načítají se pouze potřebná pole
- Mapové dlaždice jsou cachovány MapTiler službou
