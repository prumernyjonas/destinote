import { Skeleton } from "@/components/ui/Skeleton";

export default function ZemeLoading() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>

        <Skeleton className="w-full h-[400px] sm:h-[500px] rounded-lg" />

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-full bg-white rounded-xl border border-gray-200 overflow-hidden p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-6 w-36" />
                </div>
                <Skeleton className="h-5 w-5 rounded shrink-0 mt-1" />
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
