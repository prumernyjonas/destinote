import { NextRequest } from "next/server";

/**
 * Debug endpoint pro kontrolu environment proměnných (bez zobrazení citlivých hodnot)
 * Pouze pro produkční prostředí - zobrazí, které proměnné jsou nastavené
 */
export async function GET(req: NextRequest) {
  // Seznam všech environment proměnných, které aplikace potřebuje
  const requiredEnvVars = {
    // Supabase (public)
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? "✅ Nastaveno"
      : "❌ Chybí",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? "✅ Nastaveno"
      : "❌ Chybí",
    // Supabase (server-only)
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? "✅ Nastaveno"
      : "❌ Chybí",
    // MapTiler
    NEXT_PUBLIC_MAPTILER_KEY: process.env.NEXT_PUBLIC_MAPTILER_KEY
      ? `✅ Nastaveno (délka: ${process.env.NEXT_PUBLIC_MAPTILER_KEY.trim().length})`
      : "❌ Chybí",
    // Travelpayouts
    TRAVELPAYOUTS_TOKEN: process.env.TRAVELPAYOUTS_TOKEN
      ? "✅ Nastaveno"
      : "❌ Chybí",
    TRAVELPAYOUTS_MARKER: process.env.TRAVELPAYOUTS_MARKER
      ? "✅ Nastaveno"
      : "❌ Chybí",
    TRAVELPAYOUTS_CURRENCY: process.env.TRAVELPAYOUTS_CURRENCY || "czk",
    TRAVELPAYOUTS_LOCALE: process.env.TRAVELPAYOUTS_LOCALE || "cs",
    // Kiwi
    KIWI_AFFILID: process.env.KIWI_AFFILID ? "✅ Nastaveno" : "❌ Chybí",
    KIWI_CURRENCY: process.env.KIWI_CURRENCY || "czk",
    KIWI_LOCALE: process.env.KIWI_LOCALE || "cs",
    // OpenAI (pokud se používá)
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "✅ Nastaveno" : "❌ Chybí",
  };

  // Kontrola MapTiler klíče - zkontroluj, jestli nemá whitespace na konci
  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  const maptilerIssues: string[] = [];
  if (maptilerKey) {
    if (maptilerKey !== maptilerKey.trim()) {
      maptilerIssues.push(
        "⚠️ Klíč obsahuje whitespace na začátku nebo konci!"
      );
    }
    if (maptilerKey.includes("\t")) {
      maptilerIssues.push("⚠️ Klíč obsahuje tabulátor!");
    }
    if (maptilerKey.includes("\n")) {
      maptilerIssues.push("⚠️ Klíč obsahuje nový řádek!");
    }
  }

  return new Response(
    JSON.stringify(
      {
        status: "ok",
        environment: process.env.NODE_ENV || "development",
        envVars: requiredEnvVars,
        maptilerIssues: maptilerIssues.length > 0 ? maptilerIssues : null,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    ),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    }
  );
}

