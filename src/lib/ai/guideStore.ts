// src/lib/ai/guideStore.ts
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Scope = "country" | "region";

export async function getStoredGuide<T>(
  scope: Scope,
  key: string
): Promise<T | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("ai_guides")
      .select("content")
      .eq("scope", scope)
      .eq("key", key)
      .maybeSingle();
    if (error) return null;
    const content = (data as any)?.content;
    return content ? (content as T) : null;
  } catch {
    return null;
  }
}

export async function saveStoredGuide<T>(
  scope: Scope,
  key: string,
  content: T
): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    // upsert by (scope, key)
    const { error } = await supabase.from("ai_guides").upsert(
      {
        scope,
        key,
        content,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "scope,key" }
    );
    if (error) {
      // best-effort, nepropagujeme chybu do UI
      // console.warn("ai_guides upsert error:", error.message);
    }
  } catch {
    // ignore
  }
}
