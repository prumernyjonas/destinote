// src/components/articles/ArticlesTeaser.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import Link from "next/link";

type Props = {
  title?: string;
  href?: string; // CTA na plný výpis článků/komunity
};

export default function ArticlesTeaser({
  title = "Nejnovější články",
  href = "/community",
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <Link
          href={href}
          className="text-green-700 font-medium hover:text-green-900"
        >
          Zobrazit více →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-3/5" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
