/* Vygeneruje CSV countries_export.csv (iso_code,name,continent) z public/countries.json
 *
 * Použití:
 *   npm run export:countries
 * Poté nahraj CSV v Supabase: Table editor → countries → Import → CSV.
 */
const fs = require("fs");
const path = require("path");

function main() {
  const src = path.resolve(__dirname, "../public/countries.json");
  const out = path.resolve(process.cwd(), "countries_export.csv");
  if (!fs.existsSync(src)) {
    console.error("Soubor public/countries.json nebyl nalezen:", src);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(src, "utf8"));
  const features = Array.isArray(raw?.features) ? raw.features : [];
  const normMap = { FX: "FR", UK: "GB", EL: "GR" }; // normalizace

  const rows = [["iso_code", "name", "continent"]];
  const used = new Set();
  for (const f of features) {
    const p = (f && f.properties) || {};
    let iso2 = (p.ISO_A2 || "").toString().toUpperCase();
    if (!iso2 || iso2 === "-99") continue;
    iso2 = normMap[iso2] || iso2;
    if (!/^[A-Z]{2}$/.test(iso2)) continue;
    if (used.has(iso2)) continue;
    const name =
      p.ADMIN ||
      p.NAME_LONG ||
      p.NAME ||
      p.BRK_NAME ||
      p.FORMAL_EN ||
      iso2;
    const continent = p.CONTINENT || p.REGION_UN || "";
    // CSV escaping
    const esc = (s) =>
      `"${String(s).replace(/"/g, '""')}"`;
    rows.push([iso2, name, continent].map(esc));
    used.add(iso2);
  }
  fs.writeFileSync(out, rows.map((r) => r.join(",")).join("\n") + "\n", "utf8");
  console.log("Vytvořeno:", out, `(${rows.length - 1} záznamů)`);
}

main();


