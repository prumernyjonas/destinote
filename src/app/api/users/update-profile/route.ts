import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { slugifyNickname } from "@/utils/slugify";
import { checkNicknameExists } from "@/app/api/_utils/users";

export async function PATCH(req: NextRequest) {
  try {
    // Zkusit získat userId různými způsoby
    let userId: string | null = null;
    
    // 1. Zkusit ze session (cookies)
    try {
      const supabase = await createServerSupabaseClient();
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error("[update-profile] Auth error:", authError.message);
      } else if (auth?.user?.id) {
        userId = auth.user.id;
        console.log("[update-profile] ✓ userId from session:", userId);
      }
    } catch (e) {
      console.log("[update-profile] No userId from session:", (e as any)?.message || "error");
    }
    
    // 2. Zkusit z Bearer tokenu
    if (!userId) {
      const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
      if (authHeader) {
        const token = authHeader.toLowerCase().startsWith("bearer ")
          ? authHeader.slice(7).trim()
          : null;
        if (token) {
          try {
            const admin = createAdminSupabaseClient();
            const { data: tokenUser, error: tokenError } = await admin.auth.getUser(token);
            if (tokenError) {
              console.error("[update-profile] Error getting user from token:", tokenError.message);
            } else if (tokenUser?.user?.id) {
              userId = tokenUser.user.id;
              console.log("[update-profile] ✓ userId from bearer token:", userId);
            }
          } catch (e: any) {
            console.error("[update-profile] Exception getting user from token:", e?.message);
          }
        }
      }
    }

    if (!userId) {
      console.error("[update-profile] ✗ Unauthorized - no userId found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    const body = await req.json();
    const { nickname } = body;

    if (!nickname || typeof nickname !== "string") {
      return NextResponse.json(
        { error: "Nickname je povinný" },
        { status: 400 }
      );
    }

    const trimmedNickname = nickname.trim();

    // Validace
    if (trimmedNickname.length < 3) {
      return NextResponse.json(
        { error: "Přezdívka musí mít alespoň 3 znaky" },
        { status: 400 }
      );
    }

    if (trimmedNickname.length > 30) {
      return NextResponse.json(
        { error: "Přezdívka může mít maximálně 30 znaků" },
        { status: 400 }
      );
    }

    if (!/^[\p{L}\p{N}_-]+$/u.test(trimmedNickname)) {
      return NextResponse.json(
        {
          error:
            "Přezdívka může obsahovat pouze písmena (včetně diakritiky), čísla, pomlčky a podtržítka",
        },
        { status: 400 }
      );
    }

    // Kontrola, zda nickname už existuje (kromě aktuálního uživatele)
    // Použít optimalizovanou funkci místo načítání všech uživatelů
    console.log("[update-profile] Kontroluji unikátnost nicknamu...");
    const nicknameSlug = slugifyNickname(trimmedNickname);
    
    try {
      const exists = await checkNicknameExists(trimmedNickname, userId);
      if (exists) {
        console.log("[update-profile] Nickname již existuje:", trimmedNickname);
        return NextResponse.json(
          {
            error: `Přezdívka "${trimmedNickname}" je již obsazena. Zkuste jinou přezdívku.`,
          },
          { status: 400 }
        );
      }
    } catch (err: any) {
      console.error("[update-profile] Chyba při kontrole unikátnosti:", err);
      return NextResponse.json(
        { error: "Chyba při kontrole přezdívky" },
        { status: 500 }
      );
    }

    console.log("[update-profile] Nickname je dostupný, aktualizuji...");

    // Aktualizovat nickname v databázi
    console.log("[update-profile] Aktualizuji nickname v DB pro userId:", userId);
    const { error: updateError } = await admin
      .from("users")
      .update({
        nickname: trimmedNickname,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("[update-profile] Chyba při aktualizaci nicknamu:", updateError);
      return NextResponse.json(
        { error: "Chyba při aktualizaci přezdívky" },
        { status: 500 }
      );
    }

    console.log("[update-profile] DB update úspěšný, aktualizuji auth metadata...");

    // Aktualizovat nickname v auth metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: { nickname: trimmedNickname },
    });

    if (authError) {
      console.error("[update-profile] Chyba při aktualizaci auth metadata:", authError);
      // Necháme to projít, protože DB update už proběhl
    }

    console.log("[update-profile] Vracím success response");
    return NextResponse.json({
      success: true,
      nickname: trimmedNickname,
      slug: nicknameSlug,
    });
  } catch (err: any) {
    console.error("Chyba při aktualizaci profilu:", err);
    return NextResponse.json(
      { error: err?.message || "Neznámá chyba" },
      { status: 500 }
    );
  }
}
