import "dotenv/config";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import slugify from "slugify";
import * as isoCountries from "i18n-iso-countries";
import csLocale from "i18n-iso-countries/langs/cs.json";

isoCountries.registerLocale(csLocale);

type CountryRow = {
  id: string;
  iso_code: string | null;
  name: string | null;
  continent: string | null;
  name_cs: string | null;
  slug: string | null;
  continent_slug: string | null;
  flag_emoji: string | null;
};

type AiGuideRow = {
  id: string;
  scope: string;
  key: string;
};

const REQUIRED_ENV = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
] as const;

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`Chybí environment proměnná: ${key}`);
    process.exit(1);
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const force = process.argv.includes("--force");
const DELAY_MS = 240;

const CONTINENT_SLUGS: Record<string, string> = {
  Africa: "afrika",
  Europe: "evropa",
  Asia: "asie",
  "North America": "severni-amerika",
  "South America": "jizni-amerika",
  Oceania: "oceanie",
  Antarctica: "antarktida",
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toFlagEmoji(iso2: string) {
  const code = iso2.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "";
  const points = [...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...points);
}

function computeNameCs(iso2: string) {
  return isoCountries.getName(iso2.toUpperCase(), "cs") || null;
}

function computeSlug(value: string | null) {
  if (!value) return null;
  return slugify(value, { lower: true, strict: true, locale: "cs" });
}

async function fetchCountries(): Promise<CountryRow[]> {
  const { data, error } = await supabase.from("countries").select("*");
  if (error) throw error;
  return data as CountryRow[];
}

async function upsertCountryMeta(
  country: CountryRow,
  updates: Partial<CountryRow>
) {
  if (Object.keys(updates).length === 0) return;
  const { error } = await supabase
    .from("countries")
    .update(updates)
    .eq("id", country.id);
  if (error) {
    throw error;
  }
}

async function fetchGuide(
  scope: string,
  key: string
): Promise<AiGuideRow | null> {
  const { data, error } = await supabase
    .from("ai_guides")
    .select("id, scope, key")
    .eq("scope", scope)
    .eq("key", key)
    .maybeSingle();
  if (error) throw error;
  return data as AiGuideRow | null;
}

async function saveGuide(scope: string, key: string, content: unknown) {
  const payload = {
    scope,
    key,
    content,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("ai_guides")
    .upsert(payload, { onConflict: "scope,key" });
  if (error) throw error;
}

async function generateGuide(
  country: Required<Pick<CountryRow, "iso_code" | "name_cs" | "continent">>
) {
  const { iso_code, name_cs, continent } = country;
  const prompt = [
    "Vrať POUZE platný JSON dle zadané struktury (žádný text navíc).",
    `Země: ${name_cs} (${iso_code})`,
    `Kontinent: ${continent}`,
    "Jazyk: čeština.",
    "Struktura:",
    `{
  "intro": "3–5 vět",
  "sections": [
    { "id": "safety", "title": "Na co si dát pozor", "text": "4–7 vět" },
    { "id": "culture", "title": "Kultura a zvyky", "text": "4–7 vět" },
    { "id": "money", "title": "Peníze a placení", "text": "4–7 vět" },
    { "id": "transport", "title": "Doprava a přesuny", "text": "4–7 vět" },
    { "id": "health", "title": "Zdraví a počasí", "text": "4–7 vět" }
  ]
}`,
  ].join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Jsi travel writer. Odpovídej pouze validním JSON objektem.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Prázdná odpověď od OpenAI");
  }

  try {
    return JSON.parse(content);
  } catch (err) {
    throw new Error(`Neplatný JSON od OpenAI: ${(err as Error).message}`);
  }
}

async function processCountry(country: CountryRow) {
  const iso = country.iso_code?.trim().toUpperCase();
  if (!iso) {
    console.error(`ERROR  | Chybí ISO kód pro zemi id=${country.id}`);
    return;
  }

  const computedNameCs = country.name_cs || computeNameCs(iso);
  const computedSlug =
    country.slug || computeSlug(computedNameCs || country.name || iso);
  const computedContinentSlug =
    country.continent_slug ||
    (country.continent ? CONTINENT_SLUGS[country.continent] : undefined) ||
    computeSlug(country.continent || "");
  const computedFlag = country.flag_emoji || toFlagEmoji(iso);

  const updates: Partial<CountryRow> = {};
  if (!country.name_cs && computedNameCs) updates.name_cs = computedNameCs;
  if (!country.slug && computedSlug) updates.slug = computedSlug;
  if (!country.continent_slug && computedContinentSlug)
    updates.continent_slug = computedContinentSlug;
  if (!country.flag_emoji && computedFlag) updates.flag_emoji = computedFlag;

  if (Object.keys(updates).length > 0) {
    try {
      await upsertCountryMeta(country, updates);
      console.log(
        `INFO   | Aktualizováno meta pro ${iso}: ${JSON.stringify(updates)}`
      );
    } catch (err) {
      console.error(
        `ERROR  | Update countries ${iso}: ${(err as Error).message}`
      );
      return;
    }
  }

  let existing: AiGuideRow | null = null;
  try {
    existing = await fetchGuide("country", iso);
  } catch (err) {
    console.error(`ERROR  | Čtení ai_guides ${iso}: ${(err as Error).message}`);
    return;
  }

  if (existing && !force) {
    console.log(`SKIP   | ${iso} už existuje`);
    return;
  }

  let guide: unknown;
  try {
    guide = await generateGuide({
      iso_code: iso,
      name_cs: computedNameCs || country.name || iso,
      continent: country.continent || "Unknown",
    });
  } catch (err) {
    console.error(`ERROR  | OpenAI ${iso}: ${(err as Error).message}`);
    return;
  }

  try {
    await saveGuide("country", iso, guide);
    console.log(`GEN    | ${iso}`);
  } catch (err) {
    console.error(`ERROR  | Uložení ${iso}: ${(err as Error).message}`);
  }
}

async function main() {
  console.log(`Start | force=${force ? "true" : "false"}`);
  let countries: CountryRow[] = [];
  try {
    countries = await fetchCountries();
  } catch (err) {
    console.error(`ERROR  | Načtení zemí: ${(err as Error).message}`);
    process.exit(1);
  }

  for (const country of countries) {
    await processCountry(country);
    await sleep(DELAY_MS);
  }

  console.log("Done");
}

main().catch((err) => {
  console.error(`ERROR  | Neošetřená chyba: ${(err as Error).message}`);
  process.exit(1);
});
