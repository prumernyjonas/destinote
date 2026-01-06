import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import ArticleComments from "@/components/articles/ArticleComments";

type ArticleRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  author_id: string;
  status: string;
  published_at: string | null;
  created_at: string;
  main_image_url: string | null;
  main_image_alt: string | null;
  main_image_width: number | null;
  main_image_height: number | null;
};

export const revalidate = 0;

async function getArticle(slug: string): Promise<ArticleRecord | null> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("articles")
    .select(
      "id, slug, title, summary, content, author_id, status, published_at, created_at, main_image_url, main_image_alt, main_image_width, main_image_height"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[articlePage] supabase error", error.message);
    return null;
  }

  if (!data || data.status !== "approved") {
    return null;
  }

  return data as ArticleRecord;
}

function formatDate(value: string | null) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat("cs-CZ", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: "Článek nenalezen",
      description: "Požadovaný článek nebyl nalezen nebo není zveřejněn.",
    };
  }

  const title = `${article.title} | Destinote`;
  const description =
    article.summary ||
    article.content.slice(0, 140).replace(/\s+/g, " ").trim();

  return {
    title,
    description,
    alternates: {
      canonical: `/clanek/${article.slug}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      images: article.main_image_url
        ? [
            {
              url: article.main_image_url,
              width: article.main_image_width ?? undefined,
              height: article.main_image_height ?? undefined,
              alt: article.main_image_alt ?? article.title,
            },
          ]
        : undefined,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const publishedLabel =
    formatDate(article.published_at) || formatDate(article.created_at);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl space-y-8">
        <div className="space-y-2">
          {publishedLabel ? (
            <p className="text-sm text-gray-500">Publikováno {publishedLabel}</p>
          ) : null}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            {article.title}
          </h1>
          {article.summary ? (
            <p className="text-lg text-gray-700">{article.summary}</p>
          ) : null}
        </div>

        {article.main_image_url ? (
          <div className="relative w-full max-w-3xl aspect-[16/9] overflow-hidden rounded-lg bg-gray-100">
            <Image
              src={article.main_image_url}
              alt={article.main_image_alt || article.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1100px"
              className="object-cover"
            />
          </div>
        ) : null}

        <article className="prose prose-lg max-w-3xl text-gray-900">
          <div className="whitespace-pre-line leading-relaxed">
            {article.content}
          </div>
        </article>

        <section className="pt-8 max-w-3xl">
          <ArticleComments articleId={article.id} articleSlug={article.slug} />
        </section>
      </div>
    </main>
  );
}

