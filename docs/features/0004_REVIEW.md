# Code Review – 0004 Notifikace

## Shrnutí

Implementace notifikací je funkční, ale bylo odchýleno od původního plánu kvůli existujícímu schématu databáze (recipient_id, payload, is_read místo user_id, title/body/link, read_at). Nalezeny a opraveny chyby v comment_like (chybějící article_id). Zbývají doporučení pro zlepšení.

---

## 1. Soulad s plánem

### Implementováno
- ✅ API: GET /api/notifications, PATCH [id]/read, POST read-all, GET unread-count
- ✅ Volání createNotification v: approve, reject, comments, like, follow, submit
- ✅ UI: Navbar zvoněk, NotificationDropdown, NotificationSettings s paginací
- ✅ Typy NotificationType, Notification
- ✅ Algoritmus komentářů (autor článku / parent)

### Odchylky (kvůli existujícímu schématu)
- Tabulka používá `recipient_id` místo `user_id`, `payload` (JSONB) místo title/body/link, `is_read` místo `read_at`
- Migrace `migrate_notifications_for_0004.sql` místo `create_notifications.sql`
- Bez RLS politiky pro INSERT (service role)

### Rozšíření mimo plán
- `article_submitted` – notifikace pro adminy i autora při odeslání článku ke schválení

---

## 2. Opravené chyby

### 2.1 comment_like – chybějící article_id v metadata
**Problém:** `buildCommentLikeNotification` neposílal `article_id` v metadata. `createNotification` potřebuje `meta.article_id` pro sloupec `article_id` v DB.

**Oprava:** Přidán `articleId` do payloadu a `article_id` do metadata v `buildCommentLikeNotification`. Route like předává `comment.article_id`.

---

## 3. Doporučení a drobné problémy

### 3.1 Zvoněk na mobilu
Plán: „vedle Search Icon (pouze pro přihlášené)“. Ikona je na desktopu. Na mobilu přidán odkaz „Oznámení“ s badge v uživatelském menu (vedle Nastavení).

### 3.2 Načítání unread count při mount
Navbar volá `fetchUnreadCount()` při mount, ale `displayUser` může být ještě null. Používá se `mounted && displayUser` – v pořádku. Efekt by měl běžet jen když je uživatel přihlášen.

### 3.3 NotificationSettings – handleItemClick bez await
`markAsRead(n.id)` se volá bez await. Při rychlé navigaci může dojít k odchodu ze stránky před dokončením PATCH. Doporučeno: `await markAsRead(n.id)` nebo ponechat optimistickou aktualizaci (PATCH běží na pozadí).

### 3.4 Možný hydration mismatch – formatTime
`formatTime` používá `date.toLocaleDateString("cs-CZ")`. Pokud by se volalo při SSR, může se lišit od klienta. NotificationDropdown se renderuje jen při `isOpen`, takže jde jen o client-side – OK.

### 3.5 Enum typů v databázi
Pokud `type` v `notifications` používá enum bez hodnoty `article_submitted`, INSERT selže. Je potřeba spustit migraci/enum update:

```sql
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'article_submitted';
```

---

## 4. Data alignment (snake_case vs camelCase)

- API vrací `Notification` s camelCase (userId, readAt, createdAt) – správně.
- `mapRow` převádí `recipient_id` → `userId`, `is_read` → `readAt` – správně.
- `payload` v DB je JSONB; `title`, `body`, `link` jsou uvnitř – správně.

---

## 5. Styl a konzistence

- Komponenty odpovídají zbytku projektu (Tailwind, struktura).
- Použití `credentials: "include"` u fetch – konzistentní s ostatními API voláními.

---

## 6. Závěr

Implementace je funkční po opravě `article_id` u comment_like. Zbývá doplnit zvoněk do mobilního menu a případně ošetřit enum v databázi, pokud notifikace nefungují.
