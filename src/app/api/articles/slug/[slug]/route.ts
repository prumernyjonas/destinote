import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("articles")
    .select(
      "id, slug, title, summary, content, author_id, status, published_at, created_at, main_image_url, main_image_alt, main_image_width, main_image_height"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  if (!data || data.status !== "approved") {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

