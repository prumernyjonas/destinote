"use client";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface PageLoadingProps {
  message?: string;
}

/**
 * Centrální loading stav pro celou stránku (např. Suspense fallback).
 */
export function PageLoading({ message = "Načítám…" }: PageLoadingProps) {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 px-4">
      <LoadingSpinner size="lg" />
      {message && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      )}
    </div>
  );
}
