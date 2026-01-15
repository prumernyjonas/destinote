import { NextRequest } from "next/server";
import crypto from "crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

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
  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    filtered[k] = String(v);
  }
  const toSign = Object.keys(filtered)
    .sort()
    .map((k) => `${k}=${filtered[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    // Autorizace – vyžadujeme přihlášeného uživatele (cookies nebo Bearer token)
    const supa = await createServerSupabaseClient();
    const { data: auth } = await supa.auth.getUser();
    let userId: string | null = auth.user?.id ?? null;
    console.log("[upload] start, cookieUserId:", userId || null);
    if (!userId) {
      const authHeader =
        req.headers.get("authorization") || req.headers.get("Authorization");
      const token = authHeader?.toLowerCase().startsWith("bearer ")
        ? authHeader.slice(7)
        : null;
      if (token) {
        console.log("[upload] found bearer token (length)", token.length);
      } else {
        console.log("[upload] no bearer token provided");
      }
      if (token) {
        const adminAuth = createAdminSupabaseClient();
        const { data: tokenUser } = await adminAuth.auth.getUser(token);
        if (tokenUser?.user?.id) {
          userId = tokenUser.user.id;
          console.log("[upload] resolved userId from bearer:", userId);
        }
      }
    }
    if (!userId) {
      console.warn("[upload] Unauthorized - no userId");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const form = await req.formData();
    const file = form.get("file") as unknown as File | null;
    const folder =
      (form.get("folder") as string | null) ||
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_FOLDER ||
      "destinote_articles";
    const publicId = (form.get("public_id") as string | null) || undefined;

    if (!file) {
      console.warn("[upload] Missing file");
      return new Response(JSON.stringify({ error: "Chybí soubor k nahrání" }), {
        status: 400,
      });
    }

    // Validace velikosti souboru (max 4 MB pro bezpečnost - Vercel má limit 4.5 MB)
    const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB
    if (file.size > MAX_FILE_SIZE) {
      console.warn("[upload] File too large:", file.size);
      return new Response(
        JSON.stringify({
          error: `Soubor je příliš velký. Maximální velikost je ${MAX_FILE_SIZE / 1024 / 1024} MB.`,
        }),
        { status: 400 }
      );
    }

    // Validace typu souboru (pouze obrázky)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      console.warn("[upload] Invalid file type:", file.type);
      return new Response(
        JSON.stringify({
          error: `Nepodporovaný typ souboru. Povolené typy: JPEG, PNG, WebP, GIF.`,
        }),
        { status: 400 }
      );
    }

    console.log("[upload] file:", {
      name: (file as any)?.name,
      type: file.type,
      size: file.size,
      folder,
      publicId: publicId || null,
    });

    // Kontrola environment proměnných s lepším error handlingem
    let cloudName: string;
    let apiKey: string;
    let apiSecret: string;
    try {
      cloudName = getEnv("CLOUDINARY_CLOUD_NAME");
      apiKey = getEnv("CLOUDINARY_API_KEY");
      apiSecret = getEnv("CLOUDINARY_API_SECRET");
    } catch (envErr: any) {
      console.error("[upload] Missing Cloudinary env vars:", envErr.message);
      return new Response(
        JSON.stringify({
          error: "Chyba konfigurace serveru. Kontaktujte administrátora.",
          details: process.env.NODE_ENV === "development" ? envErr.message : undefined,
        }),
        { status: 500 }
      );
    }
    const timestamp = Math.floor(Date.now() / 1000);

    const paramsToSign = {
      timestamp,
      folder,
      public_id: publicId,
    };
    const signature = signParams(paramsToSign, apiSecret);

    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("api_key", apiKey);
    uploadForm.append("timestamp", String(timestamp));
    uploadForm.append("signature", signature);
    if (folder) uploadForm.append("folder", folder);
    if (publicId) uploadForm.append("public_id", publicId);

    // Timeout pro upload (60 sekund)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    let res: Response;
    let data: any;
    try {
      res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: uploadForm,
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
      data = await res.json();
      console.log("[upload] cloudinary response status:", res.status);
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      if (fetchErr.name === "AbortError") {
        console.error("[upload] Upload timeout");
        return new Response(
          JSON.stringify({
            error: "Nahrávání trvalo příliš dlouho. Zkuste použít menší obrázek.",
          }),
          { status: 408 }
        );
      }
      console.error("[upload] Fetch error:", fetchErr);
      return new Response(
        JSON.stringify({
          error: "Chyba při komunikaci s Cloudinary. Zkuste to prosím znovu.",
        }),
        { status: 500 }
      );
    }

    if (!res.ok) {
      console.error("[upload] cloudinary error:", data);
      const errorMessage =
        data?.error?.message || "Nahrání obrázku selhalo. Zkuste to prosím znovu.";
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: res.status >= 400 && res.status < 500 ? res.status : 500,
      });
    }

    // Vracíme jen důležité hodnoty
    console.log("[upload] success:", {
      url: data.secure_url || data.url,
      public_id: data.public_id,
      width: data.width,
      height: data.height,
    });
    return new Response(
      JSON.stringify({
        url: data.secure_url || data.url,
        public_id: data.public_id,
        width: data.width,
        height: data.height,
        format: data.format,
        resource_type: data.resource_type,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[upload] handler error:", err?.message, err);
    // Pokud je to chyba s environment proměnnými, vraťme konkrétní hlášku
    if (err?.message?.includes("Missing environment variable")) {
      return new Response(
        JSON.stringify({
          error: "Chyba konfigurace serveru. Kontaktujte administrátora.",
          details: process.env.NODE_ENV === "development" ? err.message : undefined,
        }),
        { status: 500 }
      );
    }
    return new Response(
      JSON.stringify({
        error: err?.message || "Nastala neočekávaná chyba při nahrávání obrázku.",
      }),
      { status: 500 }
    );
  }
}

// Export runtime konfigurace pro Vercel (prodloužení timeoutu)
export const runtime = "nodejs";
export const maxDuration = 60; // 60 sekund (max pro Pro plán)


