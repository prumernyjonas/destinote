"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FiGlobe, FiMap, FiSearch, FiX } from "react-icons/fi";

interface SearchResult {
  articles: Array<{
    id: string;
    title: string;
    slug: string;
    snippet?: string;
    created_at?: string;
    type: string;
  }>;
  countries: Array<{
    id: string;
    name: string;
    iso_code: string;
    continent: string;
    continent_slug?: string;
    slug: string;
    type: string;
  }>;
}

// Funkce pro překlad kontinentu do češtiny
function getContinentNameCs(continent: string | undefined): string {
  if (!continent) return "";
  const c = continent.toLowerCase();
  if (c === "asia" || c === "asie") return "Asie";
  if (c === "europe" || c === "evropa") return "Evropa";
  if (c === "africa" || c === "afrika") return "Afrika";
  if (c === "australia" || c === "oceania" || c === "australie")
    return "Austrálie & Oceánie";
  if (c === "north america" || c === "severni-amerika")
    return "Severní Amerika";
  if (c === "south america" || c === "jizni-amerika") return "Jižní Amerika";
  if (c === "antarctica" || c === "antarktida") return "Antarktida";
  return continent;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(query);
  const [results, setResults] = useState<SearchResult>({
    articles: [],
    countries: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSearchQuery(query);
    if (query.trim().length >= 2) {
      performSearch(query);
    } else {
      setResults({ articles: [], countries: [] });
    }
  }, [query]);

  const performSearch = async (q: string) => {
    if (q.trim().length < 2) {
      setResults({ articles: [], countries: [] });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      router.push(`/hledat?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    router.push("/hledat");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hledat země, články..."
              className="w-full pl-12 pr-32 py-4 bg-white border-2 border-blue-200 rounded-full text-lg text-blue-900 placeholder-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-32 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition cursor-pointer"
                aria-label="Vymazat vyhledávání"
              >
                <FiX className="w-5 h-5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition cursor-pointer"
            >
              Hledat
            </button>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-blue-600">Hledám...</p>
          </div>
        ) : query.trim().length < 2 ? (
          <div className="text-center py-12">
            <FiSearch className="w-16 h-16 text-blue-300 mx-auto mb-4" />
            <p className="text-blue-600 text-lg">
              Zadejte alespoň 2 znaky pro vyhledávání
            </p>
          </div>
        ) : results.countries.length === 0 && results.articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-blue-600 text-lg">
              Pro dotaz &quot;{query}&quot; nebyly nalezeny žádné výsledky
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Countries Results */}
            {results.countries.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <FiGlobe className="w-6 h-6" />
                  Země ({results.countries.length})
                </h2>
                <div className="grid gap-3">
                  {results.countries.map((country) => {
                    const continentSlug =
                      country.continent_slug ||
                      country.continent?.toLowerCase().replace(/\s+/g, "-") ||
                      "svet";
                    const countrySlug =
                      country.slug ||
                      country.name.toLowerCase().replace(/\s+/g, "-");
                    const iso2 = country.iso_code?.toLowerCase() || "";
                    return (
                      <Link
                        key={country.id}
                        href={`/zeme/${continentSlug}/${countrySlug}`}
                        className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-md transition"
                      >
                        {iso2 ? (
                          <span
                            className={`fi fi-${iso2} text-2xl flex-shrink-0`}
                            style={{ fontSize: "24px" }}
                          />
                        ) : (
                          <FiGlobe className="w-6 h-6 text-blue-600 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-blue-900">
                            {country.name}
                          </h3>
                          <p className="text-sm text-blue-600">
                            {getContinentNameCs(country.continent)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Articles Results */}
            {results.articles.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <FiMap className="w-6 h-6" />
                  Články ({results.articles.length})
                </h2>
                <div className="grid gap-4">
                  {results.articles.map((article) => {
                    // Funkce pro odstranění diakritiky
                    const removeDiacritics = (str: string): string => {
                      return str
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .toLowerCase();
                    };

                    // Funkce pro zvýraznění hledaného výrazu (ignoruje diakritiku)
                    const highlightText = (text: string, query: string) => {
                      if (!text || !query) return text;

                      const normalizedQuery = removeDiacritics(query);
                      const normalizedText = removeDiacritics(text);

                      // Najdi všechny výskyty v normalizovaném textu
                      const matches: Array<{ start: number; end: number }> = [];
                      let searchIndex = 0;

                      while (true) {
                        const foundIndex = normalizedText.indexOf(
                          normalizedQuery,
                          searchIndex
                        );
                        if (foundIndex === -1) break;

                        // Mapuj pozici z normalizovaného textu na původní
                        let actualStart = 0;
                        let normalizedCharCount = 0;
                        for (let i = 0; i < text.length; i++) {
                          if (normalizedCharCount === foundIndex) {
                            actualStart = i;
                            break;
                          }
                          const char = text[i];
                          const normalizedChar = removeDiacritics(char);
                          if (normalizedChar) {
                            normalizedCharCount++;
                          }
                        }

                        // Najdi konec matchu v původním textu
                        let actualEnd = actualStart;
                        let queryCharCount = 0;
                        for (
                          let i = actualStart;
                          i < text.length &&
                          queryCharCount < normalizedQuery.length;
                          i++
                        ) {
                          const normalizedChar = removeDiacritics(text[i]);
                          if (normalizedChar) {
                            queryCharCount++;
                          }
                          actualEnd = i + 1;
                        }

                        matches.push({ start: actualStart, end: actualEnd });
                        searchIndex = foundIndex + 1;
                      }

                      if (matches.length === 0) return text;

                      // Vytvoř části s highlighted textem
                      const parts: (string | React.ReactElement)[] = [];
                      let lastIndex = 0;

                      matches.forEach((match, matchIndex) => {
                        // Přidej text před match
                        if (match.start > lastIndex) {
                          parts.push(text.substring(lastIndex, match.start));
                        }
                        // Přidej highlighted match
                        parts.push(
                          <mark
                            key={`match-${matchIndex}`}
                            className="bg-yellow-200 text-blue-900 font-semibold px-0.5 rounded"
                          >
                            {text.substring(match.start, match.end)}
                          </mark>
                        );
                        lastIndex = match.end;
                      });

                      // Přidej zbytek textu
                      if (lastIndex < text.length) {
                        parts.push(text.substring(lastIndex));
                      }

                      return <>{parts}</>;
                    };

                    const formatDate = (dateString?: string) => {
                      if (!dateString) return "";
                      try {
                        const date = new Date(dateString);
                        return date.toLocaleDateString("cs-CZ", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        });
                      } catch {
                        return "";
                      }
                    };

                    return (
                      <Link
                        key={article.id}
                        href={`/clanek/${article.slug}`}
                        className="block p-5 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-md transition"
                      >
                        <div className="flex items-start gap-4">
                          <FiMap className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-blue-900 mb-2">
                              {highlightText(article.title, query)}
                            </h3>
                            {article.snippet && (
                              <p className="text-sm text-blue-700 mb-2 leading-relaxed">
                                {highlightText(article.snippet, query)}
                              </p>
                            )}
                            {article.created_at && (
                              <p className="text-xs text-blue-500">
                                {formatDate(article.created_at)}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
