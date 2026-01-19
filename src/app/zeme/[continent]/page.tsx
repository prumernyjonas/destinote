import type { Metadata } from "next";
import Link from "next/link";
import RegionGuide from "@/components/guides/RegionGuide";
import ArticlesTeaser from "@/components/articles/ArticlesTeaser";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import countries from "i18n-iso-countries";
import cs from "i18n-iso-countries/langs/cs.json";
import CountriesCarousel from "@/components/guides/CountriesCarousel";

// Registrace českého locale
try {
  countries.registerLocale(cs as any);
} catch {}

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

// Mapování českých názvů kontinentů na anglické (jak jsou v databázi)
const continentMapping: Record<string, string> = {
  "Asie": "Asia",
  "Evropa": "Europe",
  "Afrika": "Africa",
  "Austrálie & Oceánie": "Oceania",
  "Severní Amerika": "North America",
  "Jižní Amerika": "South America",
  "Antarktida": "Antarctica",
};

// Popisné texty pro kontinenty
const continentDescriptions: Record<string, string> = {
  "Asie": "Asie je největší a nejlidnatější kontinent na světě, domov fascinujících kultur, starobylých civilizací a rozmanitých krajin. Od himálajských vrcholů přes tropické pláže až po moderní megapole - Asie nabízí nekonečné možnosti objevování.",
  "Evropa": "Evropa je kontinentem bohaté historie, rozmanité kultury a nádherné architektury. Od severských fjordů přes středomořské pláže až po alpské vrcholky - Evropa láká milovníky historie, umění i přírody.",
  "Afrika": "Afrika je kontinentem divoké přírody, pestrých kultur a úchvatných krajin. Od saharských dun přes savany plné zvířat až po tropické pralesy - Afrika nabízí nezapomenutelné zážitky a dobrodružství.",
  "Austrálie & Oceánie": "Austrálie a Oceánie jsou domovem jedinečné přírody, nádherných pláží a fascinujících kultur. Od australského outbacku přes novozélandské hory až po tropické ostrovy Tichého oceánu - tento region nabízí nezapomenutelné zážitky.",
  "Severní Amerika": "Severní Amerika je kontinentem rozmanitých krajin, od arktických tunder přes rozsáhlé prérie až po tropické pláže. Domov moderních metropolí, národních parků a bohaté kulturní historie.",
  "Jižní Amerika": "Jižní Amerika je kontinentem amazonských pralesů, andských vrcholů a nádherných pláží. Od inckých ruin přes tango v Buenos Aires až po karneval v Riu - Jižní Amerika pulzuje životem a barvami.",
  "Antarktida": "Antarktida je nejchladnější, nejsušší a největrnější kontinent na Zemi. Domov tučňáků, tuleňů a úchvatných ledových krajin. Jedinečná destinace pro ty, kteří hledají skutečné dobrodružství.",
};

// Funkce pro slugifikaci názvu země
function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchContinentCountries(regionName: string) {
  try {
    const admin = createAdminSupabaseClient();
    
    // Převést český název kontinentu na anglický (jak je v databázi)
    const continentDbName = continentMapping[regionName] || regionName;
    
    // Načíst všechny země z kontinentu
    let countriesData: any[] = [];
    
    // Zkusit nejdřív anglický název
    const { data: data1, error: error1 } = await admin
      .from("countries")
      .select("id, name, name_cs, iso_code, slug")
      .eq("continent", continentDbName)
      .order("name_cs", { ascending: true, nullsLast: true });
    
    if (!error1 && data1 && data1.length > 0) {
      countriesData = data1;
    } else {
      // Fallback na český název
      const { data: data2, error: error2 } = await admin
        .from("countries")
        .select("id, name, name_cs, iso_code, slug")
        .eq("continent", regionName)
        .order("name_cs", { ascending: true, nullsLast: true });
      
      if (!error2 && data2) {
        countriesData = data2;
      }
    }
    
    // Mapovat země s českými názvy
    const mappedCountries = countriesData.map((c: any) => {
      let countryName = c.name_cs;
      if (!countryName && c.iso_code) {
        countryName = countries.getName(c.iso_code, "cs") || c.name;
      }
      if (!countryName) {
        countryName = c.name;
      }
      
      return {
        id: c.id,
        name: countryName,
        iso_code: c.iso_code,
        slug: c.slug || slugify(countryName),
      };
    });
    
    return mappedCountries;
  } catch (error) {
    console.error("Error fetching continent countries:", error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ continent: string }>;
}): Promise<Metadata> {
  const { continent } = await params;
  const continentLabel = continentLabelFromSlug(continent);
  const title = `${continentLabel} – průvodce zeměmi | Destinote`;
  const description = `Prozkoumejte země regionu ${continentLabel}. Inspirace, tipy a přehled na jednom místě.`;
  return {
    title,
    description,
    alternates: {
      canonical: `/zeme/${continent}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "cs_CZ",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ContinentPage({
  params,
}: {
  params: Promise<{ continent: string }>;
}) {
  const { continent } = await params;
  const continentLabel = continentLabelFromSlug(continent);
  const description = continentDescriptions[continentLabel] || `${continentLabel} je fascinující kontinent s rozmanitou kulturou, přírodou a historií. Objevte nejkrásnější destinace a inspirujte se pro vaši další cestu.`;
  const countries = await fetchContinentCountries(continentLabel);
  
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-gray-600 mb-4">
        <Link href="/zeme" className="hover:text-green-600 font-medium">
          Země
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-semibold">{continentLabel}</span>
      </nav>
      <h1 className="text-3xl font-bold text-gray-900">{continentLabel}</h1>
      <p className="text-gray-600 mt-2 text-lg leading-relaxed max-w-4xl">
        {description}
      </p>
      
      {/* Seznam některých zemí */}
      {countries.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Země v regionu</h2>
          <CountriesCarousel countries={countries} continent={continent} />
        </div>
      )}
      
      <div className="mt-8">
        <RegionGuide regionName={continentLabel} />
      </div>
      <div className="mt-8">
        <ArticlesTeaser title="Tipy a články z regionu" href="/komunita" regionName={continentLabel} />
      </div>
    </main>
  );
}
