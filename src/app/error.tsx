"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Error boundary:", error);
    }
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Něco se pokazilo
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Došlo k neočekávané chybě. Můžete zkusit znovu načíst stránku nebo se
          vrátit na úvodní stránku.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="primary" className="cursor-pointer">
            Zkusit znovu
          </Button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg font-medium px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          >
            Úvodní stránka
          </Link>
        </div>
      </div>
    </div>
  );
}
