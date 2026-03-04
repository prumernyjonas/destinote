"use client";

import Lottie from "lottie-react";

import gradientAnimationData from "@/assets/Gradient.json";

interface FullPageLottieLoaderProps {
  message?: string;
}

/** Lottie loader na celou viewport – střed obrazovky, používá Gradient.json z public */
export function FullPageLottieLoader({
  message = "Načítám…",
}: FullPageLottieLoaderProps) {
  return (
    <div
      className="fixed top-20 left-0 right-0 bottom-0 z-40 flex flex-col items-center justify-center gap-4 px-4 bg-white"
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <div className="absolute inset-0 bg-white" aria-hidden />

      <div className="relative flex flex-col items-center justify-center gap-4">
        <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
          <Lottie
            animationData={gradientAnimationData}
            loop
            className="w-full h-full"
          />
        </div>
        {message && (
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center font-medium max-w-xs">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
