"use client";

import { cn } from "@/utils/cn";
import Lottie from "lottie-react";
import { FullPageLottieLoader } from "@/components/ui/FullPageLottieLoader";
import gradientAnimationData from "@/assets/Gradient.json";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Volitelný text pod spinnerem */
  text?: string;
  /** Zobrazit na celou stránku (centrovaný blok) – používá Lottie Gradient.json */
  fullPage?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

export function LoadingSpinner({
  className,
  size = "md",
  text,
  fullPage,
}: LoadingSpinnerProps) {
  if (fullPage) {
    return <FullPageLottieLoader message={text} />;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn(sizeClasses[size], className)}>
        <Lottie
          animationData={gradientAnimationData}
          loop
          className="w-full h-full"
        />
      </div>
      {text && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{text}</p>
      )}
    </div>
  );
}
