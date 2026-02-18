# Notifikace – přehled a nastavení

## Co je implementované

Všechny níže uvedené typy notifikací jsou v kódu připravené a volají se z příslušných API:

| Typ | Kdy se vytvoří | Příjemce |
|-----|-----------------|----------|
| `new_follower` | Někdo vás začal sledovat | Sledovaný uživatel |
| `article_approved` | Admin schválil článek | Autor článku |
| `article_rejected` | Admin zamítl článek | Autor článku |
| `article_submitted` | Článek odeslán ke schválení | Autor (potvrzení) + všichni adminové/moderátoři |
| `article_like` | Někdo lajknul váš článek | Autor článku |
| `comment_new` | Nový komentář u článku / odpověď na váš komentář | Autor článku nebo autor parent komentáře |
| `comment_like` | Někdo lajknul váš komentář | Autor komentáře |

## Databáze – co udělat

1. **Enum `notification_type`**  
   Sloupec `notifications.type` musí mít všechny výše uvedené hodnoty. V Supabase SQL Editoru spusťte (podle skutečného názvu enumu, často `notification_type`):

   ```sql
   ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'article_approved';
   ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'article_rejected';
   ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'article_submitted';
   ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'article_like';
   ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'comment_new';
   ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'comment_like';
   ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_follower';
   ```

   Pokud Postgres nemá `IF NOT EXISTS` pro enum, spusťte jen ty hodnoty, které v enumu chybí (bez `IF NOT EXISTS`).

2. **Indexy a RLS**  
   Skript `docs/sql/migrate_notifications_for_0004.sql` doplňuje indexy a RLS politiky. Spusťte ho v pořadí podle `docs/sql/README.md`.

## API endpointy

- **Lajk článku:** `POST /api/articles/[id]/like` (přidat lajk), `DELETE /api/articles/[id]/like` (odebrat). Při přidání lajku dostane autor článku notifikaci `article_like` (pokud lajkuje někdo jiný než autor).

## UI

- Zvoník v navbaru – dropdown s notifikacemi a odkaz na „Oznámení“.
- Stránka **Nastavení → Oznámení** (`/nastaveni/oznameni`) – celá historie, filtrování vše / nepřečtené, označit vše jako přečtené.

## Testování – fungují oznámení?

V **developmentu** můžete vytvořit jednu testovací notifikaci:

1. Spusťte `npm run dev` a **v téže záložce** se přihlaste (Přihlásit / Login).
2. Nechte otevřenou stránku na `http://localhost:3000` (ne 127.0.0.1) a v téže záložce otevřete konzoli (F12 → Console).
3. Spusťte (zkopírujte celý blok včetně první a poslední řádky):
   ```js
   (async () => {
     const r = await fetch('/api/notifications/test', { method: 'POST', credentials: 'include' });
     const text = await r.text();
     let data;
     try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }
     console.log(r.status, data);
   })();
   ```
   Výstup uvidíte v konzoli: např. `200 { ok: true, message: "..." }` nebo při chybě `500 { error: "...", detail: "..." }`.
4. Měli byste dostat `{ ok: true, message: "..." }`. Pak klikněte na zvoník v navbaru nebo jděte na **Nastavení → Oznámení** – měla by se zobrazit notifikace „Test oznámení – Pokud toto vidíte, oznámení fungují.“

**Pokud dostanete 401 (Unauthorized):** session se k požadavku nedostala. Zkuste: (1) být opravdu přihlášeni v téže záložce, (2) stránku obnovit (F5) a pak znovu spustit skript, (3) používat adresu `http://localhost:3000` (ne `127.0.0.1`).

Endpoint `POST /api/notifications/test` existuje **pouze při NODE_ENV=development**; v produkci vrátí 404.

## Řešení problémů

- **INSERT do notifications selhává na sloupec `type`**  
  V databázi chybí příslušná hodnota v enumu. Přidejte ji příkazem `ALTER TYPE ... ADD VALUE` (viz výše).

- **Adminové nedostávají „článek ke schválení“**  
  Funkce `notifyAdmins` vybírá uživatele s `role IN ('admin', 'moderator')`. Zkontrolujte, že v tabulce `users` mají adminové a moderátoři tento role a že sloupec se jmenuje `role`.
