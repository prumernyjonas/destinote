"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export default function CommunityPage() {
  const [tab, setTab] = useState<"feed" | "top" | "following">("feed");

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
            <Button>Nový příspěvek</Button>
          </div>
        </div>

        <nav className="flex items-center gap-6 border-b pb-2">
          {[
            { key: "feed", label: "Feed" },
            { key: "top", label: "Top" },
            { key: "following", label: "Sleduji" },
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

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-6 w-3/5" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </CardContent>
              </Card>
            ))}
          </div>
          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Trending destinace</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top autoři</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </CardContent>
            </Card>
          </aside>
        </section>
      </div>
    </main>
  );
}
