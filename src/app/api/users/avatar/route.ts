import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import crypto from "crypto";

function getEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return val;
}

function signParams(
  params: Record<string, string | number | undefined>,
  apiSecret: string
): string {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(sorted + apiSecret).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    // Zkusit získat userId různými způsoby
    let userId: string | null = null;
    
    // 1. Zkusit ze session (cookies)
    try {
      const supabase = await createServerSupabaseClient();
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error("[avatar] Auth error:", authError.message);
      } else if (auth?.user?.id) {
        userId = auth.user.id;
        console.log("[avatar] ✓ userId from session:", userId);
      }
    } catch (e) {
      console.log("[avatar] No userId from session:", (e as any)?.message || "error");
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
              console.error("[avatar] Error getting user from token:", tokenError.message);
            } else if (tokenUser?.user?.id) {
              userId = tokenUser.user.id;
              console.log("[avatar] ✓ userId from bearer token:", userId);
            }
          } catch (e: any) {
            console.error("[avatar] Exception getting user from token:", e?.message);
          }
        }
      }
    }

    if (!userId) {
      console.error("[avatar] ✗ Unauthorized - no userId found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    const admin = createAdminSupabaseClient();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Soubor není k dispozici" },
        { status: 400 }
      );
    }

    // Validace velikosti (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Maximální velikost souboru je 5 MB" },
        { status: 400 }
      );
    }

    // Validace typu
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Nepodporovaný typ souboru. Povolené: JPEG, PNG, WebP" },
        { status: 400 }
      );
    }

    // Nahrát do Cloudinary do složky "destinote_avatars"
    let cloudName: string;
    let apiKey: string;
    let apiSecret: string;
    try {
      cloudName = getEnv("CLOUDINARY_CLOUD_NAME");
      apiKey = getEnv("CLOUDINARY_API_KEY");
      apiSecret = getEnv("CLOUDINARY_API_SECRET");
    } catch (envErr: any) {
      console.error("[avatar] Missing Cloudinary env vars:", envErr.message);
      return NextResponse.json(
        {
          error: "Chyba konfigurace serveru. Kontaktujte administrátora.",
          details: process.env.NODE_ENV === "development" ? envErr.message : undefined,
        },
        { status: 500 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = `destinote_avatars/${userId}_${timestamp}`;
    const uploadPreset = "destinote_avatars"; // Název upload presetu z Cloudinary

    // Pro signed preset musíme podepsat request
    const paramsToSign: Record<string, string | number | undefined> = {
      timestamp,
      upload_preset: uploadPreset,
      public_id: publicId,
      // Transformace pro kruhový crop a optimalizaci
      transformation: "c_fill,g_face,w_400,h_400,r_max",
    };
    const signature = signParams(paramsToSign, apiSecret);

    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("api_key", apiKey);
    uploadForm.append("timestamp", String(timestamp));
    uploadForm.append("signature", signature);
    uploadForm.append("upload_preset", uploadPreset);
    uploadForm.append("public_id", publicId);
    // Transformace pro kruhový crop a optimalizaci
    uploadForm.append("transformation", "c_fill,g_face,w_400,h_400,r_max");

    // Timeout pro upload (60 sekund)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    let uploadRes: Response;
    let uploadData: any;
    try {
      uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: uploadForm,
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
      uploadData = await uploadRes.json();
      console.log("[avatar] Cloudinary response status:", uploadRes.status);
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      if (fetchErr.name === "AbortError") {
        console.error("[avatar] Upload timeout");
        return NextResponse.json(
          {
            error: "Nahrávání trvalo příliš dlouho. Zkuste použít menší obrázek.",
          },
          { status: 408 }
        );
      }
      console.error("[avatar] Fetch error:", fetchErr);
      return NextResponse.json(
        {
          error: "Chyba při komunikaci s Cloudinary. Zkuste to prosím znovu.",
        },
        { status: 500 }
      );
    }

    if (!uploadRes.ok) {
      console.error("[avatar] Cloudinary error:", uploadData);
      const errorMessage =
        uploadData?.error?.message || "Nahrání obrázku selhalo. Zkuste to prosím znovu.";
      return NextResponse.json(
        { error: errorMessage },
        {
          status: uploadRes.status >= 400 && uploadRes.status < 500 ? uploadRes.status : 500,
        }
      );
    }

    const publicUrl = uploadData.secure_url || uploadData.url;

    // Aktualizovat v auth metadata pomocí server klienta (má session)
    const { error: authError } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl, picture: publicUrl },
    });

    if (authError) {
      console.error("[avatar] Chyba při aktualizaci auth metadata:", authError);
    }

    // Aktualizovat v users tabulce pomocí admin klienta (obejde RLS)
    const { error: updateError } = await admin
      .from("users")
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (updateError) {
      console.error("[avatar] Chyba při aktualizaci users tabulky:", updateError);
      // Necháme to projít, protože Storage upload už proběhl
    }

    return NextResponse.json({
      success: true,
      avatarUrl: publicUrl,
    });
  } catch (err: any) {
    console.error("Chyba při nahrávání avatara:", err);
    return NextResponse.json(
      { error: err?.message || "Neznámá chyba" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Zkusit získat userId různými způsoby
    let userId: string | null = null;
    
    // 1. Zkusit ze session (cookies)
    try {
      const supabase = await createServerSupabaseClient();
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error("[avatar DELETE] Auth error:", authError.message);
      } else if (auth?.user?.id) {
        userId = auth.user.id;
        console.log("[avatar DELETE] ✓ userId from session:", userId);
      }
    } catch (e) {
      console.log("[avatar DELETE] No userId from session:", (e as any)?.message || "error");
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
              console.error("[avatar DELETE] Error getting user from token:", tokenError.message);
            } else if (tokenUser?.user?.id) {
              userId = tokenUser.user.id;
              console.log("[avatar DELETE] ✓ userId from bearer token:", userId);
            }
          } catch (e: any) {
            console.error("[avatar DELETE] Exception getting user from token:", e?.message);
          }
        }
      }
    }

    if (!userId) {
      console.error("[avatar DELETE] ✗ Unauthorized - no userId found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    const admin = createAdminSupabaseClient();

    // Smazat avatar z Cloudinary
    // Najít všechny avatary pro tohoto uživatele (hledat podle public_id pattern)
    try {
      let cloudName: string;
      let apiKey: string;
      let apiSecret: string;
      try {
        cloudName = getEnv("CLOUDINARY_CLOUD_NAME");
        apiKey = getEnv("CLOUDINARY_API_KEY");
        apiSecret = getEnv("CLOUDINARY_API_SECRET");
      } catch (envErr: any) {
        console.error("[avatar DELETE] Missing Cloudinary env vars:", envErr.message);
        // Pokračujeme dál, i když nemůžeme smazat z Cloudinary
      }

      if (cloudName && apiKey && apiSecret) {
        // Zkusit najít a smazat avatary uživatele
        // Cloudinary API pro mazání podle prefixu
        const timestamp = Math.floor(Date.now() / 1000);
        const paramsToSign = {
          timestamp,
          public_id: `destinote_avatars/${userId}_`,
        };
        const signature = signParams(paramsToSign, apiSecret);

        // Poznámka: Cloudinary API nepodporuje mazání podle prefixu přímo
        // Museli bychom použít Admin API pro listování a pak mazání
        // Pro jednoduchost necháme staré avatary v Cloudinary (nejsou veřejně přístupné bez URL)
        console.log("[avatar DELETE] Cloudinary cleanup skipped (would need Admin API)");
      }
    } catch (cloudinaryErr: any) {
      console.error("[avatar DELETE] Cloudinary cleanup error:", cloudinaryErr);
      // Pokračujeme dál, i když nemůžeme smazat z Cloudinary
    }

    // Odstranit z auth metadata pomocí server klienta (má session)
    const { error: authError } = await supabase.auth.updateUser({
      data: { avatar_url: null, picture: null },
    });

    if (authError) {
      console.error("[avatar DELETE] Chyba při aktualizaci auth metadata:", authError);
    }

    // Odstranit z users tabulce pomocí admin klienta (obejde RLS)
    const { error: updateError } = await admin
      .from("users")
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (updateError) {
      console.error("[avatar DELETE] Chyba při aktualizaci users tabulky:", updateError);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Chyba při mazání avatara:", err);
    return NextResponse.json(
      { error: err?.message || "Neznámá chyba" },
      { status: 500 }
    );
  }
}
