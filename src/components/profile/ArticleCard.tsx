"use client";

import Link from "next/link";
import Image from "next/image";
import { FiEdit2, FiTrash2, FiFileText } from "react-icons/fi";
import StatusBadge from "./StatusBadge";

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

interface ArticleCardProps {
  article: Article;
  onDelete: (articleId: string, articleTitle: string) => void;
}

export default function ArticleCard({ article, onDelete }: ArticleCardProps) {
  const canEdit = article.status === "draft" || article.status === "approved";
  const isPending = article.status === "pending";

  const articleLink =
    article.status === "draft"
      ? `/dashboard/articles/${article.id}/edit`
      : article.slug
      ? `/clanek/${article.slug}`
      : `/dashboard/articles/${article.id}/edit`;

  const status = (article.status as "approved" | "pending" | "rejected" | "draft") || "draft";

  return (
    <div
      className={`group relative bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4 p-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          {article.main_image_url ? (
            <div className="w-full md:w-28 lg:w-32 aspect-video rounded-xl overflow-hidden bg-slate-200">
              <Image
                src={article.main_image_url}
                alt={article.main_image_alt || article.title}
                width={128}
                height={72}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full md:w-28 lg:w-32 aspect-video rounded-xl bg-slate-100 flex items-center justify-center">
              <FiFileText className="w-8 h-8 text-slate-400" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {isPending ? (
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate">
                {article.title}
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                <StatusBadge status={status} />
              </div>
            </div>
          ) : (
            <Link href={articleLink} className="block group/link cursor-pointer">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate group-hover/link:text-emerald-700 group-hover/link:underline transition-colors duration-200">
                {article.title}
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                <StatusBadge status={status} />
              </div>
            </Link>
          )}
        </div>

        {/* Actions - desktop: skryté, zobrazí se na hover; mobil: vždy viditelné */}
        <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          {canEdit && (
            <Link
              href={`/dashboard/articles/${article.id}/edit`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2"
              title="Upravit článek"
              aria-label="Upravit článek"
            >
              <FiEdit2 className="w-4 h-4" aria-hidden="true" />
              <span className="hidden md:inline">Upravit</span>
            </Link>
          )}
          {isPending && (
            <button
              disabled
              className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 text-slate-400 rounded-lg font-medium text-sm cursor-not-allowed opacity-50"
              title="Článek čeká na schválení a nelze ho upravit"
              aria-label="Článek čeká na schválení"
            >
              <FiEdit2 className="w-4 h-4" aria-hidden="true" />
              <span className="hidden md:inline">Upravit</span>
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(article.id, article.title);
            }}
            className="inline-flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2"
            title="Smazat článek"
            aria-label="Smazat článek"
          >
            <FiTrash2 className="w-4 h-4" aria-hidden="true" />
            <span className="hidden md:inline">Smazat</span>
          </button>
        </div>
      </div>
    </div>
  );
}
