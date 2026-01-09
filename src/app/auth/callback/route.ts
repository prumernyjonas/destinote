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
  const protocol =
    req.headers.get("x-forwarded-proto") ||
    (req.headers.get("x-forwarded-ssl") === "on" ? "https" : "http");

  if (host) {
    // Pokud je to localhost, použij http, jinak https
    const isLocalhost =
      host.includes("localhost") || host.includes("127.0.0.1");
    return isLocalhost ? `http://${host}` : `${protocol}://${host}`;
  }

  // Fallback: použij origin z req.url (vždy obsahuje správnou doménu)
  try {
    const url = new URL(req.url);
    return url.origin;
  } catch {
    // Poslední fallback
    return "http://localhost:3000";
  }
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
        const admin = createAdminSupabaseClient();
        const userMetadata = data?.session?.user?.user_metadata || {};
        const nickname = userMetadata.nickname;

        // Zkontrolovat, zda už existuje záznam v users tabulce
        const { data: existingUser } = await admin
          .from("users")
          .select("nickname")
          .eq("id", userId)
          .maybeSingle();

        // Pokud záznam neexistuje a máme nickname, vytvoříme ho
        if (!existingUser && nickname) {
          try {
            await admin.from("users").insert({
              id: userId,
              nickname: nickname,
              role: "user",
            });
          } catch (e) {
            console.error(
              "Chyba při vytváření záznamu uživatele v callback:",
              e
            );
          }
        }

        // Načíst nickname z DB (buď existující nebo nově vytvořený)
        const { data: userData } = await admin
          .from("users")
          .select("nickname")
          .eq("id", userId)
          .single();

        // Slugifikovat nickname pro URL (bez diakritiky, malá písmena)
        const slug = userData?.nickname
          ? slugifyNickname(userData.nickname)
          : userId;
        return NextResponse.redirect(new URL(`/profil/${slug}`, baseUrl));
      }
    }
    return NextResponse.redirect(new URL("/", baseUrl));
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent(
          err?.message || "OAuth chyba"
        )}`,
        baseUrl
      )
    );
  }
}
