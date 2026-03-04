"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { slugifyNickname } from "@/utils/slugify";
import { FiGlobe } from "react-icons/fi";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useAuth } from "@/hooks/useAuth";

type LeaderboardBadge = {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
};

type LeaderboardEntry = {
  id: string;
  rank: number;
  displayName: string;
  avatarUrl: string;
  score: number;
  countryCount: number;
  badges: LeaderboardBadge[];
  updatedAt: string;
};

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

function badgeIconSrc(badge: LeaderboardBadge): string | null {
  const raw = badge.iconUrl;
  if (!raw || typeof raw !== "string") return null;
  if (raw.startsWith("http") || raw.startsWith("/")) return raw;
  const filename = raw.replace(/^badges\/?/, "").trim();
  return filename ? `/badges/${filename}` : null;
}

function BadgeIcons({ badges }: { badges: LeaderboardBadge[] }) {
  if (!badges.length) return null;
  return (
    <div className="flex flex-wrap gap-1 justify-center items-center" title={badges.map((b) => b.name).join(", ")}>
      {badges.slice(0, 5).map((badge) => {
        const src = badgeIconSrc(badge);
        return (
          <span
            key={badge.id}
            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-600/80 border border-slate-500/50 flex-shrink-0"
            title={badge.name}
          >
            {src ? (
              <Image
                src={src}
                alt={badge.name}
                width={24}
                height={24}
                className="object-contain w-5 h-5 rounded-full"
                unoptimized={src.startsWith("/badges/")}
              />
            ) : (
              <span className="text-xs" aria-hidden>🏅</span>
            )}
          </span>
        );
      })}
      {badges.length > 5 && (
        <span className="text-slate-400 text-xs">+{badges.length - 5}</span>
      )}
    </div>
  );
}

type TabId = "all" | "month" | "week";

