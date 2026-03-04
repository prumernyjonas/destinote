/**
 * Jednoduchý skeleton fallback pro Suspense hlavního obsahu (bez Lottie).
 * Použít v layoutu místo PageLoading, aby se při načítání stránky neblikal spinner.
 */
export function ContentLoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-emerald-50/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200/80 rounded-lg w-48" />
          <div className="h-64 bg-gray-200/80 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-40 bg-gray-200/80 rounded-xl" />
            <div className="h-40 bg-gray-200/80 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
