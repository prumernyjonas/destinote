import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import countries from "i18n-iso-countries";
import cs from "i18n-iso-countries/langs/cs.json";

// Registrace českého locale
try {
  countries.registerLocale(cs as any);
} catch {}

/**
 * API endpoint pro načtení seznamu všech zemí
 * GET /api/countries/list
 */
export async function GET(req: NextRequest) {
  try {
    const admin = createAdminSupabaseClient();

    // Načíst všechny země z databáze
    const { data: countriesData, error } = await admin
      .from("countries")
      .select("id, name, name_cs, iso_code")
      .order("name_cs", { ascending: true });

    if (error) {
      console.error("Chyba při načítání zemí:", error);
      return NextResponse.json(
        { error: "Chyba při načítání zemí" },
        { status: 500 }
      );
    }

    // Mapovat země s českými názvy
    const mappedCountries = (countriesData || []).map((c: any) => {
      // Použij český název pokud existuje, jinak zkus získat z knihovny, jinak anglický
      let countryName = c.name_cs;
      if (!countryName && c.iso_code) {
        countryName = countries.getName(c.iso_code, "cs") || c.name;
      }
      if (!countryName) {
        countryName = c.name;
      }

      return {
        id: c.id,
        name: countryName,
        iso_code: c.iso_code,
      };
    });

    // Seřadit podle českého názvu
    mappedCountries.sort((a, b) => a.name.localeCompare(b.name, "cs"));

    return NextResponse.json({
      ok: true,
      data: mappedCountries,
    });
  } catch (err: any) {
    console.error("Chyba při načítání zemí:", err);
    return NextResponse.json(
      { error: err?.message || "Neznámá chyba" },
      { status: 500 }
    );
  }
}
