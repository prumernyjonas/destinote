# SQL Skripty pro Destinote

Tento adresář obsahuje SQL skripty pro nastavení databáze v Supabase.

## Pořadí spuštění skriptů

Spusťte skripty v následujícím pořadí v Supabase SQL Editoru:

### 1. `nickname_unique_constraint.sql`
Vytvoří:
- Funkci `slugify_nickname()` pro normalizaci nicknamů (odstranění diakritiky, malá písmena)
- Funkci `check_nickname_unique()` pro kontrolu unikátnosti
- Trigger `check_nickname_unique_trigger` pro automatickou kontrolu při INSERT/UPDATE
- Index pro rychlejší vyhledávání

**Důležité:** Tento skript musí být spuštěn PRVNÍ, protože další skripty na něj závisí.

### 2. `create_user_trigger.sql`
Vytvoří:
- Funkci `handle_new_user()` pro automatické vytvoření záznamu v `users` tabulce při registraci
- Trigger `on_auth_user_created` na `auth.users` tabulce

**Důležité:** Tento skript závisí na funkci `slugify_nickname()` z předchozího skriptu.

### 3. `rls_policies.sql`
Vytvoří RLS (Row Level Security) politiky pro:
- Tabulku `users`
- Tabulku `user_follows`

### 4. `migrate_notifications_for_0004.sql` (pokud tabulka notifications již existuje)
Přizpůsobí existující tabulku `notifications` pro feature 0004:
- Indexy pro rychlé dotazy podle recipient_id
- RLS politiky (SELECT, UPDATE) s recipient_id
- V případě potřeby přidejte enum hodnoty pro typy: article_approved, article_rejected, comment_new, comment_like, new_follower

## Co tyto skripty zajišťují

### Unikátnost nicknamů
- **Case-insensitive:** "Šmejd", "smejd", "SMEJD" jsou považovány za stejné
- **Bez diakritiky:** "Šmejd" a "Smejd" jsou považovány za stejné
- **Podle slugu:** Kontrola probíhá podle slugifikované verze (např. `/profil/smejd`)

### Automatické vytváření uživatelů
- Při registraci se automaticky vytvoří záznam v `users` tabulce
- Nickname se načte z `user_metadata`
- Kontrola unikátnosti proběhne automaticky

### Notifikace
- Tabulka `notifications` ukládá oznámení (schválení článků, komentáře, lajky, sledující)
- Uživatel vidí historii oznámení po přihlášení

## Řešení problémů

### Chyba: "function slugify_nickname does not exist"
**Řešení:** Spusťte nejprve `nickname_unique_constraint.sql` před `create_user_trigger.sql`.

### Chyba: "extension unaccent does not exist"
**Řešení:** Skript `nickname_unique_constraint.sql` používá manuální odstranění diakritiky pomocí `translate()`, takže nepotřebuje rozšíření `unaccent`.

### Chyba: "permission denied"
**Řešení:** Ujistěte se, že máte oprávnění k vytváření funkcí a triggerů v Supabase. V Supabase Dashboardu byste měli mít správná oprávnění automaticky.

## Testování

Po spuštění skriptů můžete otestovat:

1. **Registrace s duplicitním nicknamem:**
   - Zaregistrujte se s nicknamem "Šmejd"
   - Zkuste se zaregistrovat s nicknamem "smejd" nebo "SMEJD"
   - Měla by se zobrazit chyba o obsazeném nicknamu

2. **Kontrola API endpointu:**
   ```bash
   curl "http://localhost:3000/api/users/check-nickname?nickname=Šmejd"
   ```

3. **Kontrola v databázi:**
   ```sql
   SELECT nickname, slugify_nickname(nickname) as slug 
   FROM users 
   WHERE deleted_at IS NULL;
   ```
