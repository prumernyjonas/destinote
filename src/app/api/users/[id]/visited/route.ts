import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * GET /api/users/[id]/visited
 * Veřejný seznam navštívených zemí daného uživatele (pro zobrazení na cizím profilu).
 * Nepožaduje přihlášení.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    if (!userId) {
      return NextResponse.json(
        { error: "Chybí id uživatele" },
        { status: 400 }
      );
    }

    const admin = createAdminSupabaseClient();

    // Ověřit, že uživatel existuje a není smazaný
    const { data: user, error: userErr } = await admin
      .from("users")
      .select("id")
      .eq("id", userId)
      .is("deleted_at", null)
      .maybeSingle();

    if (userErr || !user) {
      return NextResponse.json(
        { error: "Uživatel nenalezen" },
        { status: 404 }
      );
    }

    const { data, error } = await admin
      .from("user_visited_countries")
      .select("country_id, countries ( id, iso_code, name )")
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
