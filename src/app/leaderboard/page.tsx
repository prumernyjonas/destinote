"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

type LeaderboardEntry = {
  id: string;
  rank: number;
  displayName: string;
  avatarUrl: string;
  score: number;
  countryCount: number;
  badges: string[];
  updatedAt: string; // ISO string
};

const mockData: LeaderboardEntry[] = [
  {
    id: "u1",
    rank: 1,
    displayName: "Anna K.",
    avatarUrl: "https://i.pravatar.cc/80?img=11",
    score: 4820,
    countryCount: 27,
    badges: ["🌍", "🏔️", "🏝️"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "u2",
    rank: 2,
    displayName: "Martin S.",
    avatarUrl: "https://i.pravatar.cc/80?img=22",
    score: 4510,
    countryCount: 24,
    badges: ["🌍", "🏙️"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "u3",
    rank: 3,
    displayName: "Lucie P.",
    avatarUrl: "https://i.pravatar.cc/80?img=33",
    score: 4260,
    countryCount: 22,
    badges: ["🏝️"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "u4",
    rank: 4,
    displayName: "Tomáš V.",
    avatarUrl: "https://i.pravatar.cc/80?img=44",
    score: 3890,
    countryCount: 20,
    badges: ["🌋"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "u5",
    rank: 5,
    displayName: "Ema R.",
    avatarUrl: "https://i.pravatar.cc/80?img=55",
    score: 3720,
    countryCount: 19,
    badges: ["🏔️"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "u6",
    rank: 6,
    displayName: "Petr N.",
    avatarUrl: "https://i.pravatar.cc/80?img=66",
    score: 3610,
    countryCount: 18,
    badges: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "u7",
    rank: 7,
    displayName: "Kateřina Z.",
    avatarUrl: "https://i.pravatar.cc/80?img=77",
    score: 3540,
    countryCount: 17,
    badges: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "u8",
    rank: 8,
    displayName: "Jirka D.",
    avatarUrl: "https://i.pravatar.cc/80?img=88",
    score: 3490,
    countryCount: 16,
    badges: ["🏙️"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "u9",
    rank: 9,
    displayName: "Barbora T.",
    avatarUrl: "https://i.pravatar.cc/80?img=99",
    score: 3410,
    countryCount: 16,
    badges: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "u10",
    rank: 10,
    displayName: "Filip H.",
    avatarUrl: "https://i.pravatar.cc/80?img=5",
    score: 3320,
    countryCount: 15,
    badges: ["🌍"],
    updatedAt: new Date().toISOString(),
  },
];

function formatNumber(num: number) {
  return new Intl.NumberFormat("cs-CZ").format(num);
}

function timeFromNow(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "před chvílí";
  if (diffMin < 60) return `před ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `před ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  return `před ${diffD} dny`;
}

function Podium({ top3 }: { top3: LeaderboardEntry[] }) {
  const [first, second, third] = top3;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card
        className="order-2 sm:order-1 flex flex-col items-center"
        padding="lg"
      >
        <div className="text-2xl font-bold text-gray-900">#{second.rank}</div>
        <img
          src={second.avatarUrl}
          alt={second.displayName}
          className="h-16 w-16 rounded-full mt-3"
        />
        <div className="mt-2 text-gray-900 font-medium">
          {second.displayName}
        </div>
        <div className="mt-1 text-green-700 font-bold">
          {formatNumber(second.score)} b
        </div>
        <div className="mt-1 text-sm text-gray-600">
          {second.countryCount} zemí
        </div>
        <div className="mt-2 text-xl">{second.badges.join(" ")}</div>
      </Card>

      <Card
        className="order-1 sm:order-2 flex flex-col items-center sm:transform sm:-translate-y-2"
        padding="lg"
        variant="elevated"
      >
        <div className="text-3xl font-extrabold text-yellow-600">
          #{first.rank}
        </div>
        <img
          src={first.avatarUrl}
          alt={first.displayName}
          className="h-20 w-20 rounded-full mt-3 ring-4 ring-yellow-200"
        />
        <div className="mt-2 text-gray-900 font-semibold">
          {first.displayName}
        </div>
        <div className="mt-1 text-green-700 font-extrabold">
          {formatNumber(first.score)} b
        </div>
        <div className="mt-1 text-sm text-gray-600">
          {first.countryCount} zemí
        </div>
        <div className="mt-2 text-2xl">{first.badges.join(" ")}</div>
      </Card>

      <Card className="order-3 flex flex-col items-center" padding="lg">
        <div className="text-2xl font-bold text-gray-900">#{third.rank}</div>
        <img
          src={third.avatarUrl}
          alt={third.displayName}
          className="h-16 w-16 rounded-full mt-3"
        />
        <div className="mt-2 text-gray-900 font-medium">
          {third.displayName}
        </div>
        <div className="mt-1 text-green-700 font-bold">
          {formatNumber(third.score)} b
        </div>
        <div className="mt-1 text-sm text-gray-600">
          {third.countryCount} zemí
        </div>
        <div className="mt-2 text-xl">{third.badges.join(" ")}</div>
      </Card>
    </div>
  );
}

function PodiumSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="animate-pulse" padding="lg">
          <div className="h-6 w-12 bg-gray-200 rounded" />
          <div className="mt-3 h-16 w-16 rounded-full bg-gray-200 mx-auto" />
          <div className="mt-3 h-4 w-24 bg-gray-200 rounded mx-auto" />
          <div className="mt-2 h-4 w-20 bg-gray-200 rounded mx-auto" />
        </Card>
      ))}
    </div>
  );
}

