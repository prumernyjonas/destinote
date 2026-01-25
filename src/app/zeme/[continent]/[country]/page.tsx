import countries from "i18n-iso-countries";
import cs from "i18n-iso-countries/langs/cs.json";
import type { Metadata } from "next";
import Link from "next/link";
import CountryGuide from "@/components/guides/CountryGuide";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

// Zajistit, že se stránka vždy načte s čerstvými daty (kvůli stavu navštívených zemí)
export const dynamic = "force-dynamic";

// Registrace českého locale (na serveru stačí jednou, chráněno try-catch)
try {
  countries.registerLocale(cs as any);
} catch {}

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveCountryBySlug(countrySlug: string): {
  iso2?: string;
  name?: string;
} {
  const czNamesMap = countries.getNames("cs") as Record<string, string>;
  for (const [iso2, name] of Object.entries(czNamesMap)) {
    if (slugify(name) === countrySlug) {
      return { iso2: iso2.toUpperCase(), name };
    }
  }
  return {};
}

function continentLabelFromSlug(slug: string): string {
  const s = slug.toLowerCase();
  if (s === "asie") return "Asie";
  if (s === "evropa") return "Evropa";
  if (s === "afrika") return "Afrika";
  if (s === "australie") return "Austrálie & Oceánie";
  if (s === "severni-amerika") return "Severní Amerika";
  if (s === "jizni-amerika") return "Jižní Amerika";
  if (s === "antarktida") return "Antarktida";
  if (s === "svet") return "Svět";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Mapování kontinentu z databáze na český název
function continentFromDbToLabel(continent: string | null | undefined): string {
  if (!continent) return "Svět";
  const c = continent.toLowerCase();
  if (c === "africa" || c === "afrika") return "Afrika";
  if (c === "europe" || c === "evropa") return "Evropa";
  if (c === "asia" || c === "asie") return "Asie";
  if (c === "australia" || c === "oceania" || c === "australie")
    return "Austrálie & Oceánie";
  if (c === "north america" || c === "severni-amerika")
    return "Severní Amerika";
  if (c === "south america" || c === "jizni-amerika") return "Jižní Amerika";
  if (c === "antarctica" || c === "antarktida") return "Antarktida";
  return continent;
}

async function getContinentFromDatabase(iso2?: string): Promise<string | null> {
  if (!iso2) return null;
  try {
    const admin = createAdminSupabaseClient();
    const { data } = await admin
      .from("countries")
      .select("continent")
      .eq("iso_code", iso2.toUpperCase())
      .maybeSingle();
    return data?.continent || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ continent: string; country: string }>;
}): Promise<Metadata> {
  const { continent, country } = await params;
  const { name } = resolveCountryBySlug(country);
  const continentLabel = continentLabelFromSlug(continent);
  const displayName =
    name || country.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  const title = `${displayName} – ${continentLabel} | Destinote`;
  const description = `Průvodce zemí ${displayName} (${continentLabel}). Objevte tipy, zajímavosti a mapu.`;
  return {
    title,
    description,
    alternates: {
      canonical: `/zeme/${continent}/${country}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      locale: "cs_CZ",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CountryDetailPage({
  params,
}: {
  params: Promise<{ continent: string; country: string }>;
}) {
  const { continent, country } = await params;

  // Najít ISO2 kód podle CZ názvu odvozeného ze slugu
  const { iso2: resolvedIso2, name: resolvedName } =
    resolveCountryBySlug(country);

  const displayName =
    resolvedName ||
    country.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()); // fallback kapitalizace

  // Zkusit získat kontinent z databáze podle ISO2, pokud to selže, použít URL parametr
  const dbContinent = await getContinentFromDatabase(resolvedIso2);
  const continentLabel = dbContinent
    ? continentFromDbToLabel(dbContinent)
    : continentLabelFromSlug(continent);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb navigace */}
      <nav className="text-sm text-gray-600 mb-6">
        <Link
          href="/zeme"
          className="hover:text-green-600 font-medium transition-colors"
        >
          Země
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/zeme/${continent}`}
          className="hover:text-green-600 font-medium transition-colors"
        >
          {continentLabel}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-semibold">{displayName}</span>
      </nav>

      {/* Hlavní obsah - mapa a průvodce */}
      <div className="mb-8">
        <CountryGuide
          name={displayName}
          iso2={resolvedIso2}
          continent={continentLabel}
          currentPath={`/zeme/${continent}/${country}`}
        />
      </div>
    </main>
  );
}
