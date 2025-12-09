// src/lib/ai/generateGuides.ts
// Server-side util pro generování průvodců přes AI s bezpečným fallbackem.
import { getStoredGuide, saveStoredGuide } from "./guideStore";

type CountryGuide = {
  overview: string;
  topTips: string[];
  bestTimeToVisit: string;
  safety: string;
  gettingAround: string;
};

type RegionGuide = {
  overview: string;
  highlights: string[];
  bestSeasons: string;
  safety: string;
};

const OPENAI_API_URL =
  process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";

function normalizeModelId(raw: string | undefined): string {
  const base = (raw || "gpt-4o-mini").trim().toLowerCase().replace(/\s+/g, "-");
  // Pár běžných synonym/variant
  if (base === "gpt-4o" || base === "gpt-4o-mini") return base;
  if (base === "gpt4o") return "gpt-4o";
  if (base === "gpt4o-mini" || base === "gpt-4o-mini") return "gpt-4o-mini";
  return base;
}

const OPENAI_MODEL = normalizeModelId(process.env.OPENAI_MODEL);
const PERSIST_FALLBACK =
  (process.env.AI_PERSIST_FALLBACK || "").toString() === "1";

export async function generateCountryGuide(input: {
  name: string;
  iso2?: string;
  continent: string;
}): Promise<CountryGuide> {
  // Jednorázové uložení: nejdřív zkusit najít uložený výsledek
  const storeKey = `${
    (input.iso2 || input.name).toUpperCase?.() || input.name.toLowerCase()
  }::${input.continent}`;
  const stored = await getStoredGuide<CountryGuide>("country", storeKey);
  if (stored && stored.overview) return stored;

  const apiKey = process.env.OPENAI_API_KEY;
  const prompt = [
    {
      role: "system",
      content:
        "Jsi český cestovatelský průvodce. Odpovídej věcně, stručně a přehledně v češtině. Výstup musí být validní JSON dle schématu.",
    },
    {
      role: "user",
      content: `Vytvoř stručný cestovatelský průvodce pro zemi:
Název: ${input.name}
Kontinent: ${input.continent}
ISO2: ${input.iso2 || "neznámé"}

Vrať JSON ve tvaru:
{
  "overview": "1-2 věty shrnutí",
  "topTips": ["krátký tip 1", "tip 2", "tip 3", "tip 4", "tip 5"],
  "bestTimeToVisit": "1 věta",
  "safety": "1 věta",
  "gettingAround": "1 věta"
}
Bez úvodního textu, pouze JSON.`,
    },
  ];

  if (!apiKey) {
    // Fallback bez AI
    const fallback: CountryGuide = {
      overview: `${input.name} je země v regionu ${input.continent}. Brzy doplníme detailní průvodce.`,
      topTips: [
        "Zkontrolujte vízové podmínky a platnost pasu",
        "Zvažte cestovní pojištění",
        "Prostudujte místní zvyklosti a bezpečnostní doporučení",
        "Sledujte sezónu a počasí",
        "Stažení offline map se hodí",
      ],
      bestTimeToVisit: "Obvykle mimo sezónní extrémy; ověřte lokální klima.",
      safety:
        "Dodržujte základní bezpečnostní zásady a sledujte oficiální doporučení.",
      gettingAround:
        "Místní doprava nebo půjčení auta; ověřte kvalitu silnic a spojů.",
    };
    await saveStoredGuide("country", storeKey, fallback);
    return fallback;
  }

  try {
    // debug log
    // eslint-disable-next-line no-console
    console.log("[AI] generateCountryGuide start", {
      model: OPENAI_MODEL,
      storeKey,
    });
    const res = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: prompt,
        temperature: 0.5,
      }),
      // AI volání běží na serveru
      cache: "no-store",
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      // eslint-disable-next-line no-console
      console.warn("[AI] OpenAI country response not ok", res.status, txt);
      throw new Error(`OpenAI status ${res.status}`);
    }
    const data = await res.json();
    const content: string =
      data?.choices?.[0]?.message?.content?.trim?.() || "{}";
    const parsed = JSON.parse(content);
    // Minimální validace klíčů
    const result: CountryGuide = {
      overview: String(parsed.overview || ""),
      topTips: Array.isArray(parsed.topTips) ? parsed.topTips.slice(0, 5) : [],
      bestTimeToVisit: String(parsed.bestTimeToVisit || ""),
      safety: String(parsed.safety || ""),
      gettingAround: String(parsed.gettingAround || ""),
    };
    await saveStoredGuide("country", storeKey, result);
    return result;
  } catch {
    // Fallback při chybě sítě/parsování
    // eslint-disable-next-line no-console
    console.warn("[AI] generateCountryGuide fallback used");
    const fallback: CountryGuide = {
      overview: `${input.name} je země v regionu ${input.continent}. Brzy doplníme detailní průvodce.`,
      topTips: [
        "Zkontrolujte vízové podmínky a platnost pasu",
        "Zvažte cestovní pojištění",
        "Prostudujte místní zvyklosti a bezpečnostní doporučení",
        "Sledujte sezónu a počasí",
        "Stažení offline map se hodí",
      ],
      bestTimeToVisit: "Obvykle mimo sezónní extrémy; ověřte lokální klima.",
      safety:
        "Dodržujte základní bezpečnostní zásady a sledujte oficiální doporučení.",
      gettingAround:
        "Místní doprava nebo půjčení auta; ověřte kvalitu silnic a spojů.",
    };
    if (PERSIST_FALLBACK) {
      await saveStoredGuide("country", storeKey, fallback);
    }
    return fallback;
  }
}

