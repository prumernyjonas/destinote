// src/components/guides/CountryGuide.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import CountryMap from "./CountryMap";

type Props = {
  name: string;
  iso2?: string;
  continent: string;
};

type StoredSection = {
  id: string;
  title: string;
  text: string;
};

type StoredGuide = {
  intro: string;
  sections: StoredSection[];
};

type CountryStats = {
  visitorsCount: number;
  articlesCount: number;
  flagEmoji?: string;
};

type CountryInfo = {
  population?: number;
  capital?: string[];
  languages?: Record<string, string>;
  currencies?: Record<string, { name: string; symbol: string }>;
  area?: number; // v km²
};

async function fetchStoredGuide(iso2?: string): Promise<StoredGuide | null> {
  if (!iso2) return null;
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("ai_guides")
      .select("content")
      .eq("scope", "country")
      .eq("key", iso2.toUpperCase())
      .maybeSingle();
    if (error || !data?.content) return null;
    return data.content as StoredGuide;
  } catch {
    return null;
  }
}

async function fetchCountryStats(iso2?: string): Promise<CountryStats> {
  if (!iso2) {
    return { visitorsCount: 0, articlesCount: 0 };
  }

  try {
    const admin = createAdminSupabaseClient();

    // Najít country_id podle ISO kódu
    const { data: countryData } = await admin
      .from("countries")
      .select("id, flag_emoji")
      .eq("iso_code", iso2.toUpperCase())
      .maybeSingle();

    if (!countryData?.id) {
      return { visitorsCount: 0, articlesCount: 0 };
    }

    const countryId = countryData.id;

    // Počet uživatelů, kteří navštívili zemi
    const { count: visitorsCount } = await admin
      .from("user_visited_countries")
      .select("*", { count: "exact", head: true })
      .eq("country_id", countryId);

    // Počet článků o zemi
    const { count: articlesCount } = await admin
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("country_id", countryId)
      .eq("status", "approved");

    return {
      visitorsCount: visitorsCount || 0,
      articlesCount: articlesCount || 0,
      flagEmoji: countryData.flag_emoji || undefined,
    };
  } catch {
    return { visitorsCount: 0, articlesCount: 0 };
  }
}

async function fetchCountryInfo(iso2?: string): Promise<CountryInfo> {
  if (!iso2) {
    return {};
  }

  try {
    // Použijeme REST Countries API pro získání informací o zemi
    const response = await fetch(
      `https://restcountries.com/v3.1/alpha/${iso2.toLowerCase()}?fields=population,capital,languages,currencies,area`
    );

    if (!response.ok) {
      return {};
    }

    const data = await response.json();

    return {
      population: data.population,
      capital: data.capital,
      languages: data.languages,
      currencies: data.currencies,
      area: data.area,
    };
  } catch {
    return {};
  }
}

export default async function CountryGuide({ name, iso2, continent }: Props) {
  const [guide, stats, countryInfo] = await Promise.all([
    fetchStoredGuide(iso2),
    fetchCountryStats(iso2),
    fetchCountryInfo(iso2),
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Levá strana - hlavní obsah */}
      <div className="lg:col-span-2 space-y-6">
        {/* Mapa země - v kartě */}
        <Card>
          <CardHeader>
            <CardTitle>📍 Poloha země</CardTitle>
          </CardHeader>
          <CardContent>
            <CountryMap iso2={iso2} countryName={name} />
          </CardContent>
        </Card>

        {/* Průvodce */}
        {guide ? (
          <Card>
            <CardHeader>
              <CardTitle>📖 Průvodce</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="font-semibold text-gray-900">Úvod</div>
                <p className="text-gray-800 whitespace-pre-line">
                  {guide.intro}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guide.sections?.map((section) => (
                  <Card key={section.id} className="h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold text-gray-900">
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-800 whitespace-pre-line">
                        {section.text}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>📖 Průvodce</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-800">
                Průvodce pro {name} zatím nemáme. Zkuste to prosím později.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pravá strana - sidebar s informacemi */}
      <div className="space-y-6">
        {/* Informační karta o zemi */}
        <Card>
          <CardHeader>
            <CardTitle>ℹ️ Informace o zemi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              {iso2 ? (
                <span
                  className={`fi fi-${iso2.toLowerCase()}`}
                  style={{ fontSize: 32 }}
                />
              ) : null}
              <div>
                <div className="font-semibold text-lg text-gray-900">
                  {name}
                </div>
                <div className="text-sm text-gray-600">{continent}</div>
              </div>
            </div>
            {iso2 && (
              <div className="pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-1">ISO kód</div>
                <div className="font-mono text-base font-semibold text-gray-900">
                  {iso2}
                </div>
              </div>
            )}
            {(countryInfo.population ||
              countryInfo.capital ||
              countryInfo.languages ||
              countryInfo.currencies ||
              countryInfo.area) && (
              <>
                {countryInfo.population && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">
                      Počet obyvatel
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {countryInfo.population.toLocaleString("cs-CZ")}
                    </div>
                  </div>
                )}
                {countryInfo.capital && countryInfo.capital.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">
                      Hlavní město
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {countryInfo.capital.join(", ")}
                    </div>
                  </div>
                )}
                {countryInfo.languages &&
                  Object.keys(countryInfo.languages).length > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">
                        Úřední jazyk
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {Object.values(countryInfo.languages).join(", ")}
                      </div>
                    </div>
                  )}
                {countryInfo.currencies &&
                  Object.keys(countryInfo.currencies).length > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">Měna</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {Object.values(countryInfo.currencies)
                          .map((c) => `${c.name} (${c.symbol})`)
                          .join(", ")}
                      </div>
                    </div>
                  )}
                {countryInfo.area && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">Rozloha</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {countryInfo.area.toLocaleString("cs-CZ")} km²
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Statistiky */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Statistiky</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👥</span>
                <div>
                  <div className="text-sm text-gray-600">
                    Navštívilo uživatelů
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {stats.visitorsCount}
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📝</span>
                  <div>
                    <div className="text-sm text-gray-600">Článků</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {stats.articlesCount}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
