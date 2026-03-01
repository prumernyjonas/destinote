import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getUserRole, isAdmin, getUserIdFromRequest } from "@/app/api/_utils/auth";
import { createErrorResponse } from "@/app/api/_utils/errors";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return createErrorResponse("Unauthorized", 401);
    }

    const role = await getUserRole(userId);
    return new Response(
      JSON.stringify({ role, isAdmin: isAdmin(role), userId }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    return createErrorResponse(message, 500);
  }
}
