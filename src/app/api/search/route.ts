import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import countries from "i18n-iso-countries";
import cs from "i18n-iso-countries/langs/cs.json";

// Registrace českého locale
try {
  countries.registerLocale(cs as any);
} catch {}

export const dynamic = "force-dynamic";

// Funkce pro odstranění diakritiky
function removeDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Funkce pro kontrolu, zda text obsahuje query (case-insensitive, bez diakritiky)
function matchesQuery(text: string, query: string): boolean {
  if (!text || !query) return false;
  const normalizedText = removeDiacritics(text);
  const normalizedQuery = removeDiacritics(query);
  return normalizedText.includes(normalizedQuery);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ articles: [], countries: [] });
    }

    const searchTerm = `%${query.trim()}%`;
    const admin = createAdminSupabaseClient();

    // Vyhledávání článků - použít ILIKE pro efektivnější dotaz
    const searchQuery = query.trim();
    const searchPattern = `%${searchQuery}%`;
    
    let allArticles: any[] = [];
    let articlesError: any = null;
    
    try {
      // Timeout pomocí Promise.race
      const queryPromise = admin
        .from("articles")
        .select("id, title, slug, status, created_at, content")
        .eq("status", "approved")
        .is("deleted_at", null)
        .or(`title.ilike.${searchPattern},content.ilike.${searchPattern}`)
        .order("created_at", { ascending: false })
        .limit(50); // Snížit limit pro lepší výkon
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Search timeout")), 10000);
      });
      
      const result = await Promise.race([queryPromise, timeoutPromise]);
      allArticles = (result as any).data || [];
      articlesError = (result as any).error;
    } catch (err: any) {
      if (err.message === "Search timeout") {
        console.error("[search] Articles query timeout");
        articlesError = { message: "Search timeout" };
      } else {
        articlesError = err;
      }
    }

    // Filtrujeme podle normalizovaného dotazu (bez diakritiky)
    const articles = (allArticles || []).filter((a: any) => {
      return (
        matchesQuery(a.title || "", searchQuery) ||
        matchesQuery(a.content || "", searchQuery)
      );
    }).slice(0, 20); // Vezmeme prvních 20

    if (articlesError) {
      console.error("[search] Articles error:", articlesError);
    }

    // Funkce pro vytvoření snippetu s kontextem (podporuje diakritiku)
    const createSnippet = (text: string, query: string, maxLength: number = 200): string => {
      if (!text) return "";
      
      // Normalizuj text i query pro hledání
      const normalizedText = removeDiacritics(text);
      const normalizedQuery = removeDiacritics(query);
      const queryIndex = normalizedText.indexOf(normalizedQuery);
      
      if (queryIndex === -1) {
        // Pokud se query nenajde, vrať začátek textu
        return text.substring(0, maxLength) + (text.length > maxLength ? "..." : "");
      }
      
      // Najdi skutečnou pozici v původním textu
      let actualQueryStart = 0;
      let charCount = 0;
      for (let i = 0; i < text.length; i++) {
        if (charCount === queryIndex) {
          actualQueryStart = i;
          break;
        }
        const normalizedChar = removeDiacritics(text[i]);
        if (normalizedChar) {
          charCount++;
        }
      }
      
      // Najdi konec query v původním textu
      let actualQueryEnd = actualQueryStart;
      let queryCharCount = 0;
      for (let i = actualQueryStart; i < text.length && queryCharCount < normalizedQuery.length; i++) {
        const normalizedChar = removeDiacritics(text[i]);
        if (normalizedChar) {
          queryCharCount++;
        }
        actualQueryEnd = i + 1;
      }
      
      // Vytvoř snippet s kontextem
      const contextBefore = Math.floor(maxLength / 2);
      const contextAfter = Math.floor(maxLength / 2);
      const snippetStart = Math.max(0, actualQueryStart - contextBefore);
      const snippetEnd = Math.min(text.length, actualQueryEnd + contextAfter);
      
      let snippet = text.substring(snippetStart, snippetEnd);
      
      // Přidej "..." na začátek pokud není na začátku textu
      if (snippetStart > 0) {
        snippet = "..." + snippet;
      }
      // Přidej "..." na konec pokud není na konci textu
      if (snippetEnd < text.length) {
        snippet = snippet + "...";
      }
      
      return snippet;
    };

    // Vyhledávání zemí - použít ILIKE pro efektivnější dotaz
    // Hledáme v českých názvech pomocí ILIKE
    let allCountriesData: any[] = [];
    let countriesError: any = null;
    
    try {
      const queryPromise = admin
        .from("countries")
        .select("id, name, name_cs, iso_code, continent, continent_slug, slug")
        .or(`name_cs.ilike.${searchPattern},name.ilike.${searchPattern}`)
        .limit(50); // Snížit limit pro lepší výkon
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Search timeout")), 10000);
      });
      
      const result = await Promise.race([queryPromise, timeoutPromise]);
      allCountriesData = (result as any).data || [];
      countriesError = (result as any).error;
    } catch (err: any) {
      if (err.message === "Search timeout") {
        console.error("[search] Countries query timeout");
        countriesError = { message: "Search timeout" };
      } else {
        countriesError = err;
      }
    }

    // Filtrujeme podle normalizovaného dotazu (bez diakritiky)
    // Hledáme POUZE v českých názvech
    const countriesData = (allCountriesData || []).filter((c: any) => {
      // Hledej v českém názvu z databáze
      if (matchesQuery(c.name_cs || "", searchQuery)) return true;
      // Hledej v českém názvu z knihovny (pokud máme ISO kód)
      if (c.iso_code) {
        const libName = countries.getName(c.iso_code, "cs");
        if (libName && matchesQuery(libName, searchQuery)) return true;
      }
      return false;
    }).slice(0, 20); // Vezmeme prvních 20

    if (countriesError) {
      console.error("[search] Countries error:", countriesError);
    }

    // Mapování zemí s českými názvy
    const mappedCountries = (countriesData || []).map((c: any) => {
      // Použij český název pokud existuje, jinak zkus získat z knihovny, jinak anglický
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
        continent: c.continent,
        continent_slug: c.continent_slug || c.continent?.toLowerCase().replace(/\s+/g, "-"),
        slug: c.slug,
        type: "country",
      };
    });

    return NextResponse.json({
      articles: (articles || []).map((a: any) => {
        // Vytvoř snippet z obsahu
        const snippet = createSnippet(a.content || "", searchQuery);
        
        return {
          id: a.id,
          title: a.title,
          slug: a.slug,
          snippet: snippet,
          created_at: a.created_at,
          type: "article",
        };
      }),
      countries: mappedCountries,
    });
  } catch (error: any) {
    console.error("[search] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

