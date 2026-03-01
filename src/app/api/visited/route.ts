import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getUserIdFromRequest } from "@/app/api/_utils/auth";
import { createErrorResponse } from "@/app/api/_utils/errors";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return createErrorResponse("Unauthorized", 401);
    }

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("user_visited_countries")
      .select("country_id, countries ( id, iso_code, name )")
      .eq("user_id", userId);
    if (error) {
      return createErrorResponse(error.message, 400);
    }
    const result: Array<{ iso2: string; name: string; id: string }> = [];
    for (const row of (data as any[]) || []) {
      const c = (row as any).countries;
      if (c?.iso_code) {
        result.push({
          iso2: c.iso_code,
          name: c.name ?? c.iso_code,
          id: c.id,
        });
      }
    }
    return NextResponse.json({ ok: true, data: result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return createErrorResponse(message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return createErrorResponse("Unauthorized", 401);
    }
    const url = new URL(req.url);
    const qpIso2 = url.searchParams.get("iso2");
    const payload = (await req.json().catch(() => ({}))) as { iso2?: string };
    const iso2 = ((qpIso2 || payload.iso2 || "") as string).toUpperCase();
    if (!iso2 || iso2.length !== 2) {
      return createErrorResponse("Invalid iso2", 400);
    }

    // Použijeme admin klienta kvůli možným RLS omezením při INSERT/SELECT
    const admin = createAdminSupabaseClient();

    let { data: country, error: countryErr } = await admin
      .from("countries")
      .select("id, iso_code, name")
      .eq("iso_code", iso2)
      .maybeSingle();
    if (countryErr) {
      return createErrorResponse(countryErr.message, 400);
    }
    if (!country?.id) {
      // Speciální fix: pokud FR/NO v tabulce chybí, vytvoř je on-the-fly
      if (iso2 === "FR" || iso2 === "NO") {
        const fallbackName = iso2 === "FR" ? "France" : "Norway";
        const continent = "Europe";
        const { data: inserted, error: insErr } = await admin
          .from("countries")
          .insert({ iso_code: iso2, name: fallbackName, continent })
          .select("id, iso_code, name")
          .maybeSingle();
        if (insErr && (insErr as any).code !== "23505") {
          return createErrorResponse(insErr.message, 400);
        }
        // Po případném konfliktu zkusíme znovu načíst
        const retry = await admin
          .from("countries")
          .select("id, iso_code, name")
          .eq("iso_code", iso2)
          .maybeSingle();
        country = retry.data || inserted || null;
      }
      if (!country?.id) {
        return createErrorResponse("Country not found", 404);
      }
    }

    const { error: upsertErr } = await admin
      .from("user_visited_countries")
      .upsert(
        {
          user_id: userId,
          country_id: country.id,
          visited_at: new Date().toISOString(),
        },
        { onConflict: "user_id,country_id" }
      );
    if (upsertErr) {
      return createErrorResponse(upsertErr.message, 400);
    }

    // Recalculate and upsert aggregate count for the user
    try {
      const { count } = await admin
        .from("user_visited_countries")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      await admin.from("user_country_counts").upsert(
        {
          user_id: userId,
          countries_count: typeof count === "number" ? count : 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[visited:POST] aggregate update failed", e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return createErrorResponse(message, 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return createErrorResponse("Unauthorized", 401);
    }
    const url = new URL(req.url);
    const iso2Param = url.searchParams.get("iso2");
    let iso2 = (iso2Param || "").toUpperCase();
    if (!iso2) {
      const payload = (await req.json().catch(() => ({}))) as {
        iso2?: string;
      };
      iso2 = (payload.iso2 || "").toUpperCase();
    }
    if (!iso2 || iso2.length !== 2) {
      return createErrorResponse("Invalid iso2", 400);
    }

    const admin = createAdminSupabaseClient();
    let { data: country, error: countryErr } = await admin
      .from("countries")
      .select("id")
      .eq("iso_code", iso2)
      .maybeSingle();
    if (countryErr) {
      return createErrorResponse(countryErr.message, 400);
    }
    if (!country?.id) {
      if (iso2 === "FR" || iso2 === "NO") {
        const fallbackName = iso2 === "FR" ? "France" : "Norway";
        const continent = "Europe";
        const { data: inserted, error: insErr } = await admin
          .from("countries")
          .insert({ iso_code: iso2, name: fallbackName, continent })
          .select("id")
          .maybeSingle();
        if (insErr && (insErr as any).code !== "23505") {
          return createErrorResponse(insErr.message, 400);
        }
        const retry = await admin
          .from("countries")
          .select("id")
          .eq("iso_code", iso2)
          .maybeSingle();
        country = retry.data || inserted || null;
      }
      if (!country?.id) {
        return createErrorResponse("Country not found", 404);
      }
    }

    const { error: delErr } = await admin
      .from("user_visited_countries")
      .delete()
      .eq("user_id", userId)
      .eq("country_id", country.id);
    if (delErr) {
      return createErrorResponse(delErr.message, 400);
    }

    // Recalculate and upsert aggregate count for the user
    try {
      const { count } = await admin
        .from("user_visited_countries")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      await admin.from("user_country_counts").upsert(
        {
          user_id: userId,
          countries_count: typeof count === "number" ? count : 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[visited:DELETE] aggregate update failed", e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return createErrorResponse(message, 500);
  }
}
