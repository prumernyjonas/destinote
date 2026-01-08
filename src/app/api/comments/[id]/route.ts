import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getUserRole, isAdmin } from "@/app/api/_utils/auth";

async function resolveUserId(req: NextRequest): Promise<string | null> {
  // 1) session z cookies
  const supa = await createServerSupabaseClient();
  const { data: auth } = await supa.auth.getUser();
  if (auth.user?.id) return auth.user.id;

  // 2) Bearer token v Authorization headeru
  const authHeader =
    req.headers.get("authorization") || req.headers.get("Authorization");
  const token = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7)
    : null;
  if (token) {
    try {
      const admin = createAdminSupabaseClient();
      const { data: tokenUser } = await admin.auth.getUser(token);
      if (tokenUser?.user?.id) return tokenUser.user.id;
    } catch (e) {
      console.warn("[comments.DELETE] bearer resolve error", e);
    }
  }

  return null;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const commentId = params.id;
  const userId = await resolveUserId(_req);
  if (!userId)
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });

  const admin = createAdminSupabaseClient();
  const { data: com, error: cErr } = await admin
    .from("comments")
    .select("author_id")
    .eq("id", commentId)
    .maybeSingle();
  if (cErr)
    return new Response(JSON.stringify({ error: cErr.message }), {
      status: 500,
    });
  if (!com)
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
    });

  const role = await getUserRole(userId);
  if (com.author_id !== userId && !isAdmin(role)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });
  }

  // Soft delete
  const { error } = await admin
    .from("comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId);
  if (error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
