## 0002 – Code Review (Uživatelské články, komentáře, moderace)

Krátké zhodnocení: Funkční základ je implementován: DB úpravy (cover, parent_id, comment_likes), kompletní API (články, komentáře, admin), Cloudinary podpis a základní UI (nový/editační formulář, „Moje články“, admin seznamy). Níže jsou drobné nesoulady vůči zadání a doporučení ke zlepšení.

### 1) Implementace vs. plán

- Prisma: přidáno `main_image_*` do `articles`, `parent_id` do `comments`, nová tabulka `comment_likes` – OK.
- Cloudinary: přidán host do `next.config.ts`, podpisový endpoint `api/images/signature` – OK.
- API:
  - Články: create/get/update/submit/cover/photos – OK.
  - Komentáře: list/create + delete, like/unlike – OK.
  - Admin: list článků s filtry, approve/reject, list/delete komentářů – OK.
- UI:
  - „Moje články“ – přidány statusy a navigace na new/edit – OK.
  - Editor – title/summary/content, upload cover přes `CldUploadWidget` – OK.
  - Admin – schvalování článků a mazání komentářů – OK.

### 2) Potenciální chyby / rizika

- Zobrazení statusu v „Moje články“ není mapováno na pojmenování „published“: ukáže se surové `approved`. V UI se plánovala prezentace „published“.
  - Viz:

```52:60:src/components/dashboard/ArticlesList.tsx
<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
  {article.status ?? "draft"}
</span>
```

- Admin stránky (UI) nejsou chráněné middlewarem/redirectem. API je sice chráněné rolí, ale kdokoli může vidět admin UI shell. Doporučeno přidat server-side ochranu (např. `middleware.ts` nebo server component guard s redirectem).
- `/api/comments/[id]/like` neověřuje existenci komentáře (jen technická drobnost). V praxi nevadí, ale lze doplnit kontrolu existence pro čistotu.

### 3) Datové (de)normalizační a alignment detaily

- Zadání říká, že se mají ukládat i `public_id` pro všechny obrázky (cover i galerie). Cover má `main_image_public_id` – OK. U galerie se `public_id` do DB neukládá, protože `article_photos` model neobsahuje sloupec pro `public_id`.
  - Aktuální schema `article_photos`:

```127:136:prisma/schema.prisma
model article_photos {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  article_id String   @db.Uuid
  author_id  String   @db.Uuid
  url        String
  alt        String?
  width      Int?
  height     Int?
  created_at DateTime @default(now()) @db.Timestamptz(6)
```

- Doporučení: přidat `public_id String?` do `article_photos`, a v endpointu `/api/articles/[id]/photos` ukládat i `public_id`.
- `dbUtils.getArticles` natahuje `status` a předává ho do `Article` typu jako `status?:`. OK, ale pozor na vyrovnání názvosloví „approved vs published“ v UI (viz výše).

### 4) Jednoduchá rozšíření / refaktoring

- Mapování statusu pro UI: přidat utilitu (např. `mapArticleStatusToLabel`) a použít ji v `ArticlesList` i jinde.
- Admin UI: rozdělit do menších komponent (řádky tabulky atp.), až poroste rozsah. Zatím velikost souborů OK.
- `isAdmin` nyní vrací true i pro `moderator`. Zadání říká, že admin schvaluje články a moderuje komentáře. Pokud „moderator“ nemá mít stejné pravomoci, zúžit kontrolu jen na `admin`.

### 5) Bezpečnost a provozní poznámky

- Všechny mutační routy používají serverový Supabase admin klient – vyžadují `SUPABASE_SERVICE_ROLE_KEY` bezpečně uložený v serverových env. OK.
- Doporučeno přidat rate limiting (např. middleware) pro POST/DELETE routy (komentáře/like).
- U Cloudinary uploadů je podpisový endpoint v pořádku; dbejte na to, aby se API secret nikdy nedostalo do klienta (je pouze v server route).

### 6) Shrnutí a doporučené akce

- [UI] Mapovat `approved` → „published“ v zobrazení statusu.
- [DB/API] Přidat `public_id` do `article_photos` a ukládat jej při přidávání fotek.
- [Auth/UI] Přidat ochranu admin stránek (middleware/redirect).
- [Role] Rozhodnout, zda `moderator` má mít admin pravomoci; případně upravit `isAdmin`.
