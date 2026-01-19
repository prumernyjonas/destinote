"use client";

import Image from "next/image";

type PendingArticleCardProps = {
  article: {
    id: string;
    title: string;
    main_image_url?: string | null;
    author_id: string;
    created_at: string;
    authorNickname?: string;
  };
  onClick: () => void;
};

export default function PendingArticleCard({
  article,
  onClick,
}: PendingArticleCardProps) {
  return (
    <button
      onClick={onClick}
      className="group text-left bg-white/95 backdrop-blur border border-white/15 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      <div className="aspect-video bg-slate-100 relative overflow-hidden rounded-t-lg">
        {article.main_image_url ? (
          <Image
            src={article.main_image_url}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
            Bez obrázku
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-base font-semibold text-slate-900 line-clamp-2 mb-2 group-hover:text-emerald-600 transition-colors">
          {article.title}
        </h3>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Autor: {article.authorNickname || article.author_id.substring(0, 8) + "..."}
          </span>
          <span>
            {new Date(article.created_at).toLocaleDateString("cs-CZ")}
          </span>
        </div>
      </div>
    </button>
  );
}
