import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  try {
    if (code) {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(
          new URL(
            `/auth/login?error=${encodeURIComponent(error.message)}`,
            req.url
          )
        );
      }
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent(err?.message || "OAuth chyba")}`,
        req.url
      )
    );
  }
}


