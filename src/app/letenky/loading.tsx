import { Skeleton } from "@/components/ui/Skeleton";

export default function LetenkyLoading() {
  return (
    <>
      <div className="w-full mb-8 relative">
        <Skeleton className="w-full h-96 rounded-lg" />
      </div>
      <div className="p-4 flex gap-3">
        <Skeleton className="h-10 w-40 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>
      <div className="w-full relative" style={{ minHeight: "calc(100vh - 120px)" }}>
        <Skeleton className="w-full h-full rounded-lg" style={{ minHeight: "calc(100vh - 120px)" }} />
      </div>
    </>
  );
}
