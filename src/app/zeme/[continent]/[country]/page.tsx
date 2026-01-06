import countries from "i18n-iso-countries";
import cs from "i18n-iso-countries/langs/cs.json";
import type { Metadata } from "next";
import Link from "next/link";
import CountryGuide from "@/components/guides/CountryGuide";
import FlightsWidget from "@/components/flights/FlightsWidget";
import ArticlesTeaser from "@/components/articles/ArticlesTeaser";

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
  return s.charAt(0).toUpperCase() + s.slice(1);
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
  const continentLabel = continentLabelFromSlug(continent);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-gray-600 mb-4">
        <Link href="/zeme" className="hover:text-green-600 font-medium">
          Země
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/zeme/${continent}`}
          className="hover:text-green-600 font-medium"
        >
          {continentLabel}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-semibold">{displayName}</span>
      </nav>
      <div className="flex items-center gap-3">
        {resolvedIso2 ? (
          <span
            className={`fi fi-${resolvedIso2.toLowerCase()}`}
            style={{ fontSize: 28 }}
          />
        ) : null}
        <h1 className="text-3xl font-bold text-gray-900">{displayName}</h1>
      </div>

      <p className="text-gray-600 mt-2">
        Region: <span className="font-medium">{continentLabel}</span>
      </p>

      <div className="mt-8">
        <CountryGuide
          name={displayName}
          iso2={resolvedIso2}
          continent={continentLabel}
        />
      </div>
      {/* <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ArticlesTeaser title="Cestopisy a články" href="/community" />
        </div>
        <div>
          <FlightsWidget query={displayName} />
        </div>
      </div> */}
    </main>
  );
}
