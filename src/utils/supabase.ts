import { supabase } from "@/lib/supabase/client";
import { User, LoginCredentials, RegisterCredentials } from "@/types/auth";
import type { User as SupabaseUser } from "@supabase/supabase-js";

function mapSupabaseUserToAppUser(sbUser: SupabaseUser): User {
  const displayName =
    (sbUser.user_metadata as any)?.displayName ||
    (sbUser.user_metadata as any)?.name ||
    (sbUser.email ? sbUser.email.split("@")[0] : "");
  const photoURL =
    (sbUser.user_metadata as any)?.avatar_url ||
    (sbUser.user_metadata as any)?.picture ||
    "";

  return {
    uid: sbUser.id,
    email: sbUser.email || "",
    displayName,
    photoURL,
    createdAt: new Date(sbUser.created_at),
    lastLoginAt: new Date(),
  };
}

export const authUtils = {
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

    return mapSupabaseUserToAppUser(data.user);
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

    return mapSupabaseUserToAppUser(data.user);
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const { data, error } = await supabase.auth.getUser();
    // Pokud není aktivní session, Supabase vrací chybu "Auth session missing!"
    // V takovém případě vrátíme klidně null místo vyhození chyby.
    if (error) {
      const normalized = (error.message || "").toLowerCase();
      if (normalized.includes("auth session missing")) {
        return null;
      }
      throw new Error(error.message);
    }
    const sbUser = data.user;
    return sbUser ? mapSupabaseUserToAppUser(sbUser) : null;
  },
};
