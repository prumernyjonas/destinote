"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function markCountryAsVisited(countryId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error("[markCountryAsVisited] Auth error:", authError.message);
      return { success: false, error: "Auth error: " + authError.message };
    }
    
    if (!auth?.user?.id) {
      console.error("[markCountryAsVisited] No user ID in auth data");
      return { success: false, error: "Unauthorized - no user session" };
    }

    const userId = auth.user.id;
    const admin = createAdminSupabaseClient();

    // Zkontrolovat, jestli už je navštívená
    const { data: existing } = await admin
      .from("user_visited_countries")
      .select("id")
      .eq("user_id", userId)
      .eq("country_id", countryId)
      .maybeSingle();

    if (existing) {
      // Už je navštívená, nic nedělat
      return { success: true, visited: true };
    }

    // Přidat
    const { error } = await admin
      .from("user_visited_countries")
      .insert({
        user_id: userId,
        country_id: countryId,
        visited_at: new Date().toISOString(),
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Revalidate aktuální stránku
    revalidatePath("/zeme", "layout");
    
    return { success: true, visited: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
