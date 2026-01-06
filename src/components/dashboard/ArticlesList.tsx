// components/dashboard/ArticlesList.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Article } from "@/types/database";
import { useRouter } from "next/navigation";

interface ArticlesListProps {
  articles: Article[];
}

export function ArticlesList({ articles }: ArticlesListProps) {
  const router = useRouter();

  function getStatusInfo(status?: string) {
    switch (status) {
      case "draft":
        return { label: "Koncept", color: "bg-gray-100 text-gray-800" };
      case "pending":
        return {
          label: "Čeká na schválení",
          color: "bg-yellow-100 text-yellow-800",
        };
      case "approved":
        return { label: "Schváleno", color: "bg-green-100 text-green-800" };
      case "rejected":
        return { label: "Zamítnuto", color: "bg-red-100 text-red-800" };
      default:
        return { label: "Koncept", color: "bg-gray-100 text-gray-800" };
    }
  }

  function handleClick(article: Article) {
    if (article.status === "pending") return;
    // Všechny články (draft, approved, rejected) -> editace
    router.push(`/dashboard/articles/${article.id}/edit`);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Moje články</CardTitle>
          <Button
            onClick={() => router.push("/clanek/novy")}
            className="cursor-pointer"
          >
            Nový článek
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {articles.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Zatím jste nenapsali žádné články.
            </p>
          ) : (
            articles.map((article) => {
              const statusInfo = getStatusInfo(article.status);
              const isDisabled = article.status === "pending";
              return (
                <div
                  key={article.id}
                  onClick={() => handleClick(article)}
                  className={`border rounded-lg p-4 transition ${
                    isDisabled
                      ? "opacity-60 cursor-not-allowed"
                      : "cursor-pointer hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Vytvořeno{" "}
                        {article.createdAt.toLocaleDateString("cs-CZ")} •
                        Upraveno {article.updatedAt.toLocaleDateString("cs-CZ")}
                      </p>
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
