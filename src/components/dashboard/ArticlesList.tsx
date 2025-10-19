// components/dashboard/ArticlesList.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Article } from "@/types/database";

interface ArticlesListProps {
  articles: Article[];
}

export function ArticlesList({ articles }: ArticlesListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Moje články</CardTitle>
          <Button>Nový článek</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {articles.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Zatím jste nenapsali žádné články.
            </p>
          ) : (
            articles.map((article) => (
              <div key={article.id} className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900">{article.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {article.countryName} • Publikováno{" "}
                  {article.createdAt.toLocaleDateString("cs-CZ")}
                </p>
                <p className="text-gray-700 mt-2">
                  {article.content.substring(0, 150)}...
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
