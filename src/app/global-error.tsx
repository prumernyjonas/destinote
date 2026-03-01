"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Global error boundary:", error);
    }
  }, [error]);

  return (
    <html lang="cs">
      <body className="antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <h1 className="text-xl font-semibold">Něco se pokazilo</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Došlo k závažné chybě aplikace. Zkuste obnovit stránku v prohlížeči
            (F5) nebo se vraťte později.
          </p>
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-lg font-medium px-4 py-2 bg-green-600 hover:bg-green-700 text-white cursor-pointer"
          >
            Zkusit znovu
          </button>
        </div>
      </body>
    </html>
  );
}
