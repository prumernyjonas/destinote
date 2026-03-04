import { Skeleton } from "@/components/ui/Skeleton";

export default function KomunitaLoading() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Skeleton className="h-10 flex-1 rounded-md" />
            <Skeleton className="h-10 md:w-64 rounded-md" />
            <Skeleton className="h-10 md:w-48 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-100 overflow-hidden">
              <Skeleton className="w-full h-52 rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
