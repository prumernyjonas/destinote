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
  dbNickname?: string,
  dbAvatarUrl?: string | null
): User {
  const meta = (sbUser.user_metadata as any) || {};
  // Nickname z DB má přednost, pak z metadata
  const nickname = dbNickname || meta.nickname || undefined;
  // Slugifikovaná verze pro URL
  const nicknameSlug = nickname ? slugifyNickname(nickname) : undefined;
  // DisplayName použije nickname, pokud je dostupný, jinak fallback
  const displayName =
    nickname ||
    meta.displayName ||
    meta.full_name ||
    meta.name ||
    meta.user_name ||
    (sbUser.email ? sbUser.email.split("@")[0] : "");
  
  // Avatar URL z DB má přednost, pak z metadata (ale ignorujeme Google fotky)
  let photoURL = "";
  if (dbAvatarUrl && dbAvatarUrl.trim() !== "") {
    const isGooglePhoto = dbAvatarUrl.includes("googleusercontent.com") ||
      dbAvatarUrl.includes("google.com") ||
      dbAvatarUrl.includes("lh3.googleusercontent.com");
    if (!isGooglePhoto) {
      photoURL = dbAvatarUrl;
    }
  }
  
  // Fallback na metadata pouze pokud nemáme z DB
  if (!photoURL) {
    const metaPhotoUrl = meta.avatar_url || meta.picture || "";
    const isGooglePhoto = metaPhotoUrl && (
      metaPhotoUrl.includes("googleusercontent.com") ||
      metaPhotoUrl.includes("google.com") ||
      metaPhotoUrl.includes("lh3.googleusercontent.com")
    );
    if (metaPhotoUrl && !isGooglePhoto) {
      photoURL = metaPhotoUrl;
    }
  }

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

    const user = mapSupabaseUserToAppUser(data.user, undefined, undefined);
    // Uložení do cache pro rychlou rehydrataci po refreshi
    this.setCachedUser(user);
    return user;
  },

  async register(credentials: RegisterCredentials): Promise<User> {
    if (credentials.password !== credentials.confirmPassword) {
      throw new Error("Hesla se neshodují");
    }

    // Validace vstupních dat
    if (!credentials.email || !credentials.email.trim()) {
      throw new Error("Email je povinný");
    }
    if (!credentials.password || credentials.password.length < 8) {
      throw new Error("Heslo musí mít alespoň 8 znaků");
    }
    if (!credentials.nickname || !credentials.nickname.trim()) {
      throw new Error("Přezdívka je povinná");
    }

    // Kontrola, zda nickname už existuje (podle slugifikované verze)
    try {
      const checkResponse = await fetch(
        `/api/users/check-nickname?nickname=${encodeURIComponent(credentials.nickname.trim())}`
      );
      const checkData = await checkResponse.json();
      
      if (!checkData.available) {
        throw new Error(
          checkData.message || 
          `Přezdívka "${credentials.nickname}" je již obsazena. Zkuste jinou přezdívku.`
        );
      }
    } catch (err: any) {
      // Pokud je to chyba o obsazeném nicknamu, propaguj ji
      if (err.message?.includes("obsazena") || err.message?.includes("dostupná")) {
        throw err;
      }
      // Jinak pokračujeme - kontrola se provede i v databázi
      console.warn("Chyba při kontrole nicknamu před registrací:", err);
    }

    // Získat správnou URL pro redirect
    let redirectUrl: string | undefined;
    if (typeof window !== "undefined") {
      // V browseru použijeme aktuální origin
      redirectUrl = `${window.location.origin}/auth/callback`;
    } else if (process.env.NEXT_PUBLIC_SITE_URL) {
      // Pokud je nastavena environment variable, použijeme ji
      redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
    }

    // Pokud není redirect URL nastavená, použijeme fallback
    if (!redirectUrl) {
      console.warn("Redirect URL není nastavená, používá se fallback");
      redirectUrl = "http://localhost:3000/auth/callback";
    }

    // Debug: zalogovat, co se ukládá do metadata
    console.log(
      "Registrace - ukládám nickname do metadata:",
      credentials.nickname,
      "pro email:",
      credentials.email,
      "redirect URL:",
      redirectUrl
    );

    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          nickname: credentials.nickname,
        },
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      // Lepší error handling - zobrazit konkrétní chybovou zprávu
      console.error("Supabase signUp error:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      
      // Pokud je to chyba s databází (500), může to být problém s triggerem nebo RLS
      if (error.status === 500 && error.message?.includes("Database error")) {
        throw new Error(
          `Chyba při vytváření uživatelského účtu v databázi. ` +
          `Zkontrolujte prosím, zda je v Supabase databázi nastaven trigger pro automatické vytvoření záznamu v users tabulce. ` +
          `Spusťte SQL skript z docs/sql/create_user_trigger.sql v Supabase SQL Editoru. ` +
          `Původní chyba: ${error.message}`
        );
      }
      
      // Pokud je to chyba s redirect URL
      if (error.message?.includes("redirect")) {
        throw new Error(
          `Chyba při registraci: ${error.message}. ` +
          `Zkontrolujte prosím, zda je URL ${redirectUrl} přidána do whitelistu redirect URL v Supabase dashboardu.`
        );
      }
      
      // Pokud je to chyba s nicknamem (např. už existuje)
      if (error.message?.includes("nickname") || error.message?.includes("unique") || error.message?.includes("duplicate")) {
        throw new Error(
          `Přezdívka "${credentials.nickname}" je již obsazena nebo obsahuje neplatné znaky. ` +
          `Zkuste prosím jinou přezdívku.`
        );
      }
      
      throw new Error(error.message || "Chyba při registraci");
    }

    // Debug: zkontrolovat, zda se metadata správně uložila
    if (data.user) {
      const savedMetadata = data.user.user_metadata || {};
      console.log(
        "Registrace - uložená metadata:",
        JSON.stringify(savedMetadata, null, 2),
        "Nickname v metadata:",
        savedMetadata.nickname
      );

      if (savedMetadata.nickname !== credentials.nickname) {
        console.error(
          "VAROVÁNÍ: Nickname v metadata se neshoduje! Očekáváno:",
          credentials.nickname,
          "Uloženo:",
          savedMetadata.nickname
        );
      }
    }

    // Pokud je email confirmation povoleno, data.user může být null
    // Záznam v users tabulce se vytvoří až po potvrzení emailu v callback route
    if (!data.user) {
      // Registrace proběhla, ale email musí být potvrzen
      throw new Error(
        "Registrace proběhla úspěšně! Zkontrolujte svůj email a potvrďte registraci kliknutím na odkaz v emailu."
      );
    }

    // Pokud je uživatel hned potvrzený (např. v developmentu), vytvoříme záznam
    if (data.user.email_confirmed_at) {
      try {
        const { error: dbError } = await supabase.from("users").insert({
          id: data.user.id,
          nickname: credentials.nickname,
          role: "user",
        });

        if (dbError) {
          console.error("Chyba při vytváření záznamu uživatele:", dbError);
        }
      } catch (e) {
        console.error("Chyba při vytváření záznamu uživatele:", e);
      }
    }

    // Neukládáme uživatele do cache, pokud není potvrzený
    if (data.user.email_confirmed_at) {
      const user = mapSupabaseUserToAppUser(data.user, undefined, undefined);
      this.setCachedUser(user);
      return user;
    }

    // Pokud není potvrzený, vyhodíme chybu s informací o emailu
    throw new Error(
      "Registrace proběhla úspěšně! Zkontrolujte svůj email a potvrďte registraci kliknutím na odkaz v emailu."
    );
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
      // Pro jiné chyby zkusit použít cached user jako fallback
      const cached = this.getCachedUser();
      if (cached) {
        console.warn("[getCurrentUser] Auth error, použiji cached user:", error.message);
        return cached;
      }
      throw new Error(error.message);
    }
    const sbUser = data.user;
    if (!sbUser) {
      // Zkusit použít cached user jako fallback
      const cached = this.getCachedUser();
      if (cached) {
        console.warn("[getCurrentUser] Žádný sbUser, použiji cached user");
        return cached;
      }
      this.clearCachedUser();
      this.clearSupabaseStorage();
      return null;
    }

    // Načíst nickname a avatar_url z API (obejde RLS)
    // Použít cache-busting pro zajištění, že se načte aktuální data
    let dbNickname: string | undefined;
    let dbAvatarUrl: string | null | undefined;
    let apiFailed = false;
    
    try {
      // Přidat timeout pro API request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 10000); // 10 sekund timeout

      // Přidat timestamp pro cache-busting
      const timestamp = Date.now();
      const res = await fetch(`/api/users/${sbUser.id}?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const json = await res.json();
        dbNickname = json.data?.nickname;
        dbAvatarUrl = json.data?.avatarUrl;
        console.log("[getCurrentUser] Načteno z API:", { 
          userId: sbUser.id, 
          dbNickname, 
          dbAvatarUrl,
          email: sbUser.email 
        });
      } else {
        console.warn("[getCurrentUser] API request failed:", res.status, res.statusText);
        apiFailed = true;
      }
    } catch (fetchErr: any) {
      console.warn("[getCurrentUser] API request error:", fetchErr.message || fetchErr);
      apiFailed = true;
    }

    // Pokud API selhalo, zkusit použít cached user jako fallback
    if (apiFailed) {
      const cached = this.getCachedUser();
      if (cached && cached.uid === sbUser.id) {
        console.warn("[getCurrentUser] API selhalo, použiji cached user pro:", sbUser.id);
        // Aktualizovat cache s aktuálními daty ze Supabase (i když API selhalo)
        const user = mapSupabaseUserToAppUser(sbUser, cached.nickname, cached.photoURL || null);
        this.setCachedUser(user);
        return user;
      }
    }

    const user = mapSupabaseUserToAppUser(sbUser, dbNickname, dbAvatarUrl);
    console.log("[getCurrentUser] Vytvořen user objekt:", { 
      uid: user.uid,
      nickname: user.nickname, 
      nicknameSlug: user.nicknameSlug,
      displayName: user.displayName,
      email: user.email 
    });
    // Udržovat cache synchronní se stavem Supabase
    this.setCachedUser(user);
    return user;
  },
};
