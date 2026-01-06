"use client";

import { useState, useEffect } from "react";
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
};

export default function CommunityPage() {
  const [tab, setTab] = useState<"feed" | "top" | "following" | "friends">(
    "feed"
  );
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

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
        setArticles(data.items || []);
      } catch (e: any) {
        setError(e.message || "Chyba při načítání článků");
      } finally {
        setLoading(false);
      }
    }
    loadArticles();
  }, [tab, user]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Komunita</h1>
          <p className="text-gray-600">
            Objevujte články a cestovní inspiraci od ostatních.
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1">
            <Input placeholder="Hledat články nebo autory..." />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary">Filtrovat</Button>
            <Link href="/clanek/novy">
              <Button>Nový článek</Button>
            </Link>
          </div>
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
              className={`border-b-2 py-2 text-sm font-medium ${
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
                  <Link href="/auth/login">
                    <Button>Přihlásit se</Button>
                  </Link>
                </div>
              ) : tab === "following" ? (
                <p>Zatím nesledujete nikoho, kdo by měl schválené články.</p>
              ) : tab === "friends" && !user ? (
                <div>
                  <p className="mb-4">Pro zobrazení článků od přátel se přihlaste.</p>
                  <Link href="/auth/login">
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
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                  {article.main_image_url ? (
                    <div className="relative w-full h-48 bg-gray-200">
                      <Image
                        src={article.main_image_url}
                        alt={article.main_image_alt || article.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">Bez obrázku</span>
                    </div>
                  )}
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                      {article.title}
                    </h3>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
