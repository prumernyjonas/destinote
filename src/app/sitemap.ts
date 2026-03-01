import type { MetadataRoute } from "next";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const STATIC_PATHS = [
  "",
  "/komunita",
  "/zebricek",
  "/hledat",
  "/letenky",
  "/napoveda",
  "/podminky",
  "/ochrana",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const links: MetadataRoute.Sitemap = [];

  // Statické stránky
  for (const path of STATIC_PATHS) {
    links.push({
      url: `${baseUrl}${path || "/"}`,
      lastModified: new Date(),
      changeFrequency: path === "" ? "daily" : "weekly",
      priority: path === "" ? 1 : 0.8,
    });
  }

  // Kontinenty (/zeme/[continent])
  const continents = ["evropa", "asie", "afrika", "severni-amerika", "jizni-amerika", "australie", "antarktida"];
  for (const c of continents) {
    links.push({
      url: `${baseUrl}/zeme/${c}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // Schválené články (veřejné)
  try {
    const admin = createAdminSupabaseClient();
    const { data: articles } = await admin
      .from("articles")
      .select("slug, updated_at, published_at")
      .eq("status", "approved")
      .is("deleted_at", null);
    for (const a of articles || []) {
      const lastMod = a.updated_at || a.published_at || new Date().toISOString();
      links.push({
        url: `${baseUrl}/clanek/${a.slug}`,
        lastModified: new Date(lastMod),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch {
    // Bez DB (např. build bez env) pouze statické URL
  }

  return links;
}
