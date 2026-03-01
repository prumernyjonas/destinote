"use client";

import { cn } from "@/utils/cn";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Volitelný text pod spinnerem */
  text?: string;
  /** Zobrazit na celou stránku (centrovaný blok) */
  fullPage?: boolean;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function LoadingSpinner({
  className,
  size = "md",
  text,
  fullPage,
}: LoadingSpinnerProps) {
  const spinner = (
    <svg
      className={cn("animate-spin text-gray-500", sizeClasses[size], className)}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const content = (
    <>
      {spinner}
      {text && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{text}</p>
      )}
    </>
  );

  if (fullPage) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 px-4">
        {content}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {content}
    </div>
  );
}
