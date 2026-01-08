import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

// Slugifikace - odstranění diakritiky a převod na malá písmena
function slugifyNickname(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // odstranit diakritiku
    .toLowerCase()
    .replace(/\s+/g, "-"); // mezery na pomlčky
}

/**
 * Získá správnou base URL pro redirecty
 * V produkci použije origin z requestu, v developmentu použije localhost
 */
function getBaseUrl(req: NextRequest): string {
  // Zkus získat origin z headers (funguje na Vercelu i jiných hostitelech)
  const host = req.headers.get("host");
  const protocol = req.headers.get("x-forwarded-proto") || "https";
  
  if (host) {
    // Pokud je to localhost, použij http, jinak https
    const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
    return isLocalhost ? `http://${host}` : `${protocol}://${host}`;
  }
  
  // Fallback na environment proměnnou nebo localhost
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : "http://localhost:3000";
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const baseUrl = getBaseUrl(req);

  try {
    if (code) {
      const supabase = await createServerSupabaseClient();
      const { error, data } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(
          new URL(
            `/auth/login?error=${encodeURIComponent(error.message)}`,
            baseUrl
          )
        );
      }
      // Přesměruj na profil uživatele
      const userId = data?.session?.user?.id;
      if (userId) {
        // Načíst nickname z DB pomocí admin clienta (obejde RLS)
        const admin = createAdminSupabaseClient();
        const { data: userData } = await admin
          .from("users")
          .select("nickname")
          .eq("id", userId)
          .single();
        // Slugifikovat nickname pro URL (bez diakritiky, malá písmena)
        const slug = userData?.nickname ? slugifyNickname(userData.nickname) : userId;
        return NextResponse.redirect(new URL(`/profil/${slug}`, baseUrl));
      }
    }
    return NextResponse.redirect(new URL("/", baseUrl));
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent(err?.message || "OAuth chyba")}`,
        baseUrl
      )
    );
  }
}


