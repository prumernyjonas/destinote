import PublicWorldMap from "@/components/PublicWorldMap";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

const continents = [
  { key: "afrika", label: "Afrika" },
  { key: "severni-amerika", label: "Severní Amerika" },
  { key: "jizni-amerika", label: "Jižní Amerika" },
  { key: "asie", label: "Asie" },
  { key: "australie", label: "Austrálie & Oceánie" },
  { key: "evropa", label: "Evropa" },
  { key: "antarktida", label: "Antarktida" },
];

export default function CountriesIndexPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Průvodce zeměmi</h1>
          <p className="text-gray-600">
            Objevujte svět po kontinentech a najděte inspiraci k cestám.
          </p>
        </div>

        <div className="rounded-lg overflow-hidden border">
          <PublicWorldMap />
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {continents.map((c) => (
            <Link
              key={c.key}
              href={`/zeme/${c.key}`}
              className="group block rounded-lg border p-4 hover:border-green-400 transition"
            >
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-gray-900 group-hover:text-green-600">
                  {c.label}
                </div>
                <span className="text-green-600">→</span>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                Země, tipy, články a inspirace.
              </p>
            </Link>
          ))}
        </section>

        {/* <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Nejnovější články</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-6 w-3/5" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section> */}
      </div>
    </main>
  );
}
