"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import Image from "next/image";

type Article = {
  id: string;
  title: string;
  main_image_url: string | null;
  main_image_alt: string | null;
  slug: string;
  published_at: string | null;
  created_at: string;
  destination: string | null;
};

type Country = {
  id: string;
  name: string;
  iso_code: string;
};

type SortOption = "newest" | "oldest" | "popular";

export default function CommunityPage() {
  const [tab, setTab] = useState<"feed" | "top" | "following" | "friends">(
    "feed"
  );
  const [articles, setArticles] = useState<Article[]>([]);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [countries, setCountries] = useState<Country[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // Načíst seznam zemí
  useEffect(() => {
    async function loadCountries() {
      try {
        const res = await fetch("/api/countries/list");
        if (res.ok) {
          const data = await res.json();
          if (data.ok && Array.isArray(data.data)) {
            setCountries(data.data);
          }
        }
      } catch (err) {
        console.error("Chyba při načítání zemí:", err);
      }
    }
    loadCountries();
  }, []);

  // Zavřít dropdown při kliknutí mimo
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target as Node)
      ) {
        setCountryDropdownOpen(false);
        setCountrySearchQuery("");
      }
    }

    if (countryDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [countryDropdownOpen]);

  // Filtrované země pro dropdown
  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(countrySearchQuery.toLowerCase())
  );

  // Načíst články
  useEffect(() => {
    async function loadArticles() {
      setLoading(true);
      setError(null);
      try {
        let url = "/api/articles";

        // Přidat query parametry podle zvoleného tabu
        if (tab === "following" && user) {
          url = `/api/articles?following=true&userId=${user.uid}`;
        } else if (tab === "friends" && user) {
          url = `/api/articles?friends=true&userId=${user.uid}`;
        }

        const res = await fetch(url);
        if (!res.ok) {
          if (res.status === 401 && (tab === "following" || tab === "friends")) {
            throw new Error("Pro zobrazení článků od sledovaných je potřeba přihlášení");
          }
          throw new Error("Nepodařilo se načíst články");
        }
        const data = await res.json();
        setAllArticles(data.items || []);
      } catch (e: any) {
        setError(e.message || "Chyba při načítání článků");
      } finally {
        setLoading(false);
      }
    }
    loadArticles();
  }, [tab, user]);

  // Filtrování a řazení článků
  useEffect(() => {
    let filtered = [...allArticles];

    // Filtrování podle země
    if (selectedCountry) {
      filtered = filtered.filter(
        (article) => article.destination?.toLowerCase() === selectedCountry.toLowerCase()
      );
    }

    // Vyhledávání
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.destination?.toLowerCase().includes(query)
      );
    }

    // Řazení
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.published_at || b.created_at).getTime() -
                 new Date(a.published_at || a.created_at).getTime();
        case "oldest":
          return new Date(a.published_at || a.created_at).getTime() -
                 new Date(b.published_at || b.created_at).getTime();
        case "popular":
          // Prozatím podle data (můžeme přidat likes_count později)
          return new Date(b.published_at || b.created_at).getTime() -
                 new Date(a.published_at || a.created_at).getTime();
        default:
          return 0;
      }
    });

    setArticles(filtered);
  }, [allArticles, selectedCountry, sortBy, searchQuery]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Komunita</h1>
          <p className="text-gray-600">
            Objevujte články a cestovní inspiraci od ostatních.
          </p>
        </div>

        {/* Filtry a vyhledávání */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Vyhledávání */}
            <div className="flex-1">
              <Input
                placeholder="Hledat články nebo země..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Custom dropdown pro výběr země */}
            <div className="md:w-64 relative" ref={countryDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setCountryDropdownOpen(!countryDropdownOpen);
                  setCountrySearchQuery("");
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-left flex items-center justify-between hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors cursor-pointer"
              >
                <span className={selectedCountry ? "text-gray-900" : "text-gray-500"}>
                  {selectedCountry || "Všechny země"}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    countryDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {countryDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-hidden flex flex-col">
                  {/* Vyhledávání v dropdownu */}
                  <div className="p-2 border-b border-gray-200">
                    <Input
                      placeholder="Hledat zemi..."
                      value={countrySearchQuery}
                      onChange={(e) => setCountrySearchQuery(e.target.value)}
                      className="text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Scrollovatelný seznam zemí */}
                  <div className="overflow-y-auto max-h-56">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCountry("");
                        setCountryDropdownOpen(false);
                        setCountrySearchQuery("");
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors cursor-pointer ${
                        !selectedCountry
                          ? "bg-emerald-50 text-emerald-700 font-medium"
                          : "text-gray-900"
                      }`}
                    >
                      Všechny země
                    </button>
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((country) => (
                        <button
                          key={country.id}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(country.name);
                            setCountryDropdownOpen(false);
                            setCountrySearchQuery("");
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer ${
                            selectedCountry === country.name
                              ? "bg-emerald-50 text-emerald-700 font-medium"
                              : "text-gray-900"
                          }`}
                        >
                          {country.iso_code && (
                            <span className={`fi fi-${country.iso_code.toLowerCase()} text-base`} />
                          )}
                          <span>{country.name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500 text-center">
                        Žádné výsledky
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Řazení */}
            <div className="md:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
              >
                <option value="newest">Nejnovější</option>
                <option value="oldest">Nejstarší</option>
                <option value="popular">Nejpopulárnější</option>
              </select>
            </div>

            {/* Tlačítko nový článek */}
            <Link href="/clanek/novy">
              <Button className="whitespace-nowrap">Nový článek</Button>
            </Link>
          </div>

          {/* Aktivní filtry */}
          {(selectedCountry || searchQuery) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Aktivní filtry:</span>
              {selectedCountry && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                  {selectedCountry}
                  <button
                    onClick={() => setSelectedCountry("")}
                    className="hover:text-emerald-900 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery("")}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        <nav className="flex items-center gap-6 border-b pb-2">
          {[
            { key: "feed", label: "Feed" },
            { key: "top", label: "Top" },
            { key: "following", label: "Sleduji" },
            { key: "friends", label: "Přátelé" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`border-b-2 py-2 text-sm font-medium cursor-pointer ${
                tab === t.key
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Počet výsledků */}
        {!loading && articles.length > 0 && (
          <div className="text-sm text-gray-600">
            Zobrazeno {articles.length} {articles.length === 1 ? "článek" : articles.length < 5 ? "články" : "článků"}
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Loading skeletons
            [...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="w-full h-48" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                </CardContent>
              </Card>
            ))
          ) : articles.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-600">
              {tab === "following" && !user ? (
                <div>
                  <p className="mb-4">Pro zobrazení článků od sledovaných se přihlaste.</p>
                  <Link href="/prihlaseni">
                    <Button>Přihlásit se</Button>
                  </Link>
                </div>
              ) : tab === "following" ? (
                <p>Zatím nesledujete nikoho, kdo by měl schválené články.</p>
              ) : tab === "friends" && !user ? (
                <div>
                  <p className="mb-4">Pro zobrazení článků od přátel se přihlaste.</p>
                  <Link href="/prihlaseni">
                    <Button>Přihlásit se</Button>
                  </Link>
                </div>
              ) : tab === "friends" ? (
                <p>Zatím nemáte žádné přátele (vzájemné sledování) s články.</p>
              ) : (
                <p>Zatím nejsou žádné schválené články.</p>
              )}
            </div>
          ) : (
            articles.map((article) => (
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
            ))
          )}
        </section>
      </div>
    </main>
  );
}
