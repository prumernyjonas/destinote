# Code Review – Navbar (0001)

## 1) Implementace vs. plán

- Navbar vytvořen v `src/components/layout/Navbar.tsx` – ANO
- Integrace do `src/app/layout.tsx` nad všechny stránky – ANO
- Logo z `public/logo-destinote.png` – ANO
- Odkazy: Home, Země, Komunita, Letenky, Žebříček – ANO
- Stav přihlášení: tlačítko „Přihlásit se“ vs. avatar s iniciálou – ANO
- Klik na avatar → `/dashboard` – ANO
- Komunita → `/dashboard?tab=social` – ANO
- Přetrvání přihlášení (Firebase persistence) – JIŽ NASTAVENO dříve, funguje
- Placeholder stránky `/countries`, `/flights`, `/leaderboard` – ANO
- Dashboard čte `?tab=` a přepíná aktivní záložku – ANO

Závěr: Plán je implementován kompletně.

## 2) Zjevné chyby / problémy

- Nenašel jsem runtime chyby ani linter warningy pro přidané soubory.
- `Navbar` je client komponenta uvnitř `AuthProvider`; SSR/Hydration ok.

## 3) Jemné nesoulady / UX drobnosti

- Aktivace položky „Komunita“ je založena pouze na `pathname === '/dashboard'`. Pokud je uživatel na jiném dashboard tabu (např. mapa), bude „Komunita“ zvýrazněná, i když už nevidí sociální feed.
  - Návrh: v `Navbar` použít `useSearchParams()` a zvýraznit „Komunita“ pouze pokud `pathname === '/dashboard'` a `tab === 'social'`.
- Mobilní zobrazení: navigace je skryta na `< md` (class `hidden md:flex`). Na úzkých displejích tedy zůstane jen logo a pravá část. To odpovídá jednoduché variantě, ale zvážit později hamburger menu.
- Kontrast tlačítka login na světle modrém pozadí je vhodný, ale přidat `focus-visible` styly pro klávesovou navigaci by zlepšilo přístupnost.

## 4) Styl / konzistence

- Tailwind utility odpovídají zbytku kódu (používáme podobný přístup ve `dashboard`).
- Barvy: pevná `#cbe1f7` pro pozadí – OK vzhledem ke screenshotu; případně později přesun do Tailwind config jako custom barva.
- Avatar iniciála: používá bezpečné volání `?.charAt(0)?.toUpperCase()` – konzistentní s opravami chyb v projektu.

## 5) Over-engineering / velikost souborů

- `Navbar.tsx` je malý a čitelný. Žádné zbytečné refaktory, logika je přímá.

## 6) Doporučení k drobným úpravám (neblokující)

1. Zvýraznění „Komunita“ jen pro `tab=social`:
   - V `Navbar.tsx` přidat `const params = useSearchParams()` a pro položku „Komunita“ vypočítat `active` jako `pathname === '/dashboard' && params.get('tab') === 'social'`.
2. Přístupnost:
   - Přidat `role="navigation"` na `<nav>` a `aria-label="Hlavní"`.
   - Přidat `focus-visible:ring` styly pro odkazy a tlačítka.
3. Navigace aktivních odkazů:
   - Zvážit sjednocení logiky aktivních tříd do pomocné funkce, aby se snížilo duplikování ternárů.

## 7) Testy manuální

- Nepřihlášený uživatel: zobrazuje se tlačítko „Přihlásit se“, klik vede na `/auth/login` – OK.
- Přihlášený uživatel: avatar s iniciálou, klik vede na `/dashboard` – OK.
- Odkaz „Komunita“ → `/dashboard?tab=social`; po načtení dashboardu je aktivní sociální záložka – OK.
- Refresh stránky zachová přihlášení díky `browserLocalPersistence` – OK.

---

Celkově je implementace kvalitní, splňuje plán a je bez zjevných chyb. Doporučené úpravy jsou drobné a zaměřené na UX/přístupnost a přesnější aktivaci položky „Komunita“.
