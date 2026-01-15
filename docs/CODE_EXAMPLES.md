# Ukázky kódu z projektu Destinote

Tento dokument obsahuje reprezentativní ukázky kódu z různých částí projektu pro dokumentaci.

## 1. Frontend komponenty

### Hlavní stránka (Home Page)

```171:196:src/app/page.tsx
export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingArticles(true);
      try {
        const res = await fetch("/api/articles");
        if (!res.ok) throw new Error("Nepodařilo se načíst články");
        const data = await res.json();
        if (!cancelled) setArticles(data.items ?? []);
      } catch {
        if (!cancelled) setArticles([]);
      } finally {
        if (!cancelled) setLoadingArticles(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const articlePreview = useMemo(() => articles.slice(0, 3), [articles]);
```

### Navigační komponenta (Navbar)

```34:90:src/components/layout/Navbar.tsx
export default function Navbar() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [countriesOpen, setCountriesOpen] = useState(false);
  const countriesRef = useRef<HTMLDivElement | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const [mobileCountriesOpen, setMobileCountriesOpen] = useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const menuItems = [
    {
      label: "Můj profil",
      icon: FiUser,
      onClick: () => {
        setMenuOpen(false);
        router.push(`/profil/${user?.nicknameSlug || user?.uid}`);
      },
    },
    {
      label: "Nápověda",
      icon: FiHelpCircle,
      onClick: () => {
        setMenuOpen(false);
        router.push("/napoveda");
      },
    },
    {
      label: "Nastavení",
      icon: FiSettings,
      onClick: () => {
        setMenuOpen(false);
        router.push("/nastaveni");
      },
    },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);
```

## 2. Autentifikace

### Auth Hook (useAuth)

```29:81:src/hooks/useAuth.tsx
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        // 1) Eager rehydratace z cache (okamžitě, bez čekání na síť)
        const cached = authUtils.getCachedUser();
        if (isMounted && cached) {
          setUser(cached);
          // UI může pokračovat bez čekání na síť
          setLoading(false);
        }

        // 2) Síťové ověření aktuální session u Supabase
        const current = await authUtils.getCurrentUser();
        if (!isMounted) return;
        setUser(current);
        setError(null);
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Chyba při načítání uživatele:", err);
        setError(err.message);
        setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    const { data: subscription } = supabase.auth.onAuthStateChange(async () => {
      try {
        const current = await authUtils.getCurrentUser();
        if (!isMounted) return;
        setUser(current);
        setError(null);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message);
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      subscription?.subscription?.unsubscribe();
    };
  }, []);
```

### Login funkce

```83:95:src/hooks/useAuth.tsx
  const login = async (credentials: LoginCredentials) => {
    try {
      setError(null);
      setLoading(true);
      const userData = await authUtils.login(credentials);
      setUser(userData);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
```

## 3. API Routes (Next.js)

### Vytvoření článku (POST)

```15:70:src/app/api/articles/route.ts
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    let userId: string | null = userData?.user?.id ?? null;
    console.log("[articles.POST] start, cookieUserId:", userId || null);
    // Fallback: Bearer token z Authorization headeru (pokud chybí cookies)
    if (!userId) {
      const authHeader =
        req.headers.get("authorization") || req.headers.get("Authorization");
      const token = authHeader?.toLowerCase().startsWith("bearer ")
        ? authHeader.slice(7)
        : null;
      if (token)
        console.log("[articles.POST] bearer present (length)", token.length);
      if (token) {
        const admin = createAdminSupabaseClient();
        const { data: tokenUser } = await admin.auth.getUser(token);
        if (tokenUser?.user?.id) {
          userId = tokenUser.user.id;
          console.log("[articles.POST] resolved userId from bearer:", userId);
        }
      }
    }
    if (!userId) {
      console.warn("[articles.POST] Unauthorized - no userId");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const body = await req.json();
    const {
      title,
      summary,
      content,
      destination_id,
      main_image_url,
      main_image_public_id,
      main_image_width,
      main_image_height,
      main_image_alt,
    } = body || {};
    console.log("[articles.POST] payload:", {
      hasTitle: !!title,
      hasContent: !!content,
      hasSummary: !!summary,
      hasDest: !!destination_id,
      hasCover: !!main_image_url,
    });
    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: "Missing title or content" }),
        { status: 400 }
      );
    }
```

