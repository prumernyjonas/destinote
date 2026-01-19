"use client";

import Link from "next/link";
import { FiFileText, FiPenTool } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import ArticleCard from "./ArticleCard";

type Article = {
  id: string;
  title: string;
  main_image_url: string | null;
  main_image_alt: string | null;
  slug: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

interface ArticleListProps {
  articles: Article[];
  onDelete: (articleId: string, articleTitle: string) => void;
}

export default function ArticleList({ articles, onDelete }: ArticleListProps) {
  return (
    <Card className="rounded-2xl border border-slate-200 shadow-sm min-h-[600px] flex flex-col">
      <CardHeader className="px-6 pt-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FiFileText className="w-5 h-5 text-emerald-600" aria-hidden="true" />
            Moje články ({articles.length})
          </CardTitle>
          <Link
            href="/clanek/novy"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-sm cursor-pointer"
            aria-label="Napsat nový článek"
          >
            <FiPenTool className="w-4 h-4" aria-hidden="true" />
            Napsat nový článek
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 flex-1">
        {articles.length > 0 ? (
          <div className="space-y-3">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <p className="mb-4">Zatím nemáte žádné články.</p>
            <Link
              href="/clanek/novy"
              className="text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              Napsat první článek
              <span>→</span>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
