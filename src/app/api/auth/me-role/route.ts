import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data: auth, error: authError } = await supabase.auth.getUser();
  const userId = auth?.user?.id;

  console.log("🔍 [me-role API] Auth error:", authError);
  console.log("🔍 [me-role API] User ID:", userId);
  console.log("🔍 [me-role API] Auth data:", auth?.user ? "Existuje" : "Neexistuje");

  if (!userId) {
    console.log("🔍 [me-role API] Vracím visitor - userId není k dispozici");
    return NextResponse.json({ role: "visitor" }, { status: 200 });
  }

  // tvoje tabulka: users (id = auth.user.id), sloupec role = "user" | "admin"
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  console.log("🔍 [me-role API] DB query error:", error);
  console.log("🔍 [me-role API] DB data:", data);
  console.log("🔍 [me-role API] Role z DB:", data?.role || "NENÍ");

  if (error) {
    console.log("🔍 [me-role API] Vracím user - DB error");
    return NextResponse.json({ role: "user" }, { status: 200 });
  }

  const role = data?.role ?? "user";
  console.log("🔍 [me-role API] Vracím role:", role);
  return NextResponse.json({ role }, { status: 200 });
}