### Načtení článků (GET)

```122:189:src/app/api/articles/route.ts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "true";
  const following = searchParams.get("following") === "true";
  const friends = searchParams.get("friends") === "true";
  const authorId = searchParams.get("authorId"); // Pro načtení článků konkrétního autora
  const admin = createAdminSupabaseClient();

  // Helper pro získání userId
  async function resolveUserId(): Promise<string | null> {
    let userId: string | null = searchParams.get("userId");

    if (!userId) {
      const supabase = await createServerSupabaseClient();
      const { data: userData } = await supabase.auth.getUser();
      userId = userData?.user?.id ?? null;
    }

    if (!userId) {
      const authHeader =
        req.headers.get("authorization") || req.headers.get("Authorization");
      const token = authHeader?.toLowerCase().startsWith("bearer ")
        ? authHeader.slice(7)
        : null;
      if (token) {
        const adminAuth = createAdminSupabaseClient();
        const { data: tokenUser } = await adminAuth.auth.getUser(token);
        if (tokenUser?.user?.id) {
          userId = tokenUser.user.id;
        }
      }
    }

    return userId;
  }

  try {
    if (mine) {
      const userId = await resolveUserId();

      if (!userId) {
        console.log("[articles.GET] No userId found");
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        });
      }

      console.log("[articles.GET] Fetching articles for userId:", userId);
      const { data, error } = await admin
        .from("articles")
        .select("id, title, status, created_at, updated_at")
        .eq("author_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[articles.GET] Database error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
        });
      }

      console.log("[articles.GET] Found articles:", data?.length || 0, data);
      return new Response(JSON.stringify({ items: data ?? [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
```

## 4. Supabase integrace

### Server-side Supabase klient

```1:25:src/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // Korektně expirovat cookie; některé prohlížeče/hosty ignorují delete bez shody atributů
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );
}
```

### Client-side Supabase klient

```1:12:src/lib/supabase/client.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: typeof window !== "undefined",
  },
});
```

## 5. Mapy (MapLibre GL)

### Inicializace mapy

```23:38:src/components/VectorWorldMap.tsx
  useEffect(() => {
    if (!containerRef.current) return;
    // Trim whitespace, aby se předešlo chybám 403
    const apiKey = (process.env.NEXT_PUBLIC_MAPTILER_KEY || "").trim();
    if (!apiKey) {
      console.error("[VectorWorldMap] NEXT_PUBLIC_MAPTILER_KEY není nastaven!");
      return;
    }
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}&language=cs`,
      center: [0, 20],
      zoom: 2,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
```

### Získání českého názvu země

```40:68:src/components/VectorWorldMap.tsx
    // Bezpečné získání českého názvu regionu z ISO kódu (cache jedné instance DisplayNames)
    let _dn: Intl.DisplayNames | null = null;
    const regionName = (code?: string) => {
      if (!code) return undefined;
      try {
        // Normalizace pár neoficiálních / alternativních kódů z datasetů:
        // FX = Metropolitan France → FR, UK → GB, EL → GR (Řecko), XK = Kosovo (mimo standard, ponecháme)
        const normMap: Record<string, string> = {
          FX: "FR",
          UK: "GB",
          EL: "GR",
        };
        const c = (code || "").toUpperCase();
        const normalized = normMap[c] ?? c;
        _dn = _dn ?? new Intl.DisplayNames(["cs"], { type: "region" });
        let name = _dn.of(normalized) as string | undefined;
        // Bezpečné české fallbacky pro jistotu (kdyby DisplayNames vrátil undefined)
        const csFallbacks: Record<string, string> = {
          FR: "Francie",
          GR: "Řecko",
          GB: "Spojené království",
          XK: "Kosovo",
        };
        if (!name) name = csFallbacks[normalized];
        return name;
      } catch {
        return undefined;
      }
    };
