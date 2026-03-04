import ProfileHero from "@/components/profile/ProfileHero";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

/** Skeleton při načítání segmentu /profil/[...] – žádný Lottie spinner */
export default function ProfilLoading() {
  return (
    <div className="min-h-screen relative">
      <ProfileHero />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mt-6 rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 space-y-6">
          <Card className="rounded-2xl border border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border border-slate-200 shadow-sm">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Skeleton key={i} className="h-8 w-24 rounded-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border border-slate-200 shadow-sm">
            <CardHeader>
              <Skeleton className="h-6 w-28" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="w-full h-40 rounded-xl" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
