/**
 * Při načítání úvodní stránky (/) – pouze pozadí jako homepage hero, bez loadera.
 * Žádný Lottie ani skeleton; karty článků dole mají vlastní placeholdery.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
  );
}
