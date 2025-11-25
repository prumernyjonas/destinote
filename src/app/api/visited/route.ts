import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: auth } = await supabase.auth.getUser();
    const sessionUserId = auth?.user?.id;
    const url = new URL(req.url);
    const qpUserId = url.searchParams.get("userId") || undefined;
    const fallbackUserId =
      req.headers.get("x-user-id") || qpUserId || undefined;
    const userId = sessionUserId || fallbackUserId;
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const qpIso2 = url.searchParams.get("iso2");
    const payload = (await req.json().catch(() => ({}))) as { iso2?: string };
    const iso2 = ((qpIso2 || payload.iso2 || "") as string).toUpperCase();
    if (!iso2 || iso2.length !== 2) {
      return NextResponse.json(
        { ok: false, error: "Invalid iso2" },
        { status: 400 }
      );
    }

    // Použijeme admin klienta kvůli možným RLS omezením při INSERT/SELECT
    const admin = createAdminSupabaseClient();

    let { data: country, error: countryErr } = await admin
      .from("countries")
      .select("id, iso_code, name")
      .eq("iso_code", iso2)
      .maybeSingle();
    if (countryErr) {
      return NextResponse.json(
        { ok: false, error: countryErr.message },
        { status: 400 }
      );
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
          return NextResponse.json(
            { ok: false, error: insErr.message },
            { status: 400 }
          );
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
        return NextResponse.json(
          { ok: false, error: "Country not found" },
          { status: 404 }
        );
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
      return NextResponse.json(
        { ok: false, error: upsertErr.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: auth } = await supabase.auth.getUser();
    const sessionUserId = auth?.user?.id;
    const fallbackUserId = req.headers.get("x-user-id") || undefined;
    const userId = sessionUserId || fallbackUserId;
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
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
      return NextResponse.json(
        { ok: false, error: "Invalid iso2" },
        { status: 400 }
      );
    }

    const admin = createAdminSupabaseClient();
    let { data: country, error: countryErr } = await admin
      .from("countries")
      .select("id")
      .eq("iso_code", iso2)
      .maybeSingle();
    if (countryErr) {
      return NextResponse.json(
        { ok: false, error: countryErr.message },
        { status: 400 }
      );
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
          return NextResponse.json(
            { ok: false, error: insErr.message },
            { status: 400 }
          );
        }
        const retry = await admin
          .from("countries")
          .select("id")
          .eq("iso_code", iso2)
          .maybeSingle();
        country = retry.data || inserted || null;
      }
      if (!country?.id) {
        return NextResponse.json(
          { ok: false, error: "Country not found" },
          { status: 404 }
        );
      }
    }

    const { error: delErr } = await admin
      .from("user_visited_countries")
      .delete()
      .eq("user_id", userId)
      .eq("country_id", country.id);
    if (delErr) {
      return NextResponse.json(
        { ok: false, error: delErr.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
