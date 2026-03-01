"use client";

import { FullPageLottieLoader } from "@/components/ui/FullPageLottieLoader";

interface PageLoadingProps {
  message?: string;
}

/**
 * Centrální loading stav pro celou stránku (např. Suspense fallback).
 * Na celé obrazovce, uprostřed, responzivní, s Lottie animací Gradient.json.
 */
export function PageLoading({ message = "Načítám…" }: PageLoadingProps) {
  return <FullPageLottieLoader message={message} />;
}
