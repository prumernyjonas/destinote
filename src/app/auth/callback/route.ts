import { NextResponse } from "next/server";
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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  try {
    if (code) {
      const supabase = await createServerSupabaseClient();
      const { error, data } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(
          new URL(
            `/auth/login?error=${encodeURIComponent(error.message)}`,
            req.url
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
        return NextResponse.redirect(new URL(`/profil/${slug}`, req.url));
      }
    }
    return NextResponse.redirect(new URL("/", req.url));
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent(err?.message || "OAuth chyba")}`,
        req.url
      )
    );
  }
}


