import { NextRequest } from "next/server";
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
  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    filtered[k] = String(v);
  }
  const toSign = Object.keys(filtered)
    .sort()
    .map((k) => `${k}=${filtered[k]}`)
    .join("&");
  const hash = crypto
    .createHash("sha1")
    .update(toSign + apiSecret)
    .digest("hex");
  return hash;
}

export async function POST(req: NextRequest) {
  try {
    const { folder, public_id, eager, invalidate } = await req
      .json()
      .catch(() => ({}));

    const apiKey = getEnv("CLOUDINARY_API_KEY");
    const cloudName = getEnv("CLOUDINARY_CLOUD_NAME");
    const apiSecret = getEnv("CLOUDINARY_API_SECRET");

    const timestamp = Math.floor(Date.now() / 1000);

    const params = {
      timestamp,
      folder,
      public_id,
      eager,
      invalidate,
    } as Record<string, string | number | undefined>;

    const signature = signParams(params, apiSecret);

    return new Response(
      JSON.stringify({
        timestamp,
        signature,
        apiKey,
        cloudName,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Signature error" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    );
  }
}