export async function generateRegionGuide(input: {
  name: string; // např. "Afrika"
}): Promise<RegionGuide> {
  const storeKey = input.name;
  const stored = await getStoredGuide<RegionGuide>("region", storeKey);
  if (stored && stored.overview) return stored;

  const apiKey = process.env.OPENAI_API_KEY;
  const prompt = [
    {
      role: "system",
      content:
        "Jsi český cestovatelský průvodce. Odpovídej věcně, stručně a přehledně v češtině. Výstup musí být validní JSON dle schématu.",
    },
    {
      role: "user",
      content: `Vytvoř stručný regionální přehled:
Region: ${input.name}

Vrať JSON ve tvaru:
{
  "overview": "1-2 věty shrnutí regionu",
  "highlights": ["krátký highlight 1", "2", "3", "4", "5"],
  "bestSeasons": "1 věta",
  "safety": "1 věta"
}
Bez úvodního textu, pouze JSON.`,
    },
  ];

  if (!apiKey) {
    const fallback: RegionGuide = {
      overview: `${input.name} je rozmanitý region se spoustou možností cestování.`,
      highlights: [
        "Pestrá příroda",
        "Kulturní zážitky",
        "Místní kuchyně",
        "Historické památky",
        "Dobrodružství v přírodě",
      ],
      bestSeasons:
        "Doporučené období se liší podle části regionu; sledujte lokální klima.",
      safety:
        "Sledujte oficiální doporučení a plánujte s ohledem na místní situaci.",
    };
    await saveStoredGuide("region", storeKey, fallback);
    return fallback;
  }

  try {
    // eslint-disable-next-line no-console
    console.log("[AI] generateRegionGuide start", {
      model: OPENAI_MODEL,
      storeKey,
    });
    const res = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: prompt,
        temperature: 0.5,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      // eslint-disable-next-line no-console
      console.warn("[AI] OpenAI region response not ok", res.status, txt);
      throw new Error(`OpenAI status ${res.status}`);
    }
    const data = await res.json();
    const content: string =
      data?.choices?.[0]?.message?.content?.trim?.() || "{}";
    const parsed = JSON.parse(content);
    const result: RegionGuide = {
      overview: String(parsed.overview || ""),
      highlights: Array.isArray(parsed.highlights)
        ? parsed.highlights.slice(0, 5)
        : [],
      bestSeasons: String(parsed.bestSeasons || ""),
      safety: String(parsed.safety || ""),
    };
    await saveStoredGuide("region", storeKey, result);
    return result;
  } catch {
    // eslint-disable-next-line no-console
    console.warn("[AI] generateRegionGuide fallback used");
    const fallback: RegionGuide = {
      overview: `${input.name} je rozmanitý region se spoustou možností cestování.`,
      highlights: [
        "Pestrá příroda",
        "Kulturní zážitky",
        "Místní kuchyně",
        "Historické památky",
        "Dobrodružství v přírodě",
      ],
      bestSeasons:
        "Doporučené období se liší podle části regionu; sledujte lokální klima.",
      safety:
        "Sledujte oficiální doporučení a plánujte s ohledem na místní situaci.",
    };
    if (PERSIST_FALLBACK) {
      await saveStoredGuide("region", storeKey, fallback);
    }
    return fallback;
  }
}

export type { CountryGuide, RegionGuide };
