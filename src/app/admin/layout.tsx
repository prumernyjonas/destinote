import { ReactNode } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import ClientAdminGate from "./ClientAdminGate";
import { isAdmin, type UserRole } from "@/app/api/_utils/auth";

async function getRoleForCurrentUser(): Promise<UserRole | null> {
  const supa = await createServerSupabaseClient();
  const { data } = await supa.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return null;
  const admin = createAdminSupabaseClient();
  const { data: user } = await admin
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return (user?.role as UserRole) || null;
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const role = await getRoleForCurrentUser();
  if (role && isAdmin(role)) {
    return <>{children}</>;
  }
  // Pokud není k dispozici serverová session (např. login heslem), ověří klientsky přes Bearer token
  return <ClientAdminGate>{children}</ClientAdminGate>;
}
