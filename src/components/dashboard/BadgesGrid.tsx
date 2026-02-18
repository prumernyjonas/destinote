// components/dashboard/BadgesGrid.tsx
"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Badge } from "@/types/database";

interface BadgesGridProps {
  badges: Badge[];
  /** Kompaktní zobrazení: řádek malých ikon jako u ostatních sekcí */
  compact?: boolean;
}

/**
 * URL ikony odznaku: plná URL (Cloudinary) se použije jak je,
 * jinak se bere z public/badges (název souboru → /badges/nazev).
 */
function badgeIconSrc(badge: Badge): string | null {
  const raw = badge.iconUrl ?? badge.icon;
  if (!raw || typeof raw !== "string") return null;
  if (raw.startsWith("http") || raw.startsWith("/")) return raw;
  const filename = raw.replace(/^badges\/?/, "").trim();
  return filename ? `/badges/${filename}` : null;
}

export function BadgesGrid({ badges, compact = true }: BadgesGridProps) {
  const [failedIconIds, setFailedIconIds] = useState<Set<string>>(new Set());
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const markIconFailed = useCallback((id: string) => {
    setFailedIconIds((prev) => new Set(prev).add(id));
  }, []);

  if (badges.length === 0) {
    return (
      <p className="text-slate-500 text-sm py-4">
        Zatím žádné odznaky.
      </p>
    );
  }

  const size = compact ? 36 : 48;

  if (compact) {
    return (
      <>
        <div className="flex flex-wrap gap-2.5 items-center">
          {badges.map((badge) => {
            const src = badgeIconSrc(badge);
            const showImage = src && !failedIconIds.has(badge.id);
            return (
              <button
                key={badge.id}
                type="button"
                onClick={() => setSelectedBadge(badge)}
                title={badge.name}
                className={`inline-flex items-center justify-center rounded-full bg-slate-50 border border-slate-200 w-12 h-12 flex-shrink-0 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                  badge.earnedAt ? "" : "opacity-40"
                }`}
              >
                {showImage ? (
                  <Image
                    src={src}
                    alt={badge.name}
                    width={size}
                    height={size}
                    className="object-contain w-8 h-8"
                    unoptimized={src.startsWith("/badges/")}
                    onError={() => markIconFailed(badge.id)}
                  />
                ) : (
                  <span className="text-xl" aria-hidden>
                    {badge.icon ?? "🏅"}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal s detailem odznaku */}
        {selectedBadge && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedBadge(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="badge-modal-title"
          >
            <div
              className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`rounded-full bg-slate-50 border border-slate-200 w-16 h-16 flex items-center justify-center mb-4 ${
                    selectedBadge.earnedAt ? "" : "opacity-50"
                  }`}
                >
                  {(() => {
                    const src = badgeIconSrc(selectedBadge);
                    const show =
                      src && !failedIconIds.has(selectedBadge.id);
                    return show ? (
                      <Image
                        src={src}
                        alt={selectedBadge.name}
                        width={56}
                        height={56}
                        className="object-contain w-14 h-14"
                        unoptimized={src.startsWith("/badges/")}
                        onError={() => markIconFailed(selectedBadge.id)}
                      />
                    ) : (
                      <span className="text-3xl">
                        {selectedBadge.icon ?? "🏅"}
                      </span>
                    );
                  })()}
                </div>
                <h2
                  id="badge-modal-title"
                  className="text-lg font-semibold text-gray-900 mb-1"
                >
                  {selectedBadge.name}
                </h2>
                {selectedBadge.description && (
                  <p className="text-sm text-slate-600 mb-4">
                    {selectedBadge.description}
                  </p>
                )}
                {selectedBadge.earnedAt ? (
                  <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full">
                    Získáno
                  </span>
                ) : (
                  <span className="inline-block bg-slate-100 text-slate-500 text-xs px-3 py-1.5 rounded-full">
                    Progres: {selectedBadge.progress ?? 0}%
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="mt-4 w-full py-2 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Zavřít
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {badges.map((badge) => {
        const src = badgeIconSrc(badge);
        const showImage = src && !failedIconIds.has(badge.id);
        return (
          <div
            key={badge.id}
            className={`text-center p-3 border border-slate-200 rounded-xl bg-slate-50/50 ${
              badge.earnedAt ? "" : "opacity-60"
            }`}
          >
            <div className="flex justify-center items-center h-10 mb-1.5">
              {showImage ? (
                <Image
                  src={src}
                  alt={badge.name}
                  width={size}
                  height={size}
                  className="object-contain"
                  unoptimized={src?.startsWith("/badges/")}
                  onError={() => markIconFailed(badge.id)}
                />
              ) : (
                <span className="text-2xl">{badge.icon ?? "🏅"}</span>
              )}
            </div>
            <p className="text-xs font-medium text-gray-800 truncate" title={badge.name}>
              {badge.name}
            </p>
            {badge.earnedAt ? (
              <span className="text-[10px] text-emerald-600 mt-0.5 inline-block">Získáno</span>
            ) : (
              <span className="text-[10px] text-slate-400">{badge.progress ?? 0}%</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
