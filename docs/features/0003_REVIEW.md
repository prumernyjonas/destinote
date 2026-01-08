# 0003 – Code Review: Sledování uživatelů a veřejné profily

## Shrnutí

Implementace funkce sledování uživatelů je **z větší části správná** a odpovídá plánu. Nicméně bylo nalezeno několik problémů, které je třeba opravit.

---

## ✅ Správně implementováno

### Fáze 1 – Datová vrstva

- ✅ Prisma schema `user_follows` s composite PK
- ✅ Relace `followers`/`following` v modelu `users`
- ✅ RLS politiky pro `user_follows` včetně pravidla `follower_id != following_id`
- ✅ Typy `UserFollow`, `PublicProfile`, `FollowListItem` v `database.ts`

### Fáze 2A – API

- ✅ `POST/DELETE /api/users/[id]/follow` - validace self-follow, upsert
- ✅ `GET /api/users/[id]` - načítá profil podle ID nebo nicknamu
- ✅ `GET /api/users/[id]/followers` a `/following`
- ✅ `GET /api/users/[id]/friends` s fallback pro chybějící RPC
- ✅ Articles API rozšířeno o `following` a `friends` filtry

### Fáze 2B – UI

- ✅ `FollowButton` komponenta s hover efektem
- ✅ `FollowersModal` komponenta
- ✅ Stránka `/profil/[nickname]` s profilem, články, zeměmi
- ✅ Dashboard s klikatelnými počty followers
- ✅ Community page s taby "Sleduji" a "Přátelé"

### Fáze 2C – Utility

- ✅ `getUserStats` aktualizován pro reálné počty z `user_follows`
- ✅ `getFollowCounts`, `isFollowing`, `followUser`, `unfollowUser`

---

## 🐛 Nalezené problémy

### 1. KRITICKÝ: Profil stránka - Články se nenačítají

**Soubor:** `src/app/profil/[nickname]/page.tsx` (řádky 65-71)

**Problém:** API volání používá parametr `authorId`, který articles API nepodporuje:

```typescript
const articlesRes = await fetch(
  `/api/articles?authorId=${userId}&status=approved`
);
```

**Řešení:** Articles API (`/api/articles/route.ts`) nepodporuje parametr `authorId`. Je třeba buď:

- A) Přidat podporu `authorId` do articles API, nebo
- B) Vytvořit nový endpoint pro články uživatele, nebo
- C) Použít existující `mine=true` s admin přístupem

### 2. STŘEDNÍ: Dashboard link na profil používá UUID místo nickname

**Soubor:** `src/app/dashboard/page.tsx` (řádek 431)

```typescript
<Link href={`/profil/${user?.uid}`}>
```

**Problém:** URL obsahuje UUID místo nickname. Sice to funguje (API podporuje obojí), ale:

- URL není čitelná pro uživatele
- Horší pro SEO
- Nedá se sdílet jako "vanity URL"

**Řešení:** Načíst nickname uživatele a použít ho v URL:

```typescript
<Link href={`/profil/${user?.nickname || user?.uid}`}>
```

### 3. STŘEDNÍ: Followers/Following API nekontroluje deleted_at

**Soubory:**

- `src/app/api/users/[id]/followers/route.ts`
- `src/app/api/users/[id]/following/route.ts`

**Problém:** Při načítání seznamu sledujících/sledovaných se nekontroluje, zda uživatelé nejsou smazáni (soft delete).

**Řešení:** Přidat filtr `.is("deleted_at", null)` nebo filtrovat v mapování.

### 4. NÍZKÁ: FollowButton size prop nekonzistence

**Soubor:** `src/components/profile/FollowButton.tsx`

```typescript
size?: "sm" | "default";  // FollowButton
size?: "sm" | "md" | "lg"; // Button komponenta
```

**Problém:** FollowButton definuje `"default"`, ale Button komponenta očekává `"md"`.

**Řešení:** Mapovat `"default"` na `"md"`:

```typescript
<Button size={size === "default" ? "md" : size} ... />
```

### 5. NÍZKÁ: Community "Top" tab není implementován

**Soubor:** `src/app/community/page.tsx`

**Problém:** Tab "Top" se chová stejně jako "Feed" - načítá všechny články bez řazení podle popularity.

**Řešení:** Implementovat řazení podle `likes_count` nebo jiného kritéria.

### 6. NÍZKÁ: Chybějící utility funkce z plánu

**Plán specifikoval:**

```typescript
getFollowers(userId: string): Promise<PublicProfile[]>
getFollowing(userId: string): Promise<PublicProfile[]>
getFriends(userId: string): Promise<PublicProfile[]>
```

**Realita:** Tyto funkce nebyly implementovány v `supabase-db.ts`, protože se volají API přímo z komponent. To je v pořádku, ale je to odchylka od plánu.

---

## 🔍 Potenciální problémy s daty

### Snake_case vs camelCase konzistence

API vrací data v snake_case (např. `avatar_url`, `first_name`), což je správně mapováno na camelCase v TypeScript typech. ✅

### Nullable fields

- `bio` může být `null` - správně ošetřeno v UI ✅
- `avatarUrl` může být `null` - správně ošetřeno s fallback initiály ✅

---

## 📝 Doporučení

1. **Opravit kritický bug s články na profilu** - články uživatele se nyní nezobrazují
2. **Přidat deleted_at filtr** do followers/following API
3. **Zvážit přidání nickname do user objektu** v auth hooku pro čistší URL
4. **Implementovat "Top" tab** v community nebo ho odstranit
5. **Zvážit pagination** pro velké seznamy sledujících (nyní se načítají všichni najednou)

---

## ✅ Závěr

Implementace je funkční a pokrývá většinu požadavků z plánu. ~~**Kritický bug s články na profilu** musí být opraven před nasazením.~~ Ostatní problémy jsou kosmetické nebo nízké priority.

**Hodnocení: 7/10 → 8.5/10** - solidní implementace po opravách.

---

## 🔧 Opravy provedené po review

1. ✅ **KRITICKÝ: Articles API** - Přidána podpora `authorId` parametru pro načtení článků konkrétního autora
2. ✅ **STŘEDNÍ: Followers/Following API** - Přidán filtr `deleted_at` pro skrytí smazaných uživatelů
3. ✅ **NÍZKÁ: FollowButton** - Opraveno mapování size prop `"default"` → `"md"`
