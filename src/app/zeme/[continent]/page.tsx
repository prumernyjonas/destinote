import type { Metadata } from "next";
import Link from "next/link";
import RegionGuide from "@/components/guides/RegionGuide";
import FlightsWidget from "@/components/flights/FlightsWidget";
import ArticlesTeaser from "@/components/articles/ArticlesTeaser";

function continentLabelFromSlug(slug: string): string {
  const s = slug.toLowerCase();
  if (s === "asie") return "Asie";
  if (s === "evropa") return "Evropa";
  if (s === "afrika") return "Afrika";
  if (s === "australie") return "Austrálie & Oceánie";
  if (s === "severni-amerika") return "Severní Amerika";
  if (s === "jizni-amerika") return "Jižní Amerika";
  if (s === "antarktida") return "Antarktida";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ continent: string }>;
}): Promise<Metadata> {
  const { continent } = await params;
  const continentLabel = continentLabelFromSlug(continent);
  const title = `${continentLabel} – průvodce zeměmi | Destinote`;
  const description = `Prozkoumejte země regionu ${continentLabel}. Inspirace, tipy a přehled na jednom místě.`;
  return {
    title,
    description,
    alternates: {
      canonical: `/zeme/${continent}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "cs_CZ",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ContinentPage({
  params,
}: {
  params: Promise<{ continent: string }>;
}) {
  const { continent } = await params;
  const continentLabel = continentLabelFromSlug(continent);
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-gray-600 mb-4">
        <Link href="/zeme" className="hover:text-green-600 font-medium">
          Země
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-semibold">{continentLabel}</span>
      </nav>
      <h1 className="text-3xl font-bold text-gray-900">{continentLabel}</h1>
      <p className="text-gray-600 mt-2">
        Výběr zemí pro kontinent. Obsah bude doplněn.
      </p>
      <div className="mt-8">
        <RegionGuide regionName={continentLabel} />
      </div>
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ArticlesTeaser title="Tipy a články z regionu" href="/community" />
        </div>
        <div>
          <FlightsWidget query={continentLabel} />
        </div>
      </div>
    </main>
  );
}
