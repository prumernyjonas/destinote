import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getUserRole, isAdmin } from "@/app/api/_utils/auth";
import { NextRequest } from "next/server";

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    let userId: string | null = searchParams.get("userId") || null;

    // Fallback 1: Zkusíme získat userId z session
    if (!userId) {
      const supa = await createServerSupabaseClient();
      const { data: auth } = await supa.auth.getUser();
      userId = auth.user?.id ?? null;
    }

    // Fallback 2: Bearer token z Authorization headeru
    if (!userId) {
      const reqAny = _req as any;
      const authHeader =
        reqAny.headers?.get?.("authorization") ||
        reqAny.headers?.get?.("Authorization");
      const token =
        typeof authHeader === "string" &&
        authHeader.toLowerCase().startsWith("bearer ")
          ? authHeader.slice(7)
          : null;
      if (token) {
        const admin = createAdminSupabaseClient();
        const { data: tokenUser } = await admin.auth.getUser(token);
        if (tokenUser?.user?.id) {
          userId = tokenUser.user.id;
        }
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Použijeme admin klienta, který RLS obchází
    const role = await getUserRole(userId);
    return new Response(
      JSON.stringify({ role, isAdmin: isAdmin(role), userId }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message || "Internal error" }),
      { status: 500 }
    );
  }
}
