import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextRequest } from "next/server";

export type UserRole = "visitor" | "user" | "author" | "moderator" | "admin";

export async function getCurrentUserId(): Promise<string> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("UNAUTHORIZED");
  }
  return data.user.id;
}

/**
 * Získá userId výhradně z ověřené identity (session nebo Bearer token).
 * Query parametr a header x-user-id se NEPOUŽÍVAJÍ jako zdroj identity (ochrana před IDOR).
 */
export async function getUserIdFromRequest(
  req: NextRequest
): Promise<string | null> {
  // 1. Session (cookies)
  try {
    const supa = await createServerSupabaseClient();
    const { data: auth } = await supa.auth.getUser();
    if (auth.user?.id) return auth.user.id;
  } catch {}

  // 2. Bearer token (např. mobilní klient)
  const authHeader =
    req.headers.get("authorization") || req.headers.get("Authorization");
  const token =
    typeof authHeader === "string" &&
    authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : null;
  if (token) {
    try {
      const admin = createAdminSupabaseClient();
      const { data: tokenUser, error: tokenError } =
        await admin.auth.getUser(token);
      if (!tokenError && tokenUser?.user?.id) return tokenUser.user.id;
    } catch {}
  }

  return null;
}

export async function getUserRole(userId: string): Promise<UserRole> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    throw new Error("FAILED_TO_LOAD_ROLE");
  }
  return (data?.role as UserRole) ?? "user";
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin" || role === "moderator"; // moderátor může mít zvýšená práva
}
