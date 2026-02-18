"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { slugifyNickname } from "@/utils/slugify";
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

function StatPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "gold" | "silver" | "bronze";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-slate-50 text-slate-700 ring-slate-200",
    gold: "bg-yellow-50 text-yellow-700 ring-yellow-200",
    silver: "bg-gray-50 text-gray-700 ring-gray-200",
    bronze: "bg-orange-50 text-orange-700 ring-orange-200",
  };

  return (
    <span
      className={`mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function Podium({ top3 }: { top3: LeaderboardEntry[] }) {
  const [first, second, third] = top3;

  // Pokud není dostatek dat, nezobrazovat podium
  if (!first) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {second && (
        <Card
          className="order-2 sm:order-1 flex flex-col items-center gap-1"
          padding="lg"
        >
          <div className="inline-flex items-center rounded-full bg-gray-50 px-3 py-1 text-sm font-extrabold text-slate-900 ring-1 ring-inset ring-gray-200">
            #{second.rank}
          </div>
          <img
            src={second.avatarUrl}
            alt={second.displayName}
            className="h-16 w-16 rounded-full mt-3"
          />
          <Link
            href={`/profil/${slugifyNickname(second.displayName)}`}
            className="mt-2 text-base text-slate-900 font-semibold hover:text-emerald-600 hover:underline underline-offset-4 transition-colors"
          >
            {second.displayName}
          </Link>
          <StatPill tone="silver">{second.countryCount} zemí</StatPill>
        </Card>
      )}

      <Card
        className="order-1 sm:order-2 flex flex-col items-center gap-1 sm:transform sm:-translate-y-2"
        padding="lg"
        variant="elevated"
      >
        <div className="inline-flex items-center rounded-full bg-yellow-50 px-3 py-1 text-sm font-black text-yellow-800 ring-1 ring-inset ring-yellow-200">
          #{first.rank}
        </div>
        <img
          src={first.avatarUrl}
          alt={first.displayName}
          className="h-20 w-20 rounded-full mt-3 ring-4 ring-yellow-200"
        />
        <Link
          href={`/profil/${slugifyNickname(first.displayName)}`}
          className="mt-2 text-base text-slate-900 font-bold hover:text-emerald-600 hover:underline underline-offset-4 transition-colors"
        >
          {first.displayName}
        </Link>
        <StatPill tone="gold">{first.countryCount} zemí</StatPill>
        {first.badges.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {first.badges.map((b, i) => (
              <span
                key={`${b}-${i}`}
                className="inline-flex items-center rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-700"
              >
                {b}
              </span>
            ))}
          </div>
        )}
      </Card>

      {third && (
        <Card className="order-3 flex flex-col items-center gap-1" padding="lg">
          <div className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-sm font-extrabold text-slate-900 ring-1 ring-inset ring-orange-200">
            #{third.rank}
          </div>
          <img
            src={third.avatarUrl}
            alt={third.displayName}
            className="h-16 w-16 rounded-full mt-3"
          />
          <Link
            href={`/profil/${slugifyNickname(third.displayName)}`}
            className="mt-2 text-base text-slate-900 font-semibold hover:text-emerald-600 hover:underline underline-offset-4 transition-colors"
          >
            {third.displayName}
          </Link>
          <StatPill tone="bronze">{third.countryCount} zemí</StatPill>
          {third.badges.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {third.badges.map((b, i) => (
                <span
                  key={`${b}-${i}`}
                  className="inline-flex items-center rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  {b}
                </span>
              ))}
            </div>
          )}
        </Card>
      )}
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
                  <th className="py-3 pr-3 hidden sm:table-cell">Země</th>
                  <th className="py-3 pr-3 hidden md:table-cell">Aktivita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((u) => (
                  <tr
                    key={u.id}
                    className="text-sm hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3 pr-3 font-bold text-slate-900">
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
                          <Link
                            href={`/profil/${slugifyNickname(u.displayName)}`}
                            className="text-slate-900 font-semibold hover:text-emerald-600 hover:underline underline-offset-4 transition-colors"
                          >
                            {u.displayName}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-3 hidden sm:table-cell text-slate-700 font-medium">
                      {u.countryCount}
                    </td>
                    <td className="py-3 pr-3 hidden md:table-cell text-slate-500">
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
  const [data, setData] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const res = await fetch("/api/leaderboard?limit=100");
        const json = await res.json();

        if (!json.ok) {
          throw new Error(json.error || "Nepodařilo se načíst žebříček");
        }

        setData(json.data || []);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching leaderboard:", err);
        setError(err.message || "Chyba při načítání žebříčku");
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  const top3 = data.slice(0, 3);
  const rest = data.slice(3);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Žebříček</h1>
          <p className="text-slate-600 mt-2">
            Top cestovatelé podle počtu navštívených zemí
          </p>
        </div>
      </div>

      <ErrorMessage error={error} className="mt-4" />

      <section className="mt-6">
        {loading ? (
          <PodiumSkeleton />
        ) : top3.length > 0 ? (
          <Podium top3={top3} />
        ) : null}
      </section>

      {loading && (
        <div className="mt-8 flex justify-center">
          <LoadingSpinner text="Načítání žebříčku…" />
        </div>
      )}
    </main>
  );
}
