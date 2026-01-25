import PublicWorldMap from "@/components/PublicWorldMap";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { FiMap, FiArrowRight } from "react-icons/fi";

const continents = [
  {
    key: "afrika",
    label: "Afrika",
    description: "Divoká příroda, pestré kultury a úchvatné krajiny",
  },
  {
    key: "severni-amerika",
    label: "Severní Amerika",
    description: "Rozmanité krajiny, moderní metropole a národní parky",
  },
  {
    key: "jizni-amerika",
    label: "Jižní Amerika",
    description: "Amazonské pralesy, andské vrcholky a pulzující kultura",
  },
  {
    key: "asie",
    label: "Asie",
    description: "Starobylé civilizace, moderní megapole a rozmanité krajiny",
  },
  {
    key: "australie",
    label: "Austrálie & Oceánie",
    description: "Jedinečná příroda, nádherné pláže a fascinující kultury",
  },
  {
    key: "evropa",
    label: "Evropa",
    description: "Bohatá historie, rozmanitá kultura a nádherná architektura",
  },
  {
    key: "antarktida",
    label: "Antarktida",
    description: "Ledové krajiny, tučňáci a skutečné dobrodružství",
  },
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

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {continents.map((c) => (
            <Link key={c.key} href={`/zeme/${c.key}`} className="group block">
              <div className="h-full bg-white rounded-xl border border-gray-200 hover:border-emerald-500 hover:shadow-lg transition-all duration-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                        <FiMap className="w-5 h-5 text-emerald-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                        {c.label}
                      </h3>
                    </div>
                    <FiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    {c.description}
                  </p>
                  <div className="flex items-center text-sm text-emerald-600 font-medium">
                    <span>Země, tipy, články a inspirace</span>
                  </div>
                </div>
              </div>
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