function Podium({ top3 }: { top3: LeaderboardEntry[] }) {
  const [first, second, third] = top3;

  if (!first) return null;

  const entries = [
    { entry: second, rank: 2, order: "order-2 sm:order-1", stepHeight: "h-14 sm:h-16", badge: "bg-slate-500 text-slate-100 border-slate-400/50", blockClass: "podium-block", avatarSize: "h-16 w-16 sm:h-20 sm:w-20" },
    { entry: first, rank: 1, order: "order-1 sm:order-2", stepHeight: "h-20 sm:h-24", badge: "bg-gradient-to-br from-amber-400 to-amber-600 text-white border-amber-300/50 shadow-lg shadow-amber-500/30", blockClass: "podium-block podium-block-gold", avatarSize: "h-20 w-20 sm:h-24 sm:w-24" },
    { entry: third, rank: 3, order: "order-3", stepHeight: "h-10 sm:h-12", badge: "bg-amber-700/90 text-amber-100 border-amber-600/50", blockClass: "podium-block", avatarSize: "h-16 w-16 sm:h-20 sm:w-20" },
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end">
      {entries.map(({ entry, rank, order, stepHeight, badge, blockClass, avatarSize }) => {
        if (!entry) return <div key={rank} className={order} />;
        const slug = slugifyNickname(entry.displayName);
        const displayNameTruncated = entry.displayName.length > 12
          ? `${entry.displayName.slice(0, 10)}...`
          : entry.displayName;
        return (
          <div
            key={entry.id}
            className={`${order} flex flex-col items-center`}
          >
            {/* Avatar + odznak pořadí (nad stupněm) */}
            <div className="flex flex-col items-center mb-2 sm:mb-3">
              <div className="relative">
                <img
                  src={entry.avatarUrl}
                  alt={entry.displayName}
                  className={`${avatarSize} rounded-full object-cover ring-2 ring-slate-600/80 shadow-xl flex-shrink-0`}
                />
                <span
                  className={`absolute -top-0.5 -right-0.5 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 ${badge} font-black text-sm sm:text-base`}
                  aria-hidden
                >
                  {rank}
                </span>
              </div>
              <Link
                href={`/profil/${slug}`}
                className="mt-2 sm:mt-3 text-slate-200 font-semibold text-sm sm:text-base hover:text-[var(--color-travel-300)] transition-colors truncate max-w-[100%] px-1 text-center block"
                title={entry.displayName}
              >
                {displayNameTruncated}
              </Link>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-700/80 px-3 py-1.5 border border-slate-600/60">
                <FiGlobe className="text-[var(--color-travel-400)] w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-slate-200 font-bold tabular-nums text-sm">
                  {entry.countryCount}
                </span>
                <span className="text-slate-500 text-xs">zemí</span>
              </div>
              {entry.badges.length > 0 && (
                <div className="mt-1.5">
                  <BadgeIcons badges={entry.badges} />
                </div>
              )}
            </div>

            {/* 3D stupeň s velkým číslem */}
            <div
              className={`w-full rounded-t-lg flex items-center justify-center ${stepHeight} ${blockClass}`}
              style={{ minHeight: "48px" }}
            >
              <span className="text-3xl sm:text-4xl font-black text-slate-400/90 tabular-nums drop-shadow-sm">
                {rank}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LeaderboardTable({ items }: { items: LeaderboardEntry[] }) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-xl overflow-hidden border border-slate-600/50 bg-slate-800/40">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-600/50">
              <th className="py-3.5 pl-6 pr-3">#</th>
              <th className="py-3.5 pr-3">Uživatel</th>
              <th className="py-3.5 pr-3 hidden sm:table-cell">Země</th>
              <th className="py-3.5 pr-6 hidden md:table-cell">Aktivita</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60">
            {items.map((u) => (
              <tr
                key={u.id}
                className="text-sm hover:bg-slate-700/30 transition-colors"
              >
                <td className="py-3.5 pl-6 pr-3 font-bold text-slate-200 tabular-nums">
                  {u.rank}
                </td>
                <td className="py-3.5 pr-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatarUrl}
                      alt={u.displayName}
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-600"
                    />
                    <div className="min-w-0">
                      <Link
                        href={`/profil/${slugifyNickname(u.displayName)}`}
                        className="text-slate-200 font-medium hover:text-[var(--color-travel-300)] transition-colors"
                      >
                        {u.displayName}
                      </Link>
                      {u.badges.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {u.badges.slice(0, 4).map((badge) => {
                            const src = badgeIconSrc(badge);
                            return (
                              <span
                                key={badge.id}
                                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-600/80 border border-slate-500/50"
                                title={badge.name}
                              >
                                {src ? (
                                  <Image
                                    src={src}
                                    alt={badge.name}
                                    width={20}
                                    height={20}
                                    className="object-contain w-4 h-4 rounded-full"
                                    unoptimized={src.startsWith("/badges/")}
                                  />
                                ) : (
                                  <span className="text-[10px]" aria-hidden>🏅</span>
                                )}
                              </span>
                            );
                          })}
                          {u.badges.length > 4 && (
                            <span className="text-slate-500 text-xs">+{u.badges.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3.5 pr-3 hidden sm:table-cell text-slate-300 font-medium tabular-nums">
                  {u.countryCount}
                </td>
                <td className="py-3.5 pr-6 hidden md:table-cell text-slate-500 text-xs">
                  {timeFromNow(u.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function YourPositionStrip({
  entry,
  totalUsers,
}: {
  entry: LeaderboardEntry;
  totalUsers: number;
}) {
  return (
    <div className="rounded-xl border border-slate-600/50 bg-slate-800/50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-slate-400 text-sm">
          Tvoje pozice:{" "}
          <strong className="text-slate-200">#{entry.rank}</strong>
          {" "}z {totalUsers} uživatelů
        </span>
        <span className="text-slate-500">·</span>
        <span className="text-slate-400 text-sm">
          Navštívil jsi <strong className="text-[var(--color-travel-300)]">{entry.countryCount} zemí</strong>
        </span>
        {entry.badges.length > 0 && (
          <>
            <span className="text-slate-500">·</span>
            <BadgeIcons badges={entry.badges} />
          </>
        )}
      </div>
      <Link
        href={`/profil/${slugifyNickname(entry.displayName)}`}
        className="text-sm font-medium text-[var(--color-travel-300)] hover:text-[var(--color-travel-200)] transition-colors"
      >
        Můj profil →
      </Link>
    </div>
  );
}

function YourPositionCard({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div className="rounded-xl border-2 border-[var(--color-travel-500)]/50 bg-slate-800/80 p-4 leaderboard-glow">
      <p className="text-xs font-semibold text-[var(--color-travel-300)] uppercase tracking-wider mb-3">
        Tvoje pozice
      </p>
      <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-700/50 border border-slate-600/50">
        <span className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-travel-500)] text-white font-black text-lg shrink-0">
          #{entry.rank}
        </span>
        <img
          src={entry.avatarUrl}
          alt={entry.displayName}
          className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-500"
        />
        <div className="min-w-0 flex-1">
          <Link
            href={`/profil/${slugifyNickname(entry.displayName)}`}
            className="font-semibold text-slate-200 hover:text-[var(--color-travel-300)] transition-colors block truncate"
          >
            {entry.displayName}
          </Link>
          <p className="text-sm text-slate-500">
            {entry.countryCount} zemí · {timeFromNow(entry.updatedAt)}
          </p>
          {entry.badges.length > 0 && (
            <div className="mt-1">
              <BadgeIcons badges={entry.badges} />
            </div>
          )}
        </div>
        <Link
          href={`/profil/${slugifyNickname(entry.displayName)}`}
          className="text-sm font-medium text-[var(--color-travel-300)] hover:text-[var(--color-travel-200)] shrink-0"
        >
          Můj profil →
        </Link>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const { user } = useAuth();

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
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Chyba při načítání žebříčku";
        console.error("Error fetching leaderboard:", err);
        setError(message);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  const top3 = data.slice(0, 3);
  const positions4to10 = data.slice(3, 10);
  const currentUserEntry = user ? data.find((e) => e.id === user.uid) : null;
  const totalUsers = data.length;

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-6">
            <Skeleton className="h-9 w-48 bg-slate-700/80" />
            <Skeleton className="h-5 w-72 mt-2 bg-slate-800/60" />
          </header>
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="h-10 w-24 rounded-lg bg-slate-800/80" />
            <Skeleton className="h-10 w-20 rounded-lg bg-slate-800/80" />
            <Skeleton className="h-10 w-28 rounded-lg bg-slate-800/80" />
          </div>
          <section className="mb-8">
            <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end">
              {[2, 1, 3].map((rank) => (
                <div key={rank} className="flex flex-col items-center">
                  <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-slate-700/80 mb-2" />
                  <Skeleton className="h-4 w-16 bg-slate-700/60 mb-2" />
                  <Skeleton className="h-8 w-14 rounded-full bg-slate-700/60 mb-3" />
                  <Skeleton className="h-12 w-full rounded-t-lg bg-slate-700/80" style={{ minHeight: "48px" }} />
                </div>
              ))}
            </div>
          </section>
          <section className="mb-8">
            <div className="rounded-xl overflow-hidden border border-slate-600/50 bg-slate-800/40">
              <div className="p-4 border-b border-slate-600/50">
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-8 bg-slate-600/80" />
                  <Skeleton className="h-4 w-32 bg-slate-600/80" />
                  <Skeleton className="h-4 w-16 bg-slate-600/80 hidden sm:block" />
                  <Skeleton className="h-4 w-20 bg-slate-600/80 hidden md:block" />
                </div>
              </div>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex items-center gap-3 p-4 border-b border-slate-700/60 last:border-0">
                  <Skeleton className="h-4 w-6 bg-slate-600/60" />
                  <Skeleton className="h-9 w-9 rounded-full bg-slate-600/60 flex-shrink-0" />
                  <Skeleton className="h-4 flex-1 max-w-[120px] bg-slate-600/60" />
                  <Skeleton className="h-4 w-8 bg-slate-600/60 hidden sm:block" />
                  <Skeleton className="h-3 w-16 bg-slate-600/60 hidden md:block" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Žebříček
          </h1>
          <p className="text-slate-400 mt-1">
            Top cestovatelé podle počtu navštívených zemí
          </p>
        </header>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "all"
                ? "bg-[var(--color-travel-500)] text-white"
                : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60"
            }`}
          >
            Celkově
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("month")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "month"
                ? "bg-[var(--color-travel-500)] text-white"
                : "bg-slate-800 text-slate-500 hover:text-slate-300"
            }`}
            disabled
            title="Připravujeme"
          >
            Měsíc
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("week")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "week"
                ? "bg-[var(--color-travel-500)] text-white"
                : "bg-slate-800 text-slate-500 hover:text-slate-300"
            }`}
            disabled
            title="Připravujeme"
          >
            Týden
          </button>
        </div>

        <ErrorMessage
          error={error}
          className="mt-4 text-red-300 bg-red-900/20 border-red-500/30 rounded-lg px-4 py-2"
        />

        <section className="mb-8">
          {top3.length > 0 ? <Podium top3={top3} /> : null}
        </section>

        {/* Pruh s pozicí přihlášeného uživatele (pod top 3) */}
        {user && currentUserEntry && (
          <section className="mb-6">
            <YourPositionStrip entry={currentUserEntry} totalUsers={totalUsers} />
          </section>
        )}

        <section className="mb-8">
          <LeaderboardTable items={positions4to10} />
        </section>

        {user && currentUserEntry && currentUserEntry.rank > 10 && (
          <section>
            <YourPositionCard entry={currentUserEntry} />
          </section>
        )}

        {user && currentUserEntry && currentUserEntry.rank <= 10 && (
          <p className="text-center text-slate-500 text-sm py-2">
            Jsi v top 10 — tvoje pozice je výše v tabulce.
          </p>
        )}
      </div>
    </main>
  );
}
