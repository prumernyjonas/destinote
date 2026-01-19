/**
 * Utility funkce pro získávání autentizačních tokenů
 */

import { supabase } from "@/lib/supabase/client";

/**
 * Získá access token z localStorage
 */
export function getAccessTokenFromStorage(): string | null {
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      const lower = key.toLowerCase();
      const looksSupabase =
        lower.includes("supabase") || lower.startsWith("sb-");
      const looksAuth =
        lower.includes("auth") ||
        lower.includes("session") ||
        lower.includes("token");
      if (!looksSupabase || !looksAuth) continue;
      try {
        const value = localStorage.getItem(key);
        if (!value) continue;
        const parsed = JSON.parse(value);
        if (parsed?.access_token) return parsed.access_token;
        if (parsed?.currentSession?.access_token)
          return parsed.currentSession.access_token;
        if (parsed?.session?.access_token) return parsed.session.access_token;
        if (parsed?.accessToken) return parsed.accessToken;
      } catch {
        // Ignorujeme chyby parsování
      }
    }
  } catch (e) {
    console.warn("[authUtils] Error reading localStorage:", e);
  }
  return null;
}

/**
 * Získá access token z různých zdrojů (localStorage, session, getUser)
 */
export async function getAccessToken(): Promise<string | null> {
  // Zkusíme získat token z localStorage (rychlejší a spolehlivější)
  let token: string | null = getAccessTokenFromStorage();

  // Pokud není v localStorage, zkusíme getSession s timeoutem
  if (!token) {
    try {
      const sessionResult = await Promise.race([
        supabase.auth.getSession(),
        new Promise<{ data: { session: any } }>((resolve) =>
          setTimeout(
            () => resolve({ data: { session: null } } as any),
            3000
          )
        ),
      ]);
      token = sessionResult?.data?.session?.access_token || null;
    } catch (err) {
      console.warn("[authUtils] getSession error:", err);
    }
  }

  // Pokud stále nemáme token, zkusíme getUser
  if (!token) {
    try {
      const userResult = await Promise.race([
        supabase.auth.getUser(),
        new Promise<{ data: { user: any } }>((resolve) =>
          setTimeout(() => resolve({ data: { user: null } } as any), 3000)
        ),
      ]);
      // getUser nevrací token přímo, ale můžeme zkusit znovu getSession
      if (userResult?.data?.user) {
        const sessionResult = await supabase.auth.getSession();
        token = sessionResult?.data?.session?.access_token || null;
      }
    } catch (err) {
      console.warn("[authUtils] getUser error:", err);
    }
  }

  return token;
}
