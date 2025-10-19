import { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  rounded?: "sm" | "md" | "lg" | "full";
}

export function Skeleton({
  className,
  rounded = "md",
  ...props
}: SkeletonProps) {
  const radius = {
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  }[rounded];
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200 dark:bg-gray-300/40",
        radius,
        className
      )}
      {...props}
    />
  );
}
