// src/components/articles/ArticlesTeaser.tsx
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import Image from "next/image";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type Props = {
  title?: string;
  href?: string; // CTA na plný výpis článků/komunity
  regionName?: string; // Název regionu/kontinentu pro filtrování článků
};

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

async function fetchRegionArticles(regionName: string, limit: number = 6) {
  try {
    const admin = createAdminSupabaseClient();
    
    // Převést český název kontinentu na anglický (jak je v databázi)
    const continentDbName = continentMapping[regionName] || regionName;
    
    // Nejdřív získat všechny země z daného kontinentu
    // Zkusit jak anglický název (primární), tak český (fallback)
    let countriesData: any[] = [];
    let countriesError: any = null;
    
    // Zkusit nejdřív anglický název
    const { data: data1, error: error1 } = await admin
      .from("countries")
      .select("name, name_cs")
      .eq("continent", continentDbName);
    
    if (!error1 && data1 && data1.length > 0) {
      countriesData = data1;
    } else {
      // Fallback na český název
      const { data: data2, error: error2 } = await admin
        .from("countries")
        .select("name, name_cs")
        .eq("continent", regionName);
      
      if (!error2 && data2) {
        countriesData = data2;
      } else {
        countriesError = error2 || error1;
      }
    }
    
    if (countriesError || !countriesData || countriesData.length === 0) {
      return [];
    }
    
    // Vytvořit seznam názvů zemí (české i anglické)
    const countryNames = countriesData.flatMap((c: any) => {
      const names = [];
      if (c.name_cs) names.push(c.name_cs);
      if (c.name) names.push(c.name);
      return names;
    });
    
    // Načíst všechny schválené články
    const { data: articlesData, error: articlesError } = await admin
      .from("articles")
      .select(
        "id, title, status, created_at, updated_at, published_at, main_image_url, main_image_alt, slug, destination"
      )
      .eq("status", "approved")
      .is("deleted_at", null)
      .order("published_at", { ascending: false })
      .limit(limit * 2); // Načíst více, protože budeme filtrovat
    
    if (articlesError || !articlesData) {
      return [];
    }
    
    // Filtrovat články podle destinace (musí být v seznamu zemí kontinentu)
    const filtered = articlesData.filter((article: any) => {
      if (!article.destination) return false;
      return countryNames.some(
        (countryName: string) =>
          article.destination?.toLowerCase() === countryName.toLowerCase()
      );
    });
    
    // Omezit na limit a seřadit podle data publikace
    filtered.sort((a: any, b: any) => {
      const dateA = new Date(a.published_at || a.created_at).getTime();
      const dateB = new Date(b.published_at || b.created_at).getTime();
      return dateB - dateA;
    });
    
    return filtered.slice(0, limit).map((article: any) => ({
      id: article.id,
      title: article.title,
      main_image_url: article.main_image_url,
      main_image_alt: article.main_image_alt,
      slug: article.slug,
      published_at: article.published_at,
      created_at: article.created_at,
      destination: article.destination,
    }));
  } catch (error) {
    console.error("Error fetching region articles:", error);
    return [];
  }
}

export default async function ArticlesTeaser({
  title = "Nejnovější články",
  href = "/komunita",
  regionName,
}: Props) {
  const articles = regionName ? await fetchRegionArticles(regionName, 6) : [];
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <Link
          href={href}
          className="text-green-700 font-medium hover:text-green-900"
        >
          Zobrazit více →
        </Link>
      </div>
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/clanek/${article.slug}`}
              className="block"
            >
              <div className="group cursor-pointer h-full flex flex-col bg-white rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden">
                {article.main_image_url ? (
                  <div className="relative w-full h-52 bg-gray-100 overflow-hidden">
                    <Image
                      src={article.main_image_url}
                      alt={article.main_image_alt || article.title}
                      fill
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    {/* Země jako overlay vlevo nahoře */}
                    {article.destination && (
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full">
                          <span className="text-[10px]">📍</span>
                          <span>{article.destination}</span>
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative w-full h-52 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Bez obrázku</span>
                    {/* Země i na placeholder obrázku */}
                    {article.destination && (
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                          <span className="text-[10px]">📍</span>
                          <span>{article.destination}</span>
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-base text-gray-900 line-clamp-2 mb-1.5 group-hover:text-emerald-600 transition-colors leading-snug">
                    {article.title}
                  </h3>
                  {/* Malé datum hned pod názvem */}
                  <div className="text-[11px] text-gray-400 font-normal">
                    {article.published_at
                      ? new Date(article.published_at).toLocaleDateString("cs-CZ", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : new Date(article.created_at).toLocaleDateString("cs-CZ", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="w-full h-48" />
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
