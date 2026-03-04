import { Skeleton } from "@/components/ui/Skeleton";

export default function ZebricekLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6">
          <Skeleton className="h-9 w-48 bg-slate-700/80" />
          <Skeleton className="h-5 w-72 mt-2 bg-slate-800/60" />
        </header>
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-10 w-24 rounded-lg bg-slate-800/80" />
          <Skeleton className="h-10 w-20 rounded-lg bg-slate-800/80" />
          <Skeleton className="h-10 w-28 rounded-lg bg-slate-800/80" />
        </div>
        <section className="mb-8">
          <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end">
            {[2, 1, 3].map((rank) => (
              <div key={rank} className="flex flex-col items-center">
                <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-slate-700/80 mb-2" />
                <Skeleton className="h-4 w-16 bg-slate-700/60 mb-2" />
                <Skeleton className="h-8 w-14 rounded-full bg-slate-700/60 mb-3" />
                <Skeleton className="h-12 w-full rounded-t-lg bg-slate-700/80" style={{ minHeight: "48px" }} />
              </div>
            ))}
          </div>
        </section>
        <section className="mb-8">
          <div className="rounded-xl overflow-hidden border border-slate-600/50 bg-slate-800/40">
            <div className="p-4 border-b border-slate-600/50">
              <div className="flex gap-4">
                <Skeleton className="h-4 w-8 bg-slate-600/80" />
                <Skeleton className="h-4 w-32 bg-slate-600/80" />
                <Skeleton className="h-4 w-16 bg-slate-600/80 hidden sm:block" />
                <Skeleton className="h-4 w-20 bg-slate-600/80 hidden md:block" />
              </div>
            </div>
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4 border-b border-slate-700/60 last:border-0">
                <Skeleton className="h-4 w-6 bg-slate-600/60" />
                <Skeleton className="h-9 w-9 rounded-full bg-slate-600/60 flex-shrink-0" />
                <Skeleton className="h-4 flex-1 max-w-[120px] bg-slate-600/60" />
                <Skeleton className="h-4 w-8 bg-slate-600/60 hidden sm:block" />
                <Skeleton className="h-3 w-16 bg-slate-600/60 hidden md:block" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