function LeaderboardTable({ items }: { items: LeaderboardEntry[] }) {
  return (
    <Card variant="outlined">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Žebříček</CardTitle>
          <CardDescription>All‑time top cestovatelé</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            All‑time
          </Button>
          <Button variant="ghost" size="sm">
            Měsíc
          </Button>
          <Button variant="ghost" size="sm">
            Týden
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-gray-600">Zatím žádná data.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500">
                  <th className="py-3 pr-3">#</th>
                  <th className="py-3 pr-3">Uživatel</th>
                  <th className="py-3 pr-3">Body</th>
                  <th className="py-3 pr-3 hidden sm:table-cell">Země</th>
                  <th className="py-3 pr-3 hidden md:table-cell">Aktivita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((u) => (
                  <tr key={u.id} className="text-sm">
                    <td className="py-3 pr-3 font-semibold text-gray-900">
                      {u.rank}
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatarUrl}
                          alt={u.displayName}
                          className="h-8 w-8 rounded-full"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-medium">
                            {u.displayName}
                          </span>
                          {u.badges.length > 0 && (
                            <span className="text-base" title="Odznaky">
                              {u.badges.join(" ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-3 font-semibold text-green-700">
                      {formatNumber(u.score)}
                    </td>
                    <td className="py-3 pr-3 hidden sm:table-cell">
                      {u.countryCount}
                    </td>
                    <td className="py-3 pr-3 hidden md:table-cell text-gray-500">
                      {timeFromNow(u.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <Card variant="outlined">
      <CardHeader>
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const data = useMemo(() => mockData, []);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const top3 = data.slice(0, 3);
  const rest = data.slice(3);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Žebříček</h1>
          <p className="text-gray-600 mt-2">Top cestovatelé – maketa UI</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Button variant="outline" size="sm">
            Pouze přátelé
          </Button>
        </div>
      </div>

      <ErrorMessage error={error} className="mt-4" />

      <section className="mt-6">
        {loading ? <PodiumSkeleton /> : <Podium top3={top3} />}
      </section>

      <section className="mt-6">
        {loading ? <TableSkeleton /> : <LeaderboardTable items={rest} />}
      </section>

      {loading && (
        <div className="mt-8 flex justify-center">
          <LoadingSpinner text="Načítání žebříčku…" />
        </div>
      )}
    </main>
  );
}
