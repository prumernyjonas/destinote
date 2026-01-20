# Otázky a odpovědi pro obhajobu - Zdroje dat

## Rychlý přehled

### 1. Odkud berete země na mapě?
**Odpověď:**
Země na mapě pocházejí z **Natural Earth Data** (naturalearthdata.com), což je veřejně dostupný zdroj geografických dat. Používáme GeoJSON soubory (`countries.json` a `countries-hd.json`) s geometriemi hranic všech zemí. Zobrazujeme je pomocí open-source knihovny MapLibre GL.

---

### 2. Odkud berete rozlohu, hlavní město, populaci?
**Odpověď:**
Tyto informace získáváme z **REST Countries API** (restcountries.com). Při zobrazení průvodce země voláme jejich API, které vrací aktuální data o:
- Populaci
- Hlavním městě
- Rozloze (v km²)
- Jazycích
- Měnách

Data se načítají dynamicky při každém zobrazení stránky, takže jsou vždy aktuální.

---

### 3. Jak zajišťujete české názvy zemí?
**Odpověď:**
České názvy získáváme z více zdrojů v tomto pořadí:
1. **Databáze Supabase** - tabulka `countries` obsahuje pole `name_cs`
2. **Knihovna i18n-iso-countries** - jako záložní zdroj pro překlady
3. Pokud ani jeden neobsahuje český název, použije se anglický

---

### 4. Jsou data aktuální?
**Odpověď:**
- **Geometrie zemí** (hranice): Statické soubory, aktualizujeme ručně při změnách
- **Informace o zemích** (populace, rozloha): Dynamicky z REST Countries API
  - REST Countries API je open-source projekt, který aktualizuje data podle potřeby
  - Populace se aktualizuje častěji (každý rok)
  - Statická data (hlavní město, rozloha) se aktualizují pouze při oficiálních změnách
  - Data se načítají při každém zobrazení stránky, takže uživatelé vidí nejnovější dostupná data
- **Seznam zemí**: V naší databázi, aktualizujeme ručně

---

### 4a. Jak často se aktualizují data z REST Countries API?
**Odpověď:**
REST Countries API nemá veřejně dokumentovaný pevný harmonogram aktualizací. Je to open-source projekt, který:
- Aktualizuje pouze nejnovější verzi API (v3.1, kterou používáme)
- Aktualizuje data podle potřeby - populace častěji, statická data zřídka
- V našem projektu načítáme data dynamicky při každém zobrazení stránky průvodce země, takže uživatelé vždy vidí nejnovější dostupná data z API

---

### 5. Kolik zemí projekt podporuje?
**Odpověď:**
Projekt podporuje všechny suverénní státy světa (195 podle OSN) plus některá závislá území. Přesný počet závisí na obsahu databáze a GeoJSON souborů.

---

### 6. Jak řešíte licenční podmínky?
**Odpověď:**
- **Natural Earth Data**: Volně dostupné pro komerční i nekomerční použití
- **REST Countries API**: Veřejné API bez autentizace, vhodné pro komerční použití
- **i18n-iso-countries**: MIT licence (open-source)
- **Flag Icons**: MIT licence (open-source)
- **MapLibre GL**: BSD licence (open-source)
- **MapTiler**: Komerční služba s bezplatnou úrovní

---

### 7. Jaké ISO kódy používáte?
**Odpověď:**
Používáme standardní ISO 3166-1 kódy:
- **Alpha-2**: Dvoupísmenné (CZ, US, DE)
- **Alpha-3**: Třípísmenné (CZE, USA, DEU)

Tyto kódy jsou mezinárodním standardem a používají se pro identifikaci zemí v celém projektu.

---

### 8. Jak řešíte sporná území nebo změny hranic?
**Odpověď:**
V kódu máme implementovanou normalizaci pro speciální případy. Například Somaliland je mapován na Somálsko. Pro sporná území se řídíme daty z Natural Earth Data, která jsou široce uznávaná v geografické komunitě.

---

## Klíčové body pro prezentaci

1. **Geografická data**: Natural Earth Data - veřejně dostupný, profesionální zdroj
2. **Statistické informace**: REST Countries API - aktuální, dynamické načítání
3. **Lokalizace**: Kombinace vlastní databáze a open-source knihovny
4. **Licence**: Všechny použité zdroje jsou vhodné pro komerční použití
5. **Aktualizace**: Kombinace statických a dynamických dat pro optimální výkon a aktuálnost

---

## Technické detaily (pokud se zeptají)

- **Formát dat**: GeoJSON pro geometrie, JSON pro API odpovědi
- **Mapová knihovna**: MapLibre GL (open-source alternativa k Mapbox)
- **Optimalizace**: GeoJSON se načítá jednou a cachuje, API volání jsou optimalizována
- **Databáze**: PostgreSQL na Supabase pro metadata o zemích
