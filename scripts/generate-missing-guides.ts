import { config } from "dotenv";
import { resolve } from "path";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import * as isoCountries from "i18n-iso-countries";
import csLocale from "i18n-iso-countries/langs/cs.json";

// Načíst .env.local soubor
config({ path: resolve(process.cwd(), ".env.local") });

isoCountries.registerLocale(csLocale);

type CountryRow = {
  id: string;
  iso_code: string | null;
  name: string | null;
  continent: string | null;
  name_cs: string | null;
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
const DELAY_MS = 240; // Zpoždění mezi požadavky na OpenAI (rate limiting)

function computeNameCs(iso2: string) {
  return isoCountries.getName(iso2.toUpperCase(), "cs") || null;
}

async function fetchCountries(): Promise<CountryRow[]> {
  const { data, error } = await supabase
    .from("countries")
    .select("id, iso_code, name, continent, name_cs");
  if (error) throw error;
  return data as CountryRow[];
}

async function hasGuide(isoCode: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("ai_guides")
    .select("id")
    .eq("scope", "country")
    .eq("key", isoCode.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

async function saveGuide(isoCode: string, content: unknown) {
  const payload = {
    scope: "country",
    key: isoCode.toUpperCase(),
    content,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("ai_guides")
    .upsert(payload, { onConflict: "scope,key" });
  if (error) throw error;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    return false;
  }

  // Zkontrolovat, jestli už guide existuje
  let exists = false;
  try {
    exists = await hasGuide(iso);
  } catch (err) {
    console.error(
      `ERROR  | Kontrola guide pro ${iso}: ${(err as Error).message}`
    );
    return false;
  }

  if (exists) {
    console.log(`SKIP   | ${iso} - guide už existuje`);
    return false;
  }

  const nameCs = country.name_cs || computeNameCs(iso) || country.name || iso;
  const continent = country.continent || "Unknown";

  // Vygenerovat guide
  let guide: unknown;
  try {
    console.log(`GEN    | ${iso} (${nameCs}) - generování...`);
    guide = await generateGuide({
      iso_code: iso,
      name_cs: nameCs,
      continent,
    });
  } catch (err) {
    console.error(`ERROR  | OpenAI ${iso}: ${(err as Error).message}`);
    return false;
  }

  // Uložit guide
  try {
    await saveGuide(iso, guide);
    console.log(`✓      | ${iso} (${nameCs}) - uloženo`);
    return true;
  } catch (err) {
    console.error(`ERROR  | Uložení ${iso}: ${(err as Error).message}`);
    return false;
  }
}

async function main() {
  console.log("🔍 Hledání zemí bez AI guide...\n");

  let countries: CountryRow[] = [];
  try {
    countries = await fetchCountries();
    console.log(`📊 Načteno ${countries.length} zemí z databáze\n`);
  } catch (err) {
    console.error(`ERROR  | Načtení zemí: ${(err as Error).message}`);
    process.exit(1);
  }

  // Filtrovat země bez guide
  const countriesWithoutGuide: CountryRow[] = [];
  for (const country of countries) {
    const iso = country.iso_code?.trim().toUpperCase();
    if (!iso) continue;

    try {
      const has = await hasGuide(iso);
      if (!has) {
        countriesWithoutGuide.push(country);
      }
    } catch (err) {
      console.error(
        `ERROR  | Kontrola ${iso}: ${(err as Error).message}`
      );
    }
  }

  console.log(
    `📝 Nalezeno ${countriesWithoutGuide.length} zemí bez guide (z ${countries.length} celkem)\n`
  );

  if (countriesWithoutGuide.length === 0) {
    console.log("✅ Všechny země už mají guide!");
    return;
  }

  console.log("🚀 Začínám generování guides...\n");

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < countriesWithoutGuide.length; i++) {
    const country = countriesWithoutGuide[i];
    const result = await processCountry(country);
    if (result) {
      successCount++;
    } else {
      errorCount++;
    }
    // Zpoždění mezi požadavky (kromě posledního)
    if (i < countriesWithoutGuide.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`✅ Hotovo!`);
  console.log(`   Úspěšně vygenerováno: ${successCount}`);
  console.log(`   Chyby: ${errorCount}`);
  console.log(`   Celkem zpracováno: ${countriesWithoutGuide.length}`);
}

main().catch((err) => {
  console.error(`ERROR  | Neošetřená chyba: ${(err as Error).message}`);
  process.exit(1);
});
