import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    console.log("[visited/country] ===== START =====");
    
    // Zkusit získat userId z různých zdrojů (stejně jako /api/visited)
    const userIdFromHeader = req.headers.get("x-user-id");
    console.log("[visited/country] userId from header:", userIdFromHeader);
    
    const supabase = await createServerSupabaseClient();
    console.log("[visited/country] Supabase client created");
    
    const { data: auth, error: authError } = await supabase.auth.getUser();
    console.log("[visited/country] Auth result:", {
      hasUser: !!auth?.user,
      userId: auth?.user?.id,
      error: authError?.message,
    });
    
    const sessionUserId = auth?.user?.id;
    
    // Preferovat header před session (stejně jako /api/visited)
    const userId = userIdFromHeader || sessionUserId;
    
    if (!userId) {
      console.log("[visited/country] No userId from any source, returning Unauthorized");
      return NextResponse.json(
        { success: false, error: "Unauthorized - no session" },
        { status: 401 }
      );
    }
    
    console.log("[visited/country] Using userId:", userId);

    const body = await req.json().catch((e) => {
      console.log("[visited/country] Error parsing body:", e);
      return {};
    });
    const { countryId } = body as { countryId?: string };
    console.log("[visited/country] CountryId from body:", countryId);

    if (!countryId) {
      console.log("[visited/country] Missing countryId");
      return NextResponse.json(
        { success: false, error: "Missing countryId" },
        { status: 400 }
      );
    }

    const admin = createAdminSupabaseClient();

    // Použít upsert místo insert, aby se zabránilo duplicitám
    // Stejně jako v /api/visited/route.ts
    console.log("[visited/country] Upserting visit record...");
    const { error, data } = await admin
      .from("user_visited_countries")
      .upsert(
        {
          user_id: userId,
          country_id: countryId,
          visited_at: new Date().toISOString(),
        },
        { onConflict: "user_id,country_id" }
      )
      .select()
      .maybeSingle();

    if (error) {
      console.error("[visited/country] Upsert error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Revalidovat stránky zemí pro aktualizaci statistik a stavu
    revalidatePath("/zeme", "layout");
    
    // Zkusit získat informace o zemi pro revalidaci konkrétní stránky
    try {
      const { data: countryData } = await admin
        .from("countries")
        .select("slug, continent_slug")
        .eq("id", countryId)
        .maybeSingle();
      
      if (countryData?.slug && countryData?.continent_slug) {
        // Revalidovat konkrétní stránku země
        const countryPath = `/zeme/${countryData.continent_slug}/${countryData.slug}`;
        revalidatePath(countryPath);
        console.log("[visited/country] Revalidated path:", countryPath);
      }
    } catch (revalidateError) {
      console.warn("[visited/country] Revalidation error (non-critical):", revalidateError);
    }

    console.log("[visited/country] ✓ Successfully upserted visit");
    return NextResponse.json({ success: true, visited: true });
  } catch (error) {
    console.error("[visited/country] Exception:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
