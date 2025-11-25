/* Seed 'countries' table from public/countries.json
 *
 * Requirements:
 * - Environment vars:
 *   - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY (service role key)
 *
 * Run:
 *   npm run seed:countries
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function getEnv(name, fallback) {
  return process.env[name] || fallback;
}

async function main() {
  const supabaseUrl =
    getEnv("SUPABASE_URL") || getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    console.error(
      "Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const filePath = path.resolve(
    __dirname,
    "../public/countries.json"
  );
  if (!fs.existsSync(filePath)) {
    console.error("countries.json not found at", filePath);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const features = Array.isArray(raw?.features) ? raw.features : [];
  const normMap = { FX: "FR", UK: "GB", EL: "GR" };
  const seen = new Set();
  const rows = [];
  for (const f of features) {
    const p = (f && f.properties) || {};
    let iso2 = (p.ISO_A2 || "").toString().toUpperCase();
    if (!iso2 || iso2 === "-99") continue;
    iso2 = normMap[iso2] || iso2;
    if (!/^[A-Z]{2}$/.test(iso2)) continue;
    if (seen.has(iso2)) continue;
    const name =
      p.ADMIN ||
      p.NAME_LONG ||
      p.NAME ||
      p.BRK_NAME ||
      p.FORMAL_EN ||
      iso2;
    const continent = p.CONTINENT || p.REGION_UN || null;
    rows.push({
      iso_code: iso2,
      name: String(name),
      continent: continent ? String(continent) : null,
    });
    seen.add(iso2);
  }
  // Upsert in chunks
  const chunkSize = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error, count } = await supabase
      .from("countries")
      .upsert(chunk, { onConflict: "iso_code", ignoreDuplicates: false })
      .select("*", { count: "exact", head: true });
    if (error) {
      console.error("Upsert error:", error.message);
      process.exit(1);
    }
    inserted += chunk.length;
    console.log(`Upserted ${Math.min(inserted, rows.length)}/${rows.length}`);
  }
  console.log("Done. Total countries processed:", rows.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


