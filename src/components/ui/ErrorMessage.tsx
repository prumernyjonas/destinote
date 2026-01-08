// components/ui/ErrorMessage.tsx
import { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface ErrorMessageProps extends HTMLAttributes<HTMLDivElement> {
  error?: string | null;
  variant?: "default" | "inline";
}

export function ErrorMessage({
  className,
  error,
  variant = "default",
  ...props
}: ErrorMessageProps) {
  if (!error) return null;

  const baseClasses = "text-red-600 text-sm";

  const variants = {
    default: "bg-red-50 border border-red-200 rounded-lg p-3",
    inline: "",
  };

  return (
    <div className={cn(baseClasses, variants[variant], className)} {...props}>
      <div className="flex items-center">
        <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        {error}
      </div>
    </div>
  );
}
