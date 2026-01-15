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
            `/prihlaseni?error=${encodeURIComponent(error.message)}`,
            baseUrl
          )
        );
      }
      // Přesměruj na profil uživatele
      const userId = data?.session?.user?.id;
      if (userId) {
        const admin = createAdminSupabaseClient();
        const userMetadata = data?.session?.user?.user_metadata || {};
        const userEmail = data?.session?.user?.email || "";

        // Zajistit, že používáme nickname z metadata, ne z emailu
        // NIKDY nepoužívat email jako fallback pro nickname!
        const nickname = userMetadata.nickname?.trim() || null;

        // Debug logování
        if (!nickname) {
          console.error(
            "VAROVÁNÍ: Nickname není v user_metadata pro uživatele:",
            userId,
            "Email:",
            userEmail,
            "Metadata:",
            JSON.stringify(userMetadata, null, 2)
          );
        } else {
          console.log(
            "Nickname z metadata:",
            nickname,
            "pro uživatele:",
            userId
          );
        }

        // Zkontrolovat, zda už existuje záznam v users tabulce
        const { data: existingUser } = await admin
          .from("users")
          .select("nickname")
          .eq("id", userId)
          .maybeSingle();

        // Pokud záznam neexistuje a máme nickname z metadata, vytvoříme ho
        if (!existingUser) {
          if (nickname) {
            try {
              const insertResult = await admin
                .from("users")
                .insert({
                  id: userId,
                  nickname: nickname,
                  role: "user",
                })
                .select();

              console.log(
                "Vytvořen záznam uživatele s nicknamem:",
                nickname,
                "Výsledek:",
                insertResult
              );
            } catch (e) {
              console.error(
                "Chyba při vytváření záznamu uživatele v callback:",
                e
              );
            }
          } else {
            // Pokud nemáme nickname v metadata, zalogujme to pro debug
            console.error(
              "CHYBA: Nickname není v user_metadata pro uživatele:",
              userId,
              "Email:",
              userEmail,
              "Metadata:",
              JSON.stringify(userMetadata, null, 2)
            );
            // NIKDY nevytvářet nickname z emailu!
            // Místo vyhození chyby přesměrujeme na login stránku s chybovou zprávou
            return NextResponse.redirect(
              new URL(
                `/prihlaseni?error=${encodeURIComponent(
                  "Nickname není v user_metadata. Zkontrolujte, zda se metadata správně ukládají při registraci."
                )}`,
                baseUrl
              )
            );
          }
        } else {
          // Pokud už existuje záznam, zkontrolujme, zda má správný nickname
          const emailBasedNickname = userEmail.split("@")[0];

          // Pokud existující nickname vypadá jako email (např. "jonas.sury"), ale máme jiný v metadata, aktualizujme
          if (
            nickname &&
            existingUser.nickname !== nickname &&
            (existingUser.nickname === emailBasedNickname ||
              existingUser.nickname === userEmail.split("@")[0].toLowerCase())
          ) {
            console.log(
              "Aktualizuji nickname z",
              existingUser.nickname,
              "na",
              nickname,
              "pro uživatele:",
              userId
            );
            try {
              await admin
                .from("users")
                .update({ nickname: nickname })
                .eq("id", userId);
            } catch (e) {
              console.error("Chyba při aktualizaci nicknamu v callback:", e);
            }
          } else if (
            !nickname &&
            existingUser.nickname === emailBasedNickname
          ) {
            // Pokud nemáme nickname v metadata, ale existující je z emailu, zalogujme to
            console.error(
              "VAROVÁNÍ: Existující nickname je z emailu (",
              existingUser.nickname,
              "), ale metadata neobsahuje nickname pro uživatele:",
              userId
            );
          }
        }

        // Načíst nickname z DB (buď existující nebo nově vytvořený)
        const { data: userData, error: userDataError } = await admin
          .from("users")
          .select("nickname")
          .eq("id", userId)
          .maybeSingle();

        // Pokud se nepodařilo načíst záznam, přesměrujeme na login s chybou
        if (userDataError) {
          console.error("Chyba při načítání uživatele z DB:", userDataError);
          return NextResponse.redirect(
            new URL(
              `/prihlaseni?error=${encodeURIComponent(
                "Chyba při načítání uživatelského profilu. Zkuste se znovu přihlásit."
              )}`,
              baseUrl
            )
          );
        }

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
        `/prihlaseni?error=${encodeURIComponent(
          err?.message || "OAuth chyba"
        )}`,
        baseUrl
      )
    );
  }
}
