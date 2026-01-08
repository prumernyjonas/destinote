import { supabase } from "@/lib/supabase/client";
import { User, LoginCredentials, RegisterCredentials } from "@/types/auth";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { slugifyNickname } from "./slugify";

const LOCAL_STORAGE_USER_KEY = "destinote.auth.user";

function serializeUser(user: User): string {
  // Uložíme ISO řetězce pro datumy
  const payload = {
    ...user,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt.toISOString(),
  };
  return JSON.stringify(payload);
}

function deserializeUser(value: string | null): User | null {
  if (!value) return null;
  try {
    const raw = JSON.parse(value) as {
      uid: string;
      email: string;
      displayName: string;
      nickname?: string;
      nicknameSlug?: string;
      photoURL?: string;
      createdAt: string;
      lastLoginAt: string;
    };
    return {
      uid: raw.uid,
      email: raw.email,
      displayName: raw.displayName,
      nickname: raw.nickname,
      nicknameSlug: raw.nicknameSlug,
      photoURL: raw.photoURL,
      createdAt: new Date(raw.createdAt),
      lastLoginAt: new Date(raw.lastLoginAt),
    } satisfies User;
  } catch {
    return null;
  }
}

function mapSupabaseUserToAppUser(
  sbUser: SupabaseUser,
  dbNickname?: string
): User {
  const meta = (sbUser.user_metadata as any) || {};
  const displayName =
    meta.displayName ||
    meta.full_name ||
    meta.name ||
    meta.user_name ||
    (sbUser.email ? sbUser.email.split("@")[0] : "");
  const photoURL = meta.avatar_url || meta.picture || "";
  // Nickname z DB má přednost, pak z metadata
  const nickname = dbNickname || meta.nickname || undefined;
  // Slugifikovaná verze pro URL
  const nicknameSlug = nickname ? slugifyNickname(nickname) : undefined;

  return {
    uid: sbUser.id,
    email: sbUser.email || "",
    displayName,
    nickname,
    nicknameSlug,
    photoURL,
    createdAt: new Date(sbUser.created_at),
    lastLoginAt: new Date(),
  };
}

export const authUtils = {
  getCachedUser(): User | null {
    if (typeof window === "undefined") return null;
    return deserializeUser(localStorage.getItem(LOCAL_STORAGE_USER_KEY));
  },
  async loginWithGoogle(): Promise<void> {
    // Použijeme /auth/callback jako redirect URI (to je endpoint, který zpracovává OAuth callback)
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });
    if (error) {
      throw new Error(error.message);
    }
  },
  setCachedUser(user: User) {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, serializeUser(user));
  },
  clearCachedUser() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  },
  clearSupabaseStorage() {
    if (typeof window === "undefined") return;
    try {
      // Odstranit všechny lokální klíče Supabase (sb-...)
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith("sb-")) toRemove.push(key);
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
  },
  async login(credentials: LoginCredentials): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("Přihlášení selhalo – uživatel není dostupný");
    }

    const user = mapSupabaseUserToAppUser(data.user);
    // Uložení do cache pro rychlou rehydrataci po refreshi
    this.setCachedUser(user);
    return user;
  },

  async register(credentials: RegisterCredentials): Promise<User> {
    if (credentials.password !== credentials.confirmPassword) {
      throw new Error("Hesla se neshodují");
    }

    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          displayName: credentials.name,
        },
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/login`
            : undefined,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    // U Sugabase může být potřeba potvrdit email; data.user může být null do potvrzení
    if (!data.user) {
      throw new Error("Registrace proběhla – ověřte email a přihlaste se");
    }

    const user = mapSupabaseUserToAppUser(data.user);
    // Uložení do cache (uživatel může vyžadovat ověření emailu)
    this.setCachedUser(user);
    return user;
  },

  async logout(): Promise<void> {
    try {
      // 1) Odhlásit aktuální klientskou session (volitelně globálně napříč zařízeními)
      const signOutPromise = supabase.auth.signOut({ scope: "global" });
      // ochranný timeout, aby UI nečekalo nekonečně dlouho
      const { error } = await Promise.race([
        signOutPromise,
        new Promise<{ error: { message?: string } | null }>((resolve) =>
          setTimeout(() => resolve({ error: null }), 1500)
        ),
      ]);
      if (error) {
        // Nepropagujeme chybu, jen zalognujeme a pokračujeme
        console.warn("Supabase signOut error:", error.message);
      }
      // 2) Pokusit se odhlásit i na serveru, aby se smazaly httpOnly cookies (SSR)
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 1500);
        await fetch("/api/auth/logout", {
          method: "POST",
          signal: controller.signal,
        }).finally(() => clearTimeout(t));
      } catch (_) {
        // Tiché selhání – klient je už odhlášen
      }
    } catch (e: any) {
      console.warn("Supabase signOut threw:", e?.message || e);
    } finally {
      // Vždy vyčistit cache, aby UI reflektovalo odhlášení
      this.clearCachedUser();
      this.clearSupabaseStorage();
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const { data, error } = await supabase.auth.getUser();
    // Pokud není aktivní session, Supabase vrací chybu "Auth session missing!"
    // V takovém případě vrátíme klidně null místo vyhození chyby.
    if (error) {
      const normalized = (error.message || "").toLowerCase();
      if (normalized.includes("auth session missing")) {
        // Session chybí – vyčistit i lokální cache, aby neblikalo
        this.clearCachedUser();
        return null;
      }
      throw new Error(error.message);
    }
    const sbUser = data.user;
    if (!sbUser) {
      this.clearCachedUser();
      this.clearSupabaseStorage();
      return null;
    }

    // Načíst nickname z API (obejde RLS)
    let dbNickname: string | undefined;
    try {
      const res = await fetch(`/api/users/${sbUser.id}`);
      if (res.ok) {
        const json = await res.json();
        dbNickname = json.data?.nickname;
      }
    } catch {
      // Ignorovat chybu - použije se fallback
    }

    const user = mapSupabaseUserToAppUser(sbUser, dbNickname);
    // Udržovat cache synchronní se stavem Supabase
    this.setCachedUser(user);
    return user;
  },
};
