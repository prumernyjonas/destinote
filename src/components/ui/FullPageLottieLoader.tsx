"use client";

import Lottie from "lottie-react";
import { cn } from "@/utils/cn";

import gradientAnimationData from "@/assets/Gradient.json";

interface FullPageLottieLoaderProps {
  message?: string;
}

/** Lottie loader na celou viewport – střed obrazovky, používá Gradient.json z public */
export function FullPageLottieLoader({ message = "Načítám…" }: FullPageLottieLoaderProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 px-4 sm:gap-8"
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <div className="absolute inset-0 bg-white/90 dark:bg-gray-950/90" aria-hidden />

      <div className="relative flex flex-col items-center justify-center gap-6 sm:gap-8">
        <div className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] flex-shrink-0">
          <Lottie
            animationData={gradientAnimationData}
            loop
            className="w-full h-full"
          />
        </div>
        {message && (
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center font-medium max-w-xs">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