```

## 6. Utility funkce

### Slugifikace

```1:12:src/utils/slugify.ts
/**
 * Slugifikace stringu - odstranění diakritiky a převod na malá písmena
 * Používá se pro URL-friendly verzi nickname
 */
export function slugifyNickname(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // odstranit diakritiku
    .toLowerCase()
    .replace(/\s+/g, "-") // mezery na pomlčky
    .replace(/[^a-z0-9-]/g, ""); // odstranit speciální znaky
}
```

### Slugifikace v API route

```6:13:src/app/api/articles/route.ts
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
```

## 7. TypeScript typy

### Auth typy

```1:19:src/hooks/useAuth.tsx
"use client";

// hooks/useAuth.ts
import {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase/client";
import { authUtils } from "@/utils/supabase";
import {
  User,
  AuthState,
  LoginCredentials,
  RegisterCredentials,
  AuthError,
} from "@/types/auth";
```

### Article typy

```36:44:src/app/page.tsx
type Article = {
  id: string;
  title: string;
  main_image_url: string | null;
  main_image_alt: string | null;
  slug: string;
  published_at: string | null;
  created_at: string;
};
```

## 8. Next.js konfigurace

### next.config.ts

```1:40:next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    // Allow Docker builds to complete even if ESLint finds errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip type errors during production builds (optional)
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
    ],
  },
  // Fix pro špatně odvozený kořen projektu při Turbopacku
  // (zabraňuje HMR chybám s global-error.js)
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
```

## 9. React komponenty s animacemi

### Použití Framer Motion

```206:237:src/app/page.tsx
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6 text-center lg:text-left order-2 lg:order-1"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-travel-200 shadow-lg"
              >
                <span className="text-lg">🌍</span>
                <span className="text-sm font-semibold text-gray-700">
                  Osobní cestovatelská mapa & komunita
                </span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight"
              >
                <span>
                  <GradientText
                    colors={["#006daa", "#0353a4", "#053772"]}
                    animationSpeed={7}
                  >
                    Objevuj místa. Ukládej zážitky
                  </GradientText>
                </span>
              </motion.h1>
```

## 10. Error handling

### Try-catch bloky v API routes

```112:119:src/app/api/articles/route.ts
  } catch (err: any) {
    const message =
      err?.message === "UNAUTHORIZED" ? "Unauthorized" : "Internal error";
    console.error("[articles.POST] handler error:", err?.message, err);
    return new Response(JSON.stringify({ error: message }), {
      status: message === "Unauthorized" ? 401 : 500,
    });
  }
