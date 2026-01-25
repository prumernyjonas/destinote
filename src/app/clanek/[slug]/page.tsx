import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import ArticleComments from "@/components/articles/ArticleComments";
import ArticlePhotoGallery from "@/components/articles/ArticlePhotoGallery";
import { slugifyNickname } from "@/utils/slugify";

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
  destination: string | null;
};

type ArticlePhoto = {
  id: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
};

type CountryInfo = {
  id: string;
  name: string;
  name_cs: string | null;
  iso_code: string | null;
  slug: string | null;
  continent_slug: string | null;
} | null;

type AuthorInfo = {
  id: string;
  nickname: string;
  avatar_url: string | null;
} | null;

export const revalidate = 0;

async function getArticle(slug: string): Promise<ArticleRecord | null> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("articles")
    .select(
      "id, slug, title, summary, content, author_id, status, published_at, created_at, main_image_url, main_image_alt, main_image_width, main_image_height, destination",
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

async function getCountryInfo(
  destinationName: string | null,
): Promise<CountryInfo> {
  if (!destinationName) return null;

  const admin = createAdminSupabaseClient();
  // Hledat zemi podle názvu (zkusit český název i anglický)
  const { data, error } = await admin
    .from("countries")
    .select("id, name, name_cs, iso_code, slug, continent_slug")
    .or(`name_cs.ilike.%${destinationName}%,name.ilike.%${destinationName}%`)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as CountryInfo;
}

async function getAuthorInfo(authorId: string): Promise<AuthorInfo> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("users")
    .select("id, nickname, avatar_url")
    .eq("id", authorId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as AuthorInfo;
}

async function getArticlePhotos(
  articleId: string,
  mainImageUrl: string | null,
): Promise<ArticlePhoto[]> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("article_photos")
    .select("id, url, alt, width, height")
    .eq("article_id", articleId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  // Pokud existuje hlavní obrázek, ujistíme se, že je první
  // Pokud hlavní obrázek není v article_photos, přidáme ho na začátek
  const photos = [...data];

  if (mainImageUrl) {
    const mainPhotoIndex = photos.findIndex((p) => p.url === mainImageUrl);
    if (mainPhotoIndex > 0) {
      // Přesunout hlavní fotku na začátek
      const mainPhoto = photos.splice(mainPhotoIndex, 1)[0];
      photos.unshift(mainPhoto);
    } else if (mainPhotoIndex === -1) {
      // Hlavní fotka není v article_photos, přidáme ji na začátek
      photos.unshift({
        id: `main-${articleId}`,
        url: mainImageUrl,
        alt: null,
        width: null,
        height: null,
      });
    }
  }

  return photos;
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

  const country = await getCountryInfo(article.destination);
  const author = await getAuthorInfo(article.author_id);
  const photos = await getArticlePhotos(article.id, article.main_image_url);
  const publishedLabel =
    formatDate(article.published_at) || formatDate(article.created_at);

  // Získat URL pro zemi
  const countryUrl =
    country?.slug && country?.continent_slug
      ? `/zeme/${country.continent_slug}/${country.slug}`
      : null;
  const countryName = country?.name_cs || country?.name || null;

  // Získat URL pro autora
  const authorUrl = author?.nickname
    ? `/profil/${slugifyNickname(author.nickname)}`
    : null;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Breadcrumbs */}
        <nav
          className="flex items-center gap-2 text-sm text-gray-500"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-gray-700 transition-colors">
            Domů
          </Link>
          <span className="text-gray-400">/</span>
          <Link
            href="/komunita"
            className="hover:text-gray-700 transition-colors"
          >
            Články
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-medium truncate max-w-md">
            {article.title}
          </span>
        </nav>

        {/* Nadpis a perex */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
            {article.title}
          </h1>
          {article.summary ? (
            <p className="text-xl text-gray-700 leading-relaxed max-w-3xl">
              {article.summary}
            </p>
          ) : null}
        </div>

        {/* Hlavní obsah - galerie fotek vlevo, text vpravo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Galerie fotek vlevo */}
          {photos.length > 0 ? (
            <ArticlePhotoGallery photos={photos} articleTitle={article.title} />
          ) : article.main_image_url ? (
            <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl bg-gray-100 shadow-lg">
              <Image
                src={article.main_image_url}
                alt={article.main_image_alt || article.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="hidden lg:block" />
          )}

          {/* Text vpravo */}
          <article className="prose prose-lg max-w-none text-gray-900">
            <div className="whitespace-pre-line leading-relaxed text-base sm:text-lg">
              {article.content}
            </div>
          </article>
        </div>

        {/* Metadata pod obrázkem */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6 pt-4 border-t border-gray-200">
          {author && (
            <div className="flex items-center gap-2">
              {author.avatar_url ? (
                <Image
                  src={author.avatar_url}
                  alt={author.nickname}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">
                    {author.nickname.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {authorUrl ? (
                <Link
                  href={authorUrl}
                  className="text-sm text-gray-900 hover:text-emerald-600 font-medium hover:underline transition-colors"
                >
                  {author.nickname}
                </Link>
              ) : (
                <span className="text-sm text-gray-900 font-medium">
                  {author.nickname}
                </span>
              )}
            </div>
          )}
          {publishedLabel && (
            <p className="text-sm text-gray-500 font-medium">
              Publikováno {publishedLabel}
            </p>
          )}
          {(countryName || article.destination) && (
            <div className="flex items-center gap-2">
              {country?.iso_code && (
                <span
                  className={`fi fi-${country.iso_code.toLowerCase()} text-xl`}
                />
              )}
              {countryUrl ? (
                <Link
                  href={countryUrl}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition-colors"
                >
                  {countryName || article.destination}
                </Link>
              ) : (
                <span className="text-sm text-gray-600 font-medium">
                  {countryName || article.destination}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Komentáře */}
        <section className="pt-8 border-t border-gray-200">
          <ArticleComments articleId={article.id} articleSlug={article.slug} />
        </section>
      </div>
    </main>
  );
}