```

### Error handling v React komponentách

```175:194:src/app/page.tsx
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingArticles(true);
      try {
        const res = await fetch("/api/articles");
        if (!res.ok) throw new Error("Nepodařilo se načíst články");
        const data = await res.json();
        if (!cancelled) setArticles(data.items ?? []);
      } catch {
        if (!cancelled) setArticles([]);
      } finally {
        if (!cancelled) setLoadingArticles(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);
```

## 11. Interaktivní mapa světa

### Kliknutí na zemi - Handler

```230:257:src/components/VectorWorldMap.tsx
      // Klik na stát: vybarví zeleně a vypíše název v češtině
      map.on("click", "countries-fill", (e) => {
        const feats = Array.isArray(e?.features) ? e.features : [];
        const feature = feats[0];
        if (!feature) return;
        const isoA2 = (feature.properties as any)?.ISO_A2 as string | undefined;
        const name =
          regionName(isoA2) || (feature.properties as any)?.ADMIN || "";
        if (name) console.log(name);
        const currentId = feature.id as number | string | undefined;
        if (currentId !== undefined) {
          if (selectedIdRef.current !== null) {
            map.setFeatureState(
              { source: "countries", id: selectedIdRef.current },
              { selected: false }
            );
          }
          map.setFeatureState(
            { source: "countries", id: currentId },
            { selected: true }
          );
          selectedIdRef.current = currentId;
          // persist + callback
          saveVisit(isoA2).catch(console.error);
          if (onCountrySelected)
            onCountrySelected((isoA2 || "")?.toUpperCase(), name);
        }
      });
```

### Přesměrování na detail země (PublicWorldMap)

```316:353:src/components/PublicWorldMap.tsx
      const onClick = (e: any) => {
        const f = e.features && e.features[0];
        if (!f) return;
        const props: any = f.properties || {};

        // Nová struktura dat: ISO3166-1-Alpha-2 a ISO3166-1-Alpha-3
        const rawName: string = props.name || props.NAME || "";
        const iso2Raw = props["ISO3166-1-Alpha-2"] || props.ISO_A2;
        const iso3Raw = props["ISO3166-1-Alpha-3"] || props.ISO_A3;

        let iso2: string | undefined;
        if (iso2Raw && typeof iso2Raw === "string" && iso2Raw.length === 2) {
          iso2 = iso2Raw.toUpperCase();
        } else if (iso3Raw && typeof iso3Raw === "string") {
          iso2 = (countries as any).alpha3ToAlpha2?.(iso3Raw.toUpperCase());
        }

        const czName = iso2 ? countries.getName(iso2, "cs") : undefined;
        const name: string = czName || rawName;
        const continentSlug = getContinentSlug(iso2);
        const countrySlug = slugify(name);
        const url = `/zeme/${continentSlug}/${countrySlug}`;

        const safeName = name.replace(/</g, "&lt;");
        const flag = iso2
          ? `<span class="fi fi-${iso2.toLowerCase()}" style="font-size:20px"></span>`
          : "";
        const html = `
          <div style="min-width:220px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              ${flag}
              <div style="font-weight:700;font-size:16px">${safeName}</div>
            </div>
            <a href="${url}" style="display:block;color:#16a34a;font-weight:700;text-decoration:none;margin:8px 0">ZOBRAZIT DETAIL ZEMĚ ▸</a>
            <a href="/community" style="display:block;color:#16a34a;font-weight:700;text-decoration:none">CESTOPISY A REPORTÁŽE ▸</a>
          </div>`;
        popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
      };

      map.on("click", "countries-public-fill", onClick);
```

## 12. Označování navštívených zemí

### Uložení návštěvy do databáze (API)

```54:168:src/app/api/visited/route.ts
export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: auth } = await supabase.auth.getUser();
    const sessionUserId = auth?.user?.id;
    const url = new URL(req.url);
    const qpUserId = url.searchParams.get("userId") || undefined;
    const fallbackUserId =
      req.headers.get("x-user-id") || qpUserId || undefined;
    // Preferuj explicitně předaný userId (hlavička/param) před session
    const userId = fallbackUserId || sessionUserId;
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const qpIso2 = url.searchParams.get("iso2");
    const payload = (await req.json().catch(() => ({}))) as { iso2?: string };
    const iso2 = ((qpIso2 || payload.iso2 || "") as string).toUpperCase();
    if (!iso2 || iso2.length !== 2) {
      return NextResponse.json(
        { ok: false, error: "Invalid iso2" },
        { status: 400 }
      );
    }

    // Použijeme admin klienta kvůli možným RLS omezením při INSERT/SELECT
    const admin = createAdminSupabaseClient();

    let { data: country, error: countryErr } = await admin
      .from("countries")
      .select("id, iso_code, name")
      .eq("iso_code", iso2)
      .maybeSingle();
    if (countryErr) {
      return NextResponse.json(
        { ok: false, error: countryErr.message },
        { status: 400 }
      );
    }
    if (!country?.id) {
      // Speciální fix: pokud FR/NO v tabulce chybí, vytvoř je on-the-fly
      if (iso2 === "FR" || iso2 === "NO") {
        const fallbackName = iso2 === "FR" ? "France" : "Norway";
        const continent = "Europe";
        const { data: inserted, error: insErr } = await admin
          .from("countries")
          .insert({ iso_code: iso2, name: fallbackName, continent })
          .select("id, iso_code, name")
          .maybeSingle();
        if (insErr && (insErr as any).code !== "23505") {
          return NextResponse.json(
            { ok: false, error: insErr.message },
            { status: 400 }
          );
        }
        // Po případném konfliktu zkusíme znovu načíst
        const retry = await admin
          .from("countries")
          .select("id, iso_code, name")
          .eq("iso_code", iso2)
          .maybeSingle();
        country = retry.data || inserted || null;
      }
      if (!country?.id) {
        return NextResponse.json(
          { ok: false, error: "Country not found" },
          { status: 404 }
        );
      }
    }

    const { error: upsertErr } = await admin
      .from("user_visited_countries")
      .upsert(
        {
          user_id: userId,
          country_id: country.id,
          visited_at: new Date().toISOString(),
        },
        { onConflict: "user_id,country_id" }
      );
    if (upsertErr) {
      return NextResponse.json(
        { ok: false, error: upsertErr.message },
        { status: 400 }
      );
    }

    // Recalculate and upsert aggregate count for the user
    try {
      const { count } = await admin
        .from("user_visited_countries")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      await admin.from("user_country_counts").upsert(
        {
          user_id: userId,
          countries_count: typeof count === "number" ? count : 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    } catch (e) {
      // swallow aggregate update error to not fail the main request
      console.warn("[visited:POST] aggregate update failed", e);
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
```

### Utility funkce pro ukládání návštěvy

```102:190:src/utils/supabase-db.ts
  // Uložení návštěvy dle ISO2 kódu do tabulky user_visited_countries
  async saveVisitIso(userId: string, iso2: string) {
    const wantedIso = iso2.toUpperCase();
    // 1) Najít country_id podle ISO kódu
    let countryId: string | null = null;
    // 1a) Přímé vyhledání podle iso_code
    const { data: found, error: findErr } = await supabase
      .from("countries")
      .select("id")
      .eq("iso_code", wantedIso)
      .maybeSingle();
    if (!findErr && found?.id) {
      countryId = found.id as string;
    }
    // 1b) Pokud nenalezeno, zkusit přes i18n-iso-countries
    if (!countryId) {
      const nameFallback: Record<string, string> = {
        FR: "France",
        NO: "Norway",
      };
      const englishName =
        countriesLib.getName(wantedIso, "en") ||
        nameFallback[wantedIso] ||
        wantedIso;
      const { data: byName, error: nameErr } = await supabase
        .from("countries")
        .select("id")
        .ilike("name", englishName)
        .maybeSingle();
      if (!nameErr && byName?.id) {
        countryId = byName.id as string;
      }
    }
    // 1c) Poslední fallback – vytvořit záznam, pokud chybí (jen FR/NO)
    if (!countryId && (wantedIso === "FR" || wantedIso === "NO")) {
      const englishName =
        countriesLib.getName(wantedIso, "en") ||
        nameFallback[wantedIso] ||
        wantedIso;
      const insertPayload = {
        iso_code: wantedIso,
        name: englishName,
        continent: "Europe",
      };
      const { data: ins, error: insErr } = await supabase
        .from("countries")
        .insert(insertPayload)
        .select("id")
        .maybeSingle();
      if (!insErr && ins?.id) {
        countryId = ins.id as string;
      } else if (insErr && (insErr as any).code === "23505") {
        // unikátní konflikt – zkusit znovu vyhledat
        const retry = await supabase
          .from("countries")
          .select("id")
          .eq("iso_code", wantedIso)
          .maybeSingle();
        if (!retry.error && retry.data?.id) {
          countryId = retry.data.id as string;
        }
      }
    }
    if (!countryId) {
      throw new Error("Země s daným ISO kódem nebyla nalezena");
    }

    // 2) Upsert do user_visited_countries podle složeného klíče
    const { error } = await supabase.from("user_visited_countries").upsert(
      {
        user_id: userId,
        country_id: countryId,
        visited_at: new Date().toISOString(),
      },
      { onConflict: "user_id,country_id" }
    );
    if (error) {
      throw new Error(error.message);
    }
  },
```

**Klíčové body:**

- **Upsert s `onConflict`** - zabraňuje duplicitám pomocí složeného klíče `(user_id, country_id)`
- **Vazební tabulka** `user_visited_countries` pro many-to-many vztah mezi uživateli a zeměmi
- **Automatický přepočet** agregovaných statistik v `user_country_counts`

## 13. Tvorba článků uživatelem

### Formulář pro vytvoření článku

```91:200:src/app/clanek/novy/page.tsx
  async function onSubmit(
    e: React.SyntheticEvent<HTMLFormElement>,
    submitForApproval: boolean = false
  ) {
    e.preventDefault();
    console.log(
      "[new-article] submit start, submitForApproval:",
      submitForApproval
    );
    if (!title || !content) {
      setError("Vyplňte prosím název a obsah.");
      return;
    }
    if (submitForApproval) {
      setSubmitting(true);
      // Zobrazit animaci hned na začátku
      setShowSubmissionAnimation(true);
      setSubmissionSuccess(false);
    } else {
      setSaving(true);
    }
    setError(null);
    try {
      console.log("[new-article] getting session...");

      // Zkusíme získat token z localStorage (rychlejší a spolehlivější)
      let accessToken: string | null = getAccessTokenFromStorage();
      console.log("[new-article] token from storage:", !!accessToken);

      // Pokud není v localStorage, zkusíme getSession s timeoutem
      if (!accessToken) {
        try {
          const sessionResult = await Promise.race([
            supabase.auth.getSession(),
            new Promise<{ data: { session: any } }>((resolve) =>
              setTimeout(
                () => resolve({ data: { session: null } } as any),
                3000
              )
            ),
          ]);
          accessToken = sessionResult?.data?.session?.access_token || null;
          console.log("[new-article] token from getSession:", !!accessToken);
        } catch (err) {
          console.warn("[new-article] getSession error:", err);
        }
      }

      // Pokud stále nemáme token, zkusíme getUser
      if (!accessToken) {
        try {
          const userResult = await Promise.race([
            supabase.auth.getUser(),
            new Promise<{ data: { user: any } }>((resolve) =>
              setTimeout(() => resolve({ data: { user: null } } as any), 3000)
            ),
          ]);
          // getUser nevrací token přímo, ale můžeme zkusit znovu getSession
          if (userResult?.data?.user) {
            const sessionResult = await supabase.auth.getSession();
            accessToken = sessionResult?.data?.session?.access_token || null;
          }
        } catch (err) {
          console.warn("[new-article] getUser error:", err);
        }
      }

      if (!accessToken) {
        setError("Nepodařilo se ověřit přihlášení. Zkuste se prosím odhlásit a přihlásit znovu.");
        if (submitForApproval) {
          setSubmitting(false);
          setShowSubmissionAnimation(false);
        } else {
          setSaving(false);
        }
        return;
      }

      // Nahrání obrázku na Cloudinary (pokud je vybrán)
      let mainImageUrl: string | null = null;
      let mainImagePublicId: string | null = null;
      let mainImageWidth: number | null = null;
      let mainImageHeight: number | null = null;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("alt", coverAlt || title);

        const uploadRes = await fetch("/api/images/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({}));
          throw new Error(
            errorData.error || "Nepodařilo se nahrát obrázek. Zkuste to prosím znovu."
          );
        }

        const uploadData = await uploadRes.json();
        mainImageUrl = uploadData.url || null;
        mainImagePublicId = uploadData.public_id || null;
        mainImageWidth = uploadData.width || null;
        mainImageHeight = uploadData.height || null;
      }
```

### Validace a vytvoření slug

```6:13:src/app/api/articles/route.ts
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
```

### Uložení článku s obrázkem

```72:111:src/app/api/articles/route.ts
    const admin = createAdminSupabaseClient();
    const baseSlug = slugify(title);

    const toInsert = {
      author_id: userId,
      destination_id: destination_id ?? null,
      title,
      slug: baseSlug,
      summary: summary ?? null,
      content,
      status: "draft",
    };
    // pokud dorazila cover metadata, vložíme je rovnou
    if (main_image_url) (toInsert as any).main_image_url = main_image_url;
    if (main_image_public_id)
      (toInsert as any).main_image_public_id = main_image_public_id;
    if (typeof main_image_width !== "undefined")
      (toInsert as any).main_image_width =
        main_image_width === null ? null : Number(main_image_width);
    if (typeof main_image_height !== "undefined")
      (toInsert as any).main_image_height =
        main_image_height === null ? null : Number(main_image_height);
    if (typeof main_image_alt !== "undefined")
      (toInsert as any).main_image_alt =
        main_image_alt === null ? null : String(main_image_alt);
    const { data, error } = await admin
      .from("articles")
      .insert(toInsert)
      .select("id, slug")
      .single();
    if (error) {
      console.error("[articles.POST] insert error:", error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
    console.log("[articles.POST] created:", { id: data.id, slug: data.slug });
    return new Response(JSON.stringify({ id: data.id, slug: data.slug }), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
```

**Klíčové body:**

- **Validace** - kontrola povinných polí (title, content)
- **Nahrání obrázku** na Cloudinary před uložením článku
- **Automatické generování slug** z názvu článku
- **Metadata obrázku** (URL, public_id, rozměry) se ukládají do databáze

## 14. Komentáře a odpovědi

### Algoritmus zobrazení vláken komentářů

```93:117:src/app/api/articles/[id]/comments/route.ts
  // sestavíme jednoduchý strom (max 1 úroveň odpovědí)
  const byId = new Map(
    list.map((c) => [
      c.id,
      {
        ...c,
        replies: [] as any[],
      },
    ])
  );
  const roots: any[] = [];
  for (const c of byId.values()) {
    if (c.parent_id) {
      const parent = byId.get(c.parent_id);
      if (parent) parent.replies.push(c);
    } else {
      roots.push(c);
    }
  }

  return new Response(JSON.stringify({ items: roots }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
```

### Rekurzivní zobrazení komentářů s odpověďmi

```356:468:src/components/articles/ArticleComments.tsx
function CommentThread({
  comment,
  currentUserId,
  onReply,
  onDelete,
  deletingId,
  replyingTo,
  replyBody,
  setReplyBody,
  onSubmitReply,
  depth,
}: {
  comment: CommentItemType;
  currentUserId?: string | null;
  onReply: (id: string) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  replyingTo: string | null;
  replyBody: string;
  setReplyBody: (v: string) => void;
  onSubmitReply: (e: React.FormEvent, targetId: string) => void;
  depth: number;
}) {
  const canReply = depth < 1; // max 1 úroveň odpovědí
  const isChild = depth > 0;
  const wrapperCls = isChild
    ? "space-y-2"
    : "py-3 border-b border-gray-200 space-y-3";
  return (
    <div className={wrapperCls}>
      <CommentItem comment={comment} />
      <div className="mt-1 flex gap-3 text-sm">
        {currentUserId === comment.author_id && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(comment.id)}
            loading={deletingId === comment.id}
            disabled={deletingId === comment.id}
            className="cursor-pointer"
          >
            Smazat
          </Button>
        )}
        {canReply && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReply(comment.id)}
            className="cursor-pointer"
          >
            Odpovědět
          </Button>
        )}
      </div>

      {replyingTo === comment.id && canReply && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmitReply(e, comment.id);
          }}
          className="mt-3 space-y-2"
        >
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
            placeholder="Napište odpověď…"
          />
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setReplyBody("");
                onReply(""); // reset
              }}
              className="cursor-pointer"
            >
              Zrušit
            </Button>
            <Button type="submit" size="sm" className="cursor-pointer">
              Odeslat odpověď
            </Button>
          </div>
        </form>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3 border-l border-gray-200 pl-4">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onDelete={onDelete}
              deletingId={deletingId}
              replyingTo={replyingTo}
              replyBody={replyBody}
              setReplyBody={setReplyBody}
              onSubmitReply={onSubmitReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Klíčové body:**

- **parent_id** - odkaz na nadřazený komentář (null = kořenový komentář)
- **Rekurzivní struktura** - komentáře mají pole `replies[]` s odpověďmi
- **Max 1 úroveň** - `depth < 1` omezuje zanoření na jednu úroveň
- **Stromová struktura** - Map pro efektivní propojení parent-child vztahů

## 15. Sledování uživatelů

### Follow funkce (API)

```6:66:src/app/api/users/[id]/follow/route.ts
// POST - Začít sledovat uživatele
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const currentUserId = await getUserIdFromRequest(req);

    if (!currentUserId) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    // Validace: nemůže sledovat sám sebe
    if (currentUserId === targetUserId) {
      return NextResponse.json(
        { error: "Nemůžete sledovat sami sebe" },
        { status: 400 }
      );
    }

    const admin = createAdminSupabaseClient();

    // Ověřit, že cílový uživatel existuje
    const { data: targetUser, error: targetError } = await admin
      .from("users")
      .select("id")
      .eq("id", targetUserId)
      .is("deleted_at", null)
      .maybeSingle();

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: "Uživatel nenalezen" },
        { status: 404 }
      );
    }

    // Upsert - vložit nebo ignorovat pokud už existuje
    const { error } = await admin.from("user_follows").upsert(
      {
        follower_id: currentUserId,
        following_id: targetUserId,
        created_at: new Date().toISOString(),
      },
      { onConflict: "follower_id,following_id" }
    );

    if (error) {
      console.error("Follow error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("POST /api/users/[id]/follow error:", err);
    return NextResponse.json(
      { error: err.message || "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
```

### Unfollow funkce (API)

```68:102:src/app/api/users/[id]/follow/route.ts
// DELETE - Přestat sledovat uživatele
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const currentUserId = await getUserIdFromRequest(req);

    if (!currentUserId) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const admin = createAdminSupabaseClient();

    const { error } = await admin
      .from("user_follows")
      .delete()
      .eq("follower_id", currentUserId)
      .eq("following_id", targetUserId);

    if (error) {
      console.error("Unfollow error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/users/[id]/follow error:", err);
    return NextResponse.json(
      { error: err.message || "Interní chyba serveru" },
      { status: 500 }
    );
  }
}
```

### Utility funkce pro sledování

```324:349:src/utils/supabase-db.ts
  async followUser(currentUserId: string, targetUserId: string): Promise<void> {
    if (currentUserId === targetUserId) {
      throw new Error("Nemůžete sledovat sami sebe");
    }
    const { error } = await supabase.from("user_follows").upsert(
      {
        follower_id: currentUserId,
        following_id: targetUserId,
        created_at: new Date().toISOString(),
      },
      { onConflict: "follower_id,following_id" }
    );
    if (error) throw new Error(error.message);
  },

  async unfollowUser(
    currentUserId: string,
    targetUserId: string
  ): Promise<void> {
    const { error } = await supabase
      .from("user_follows")
      .delete()
      .eq("follower_id", currentUserId)
      .eq("following_id", targetUserId);
    if (error) throw new Error(error.message);
  },
```

**Klíčové body:**

- **Vazební tabulka** `user_follows` s složeným primárním klíčem `(follower_id, following_id)`
- **Upsert s `onConflict`** - zabraňuje duplicitám automaticky
- **Validace** - uživatel nemůže sledovat sám sebe
- **Kontrola existence** cílového uživatele před vytvořením vztahu

## Shrnutí

Tyto ukázky kódu demonstrují:

- **React komponenty** s hooks a state managementem
- **Next.js App Router** s server-side a client-side komponentami
- **API routes** s autentifikací a databázovými dotazy
- **Supabase integraci** pro autentifikaci a databázi
- **MapLibre GL** pro interaktivní mapy
- **TypeScript** pro type safety
- **Error handling** a loading stavy
- **Animace** s Framer Motion
- **Utility funkce** pro běžné operace
- **Interaktivní mapy** s kliknutím a přesměrováním
- **Datové relace** s vazebními tabulkami a upsert operacemi
- **Formuláře** s validací a nahráváním souborů
- **Algoritmické struktury** pro stromy komentářů
- **Sociální funkce** se sledováním uživatelů
