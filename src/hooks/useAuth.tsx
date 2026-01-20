"use client";

// hooks/useAuth.ts
import {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
  useRef,
} from "react";
import { supabase } from "@/lib/supabase/client";
import { authUtils } from "@/utils/supabase";
import {
  User,
  AuthState,
  LoginCredentials,
  RegisterCredentials,
  AuthError,
} from "@/types/auth";

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Flag pro sledování probíhajícího login procesu
  const isLoggingInRef = useRef(false);
  
  // Debug logování pro diagnostiku
  useEffect(() => {
    console.log("[useAuth] Loading stav změněn:", loading, "User:", user ? "přihlášen" : "nepřihlášen", "isLoggingIn:", isLoggingInRef.current);
  }, [loading, user]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      // Timeout pro zajištění, že loading se vždy resetuje
      const loadingTimeout = setTimeout(() => {
        if (isMounted) {
          console.warn("[useAuth] Timeout při inicializaci, resetuji loading");
          setLoading(false);
        }
      }, 5000); // 5 sekund timeout

      try {
        // 1) Eager rehydratace z cache (okamžitě, bez čekání na síť)
        const cached = authUtils.getCachedUser();
        if (isMounted && cached) {
          // Vždy zobrazit cached user, i když nemá nickname - UI musí fungovat
          setUser(cached);
          setError(null);
          // UI může pokračovat bez čekání na síť
          setLoading(false);
          clearTimeout(loadingTimeout);
          
          // Vždy na pozadí načíst aktualizace z DB (nickname, avatar se mohly změnit)
          // To zajistí, že i po změně profilu se načtou nejnovější data
          console.log("[useAuth] Načítám aktualizace uživatele na pozadí...");
          authUtils.getCurrentUser()
            .then((current) => {
              if (isMounted && current) {
                // Aktualizovat user pouze pokud se data změnila (aby se předešlo zbytečným re-renderům)
                setUser((prev) => {
                  if (!prev || 
                      prev.nickname !== current.nickname || 
                      prev.photoURL !== current.photoURL ||
                      prev.nicknameSlug !== current.nicknameSlug) {
                    return current;
                  }
                  return prev;
                });
              }
            })
            .catch((err) => {
              console.warn("[useAuth] Chyba při načítání aktualizací na pozadí:", err.message);
              // Nechat cached user, UI už funguje
            });
          // Pokud máme cached user, ukončit inicializaci - už jsme nastavili loading na false
          return;
        }

        // 2) Síťové ověření aktuální session u Supabase (pokud nemáme cached user)
        const current = await authUtils.getCurrentUser();
        if (!isMounted) return;
        // Vždy nastavit user, i když je null (pro správné zobrazení)
        setUser(current);
        setError(null);
        clearTimeout(loadingTimeout);
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Chyba při načítání uživatele:", err);
        // Pokud máme cached user, použít ho jako fallback
        const cached = authUtils.getCachedUser();
        if (cached) {
          console.warn("[useAuth] Používám cached user jako fallback po chybě");
          setUser(cached);
          setError(null);
        } else {
          setError(err.message);
          setUser(null);
        }
        clearTimeout(loadingTimeout);
      } finally {
        if (isMounted) {
          console.log("[useAuth] Inicializace dokončena, nastavuji loading na false");
          setLoading(false);
          clearTimeout(loadingTimeout);
        }
      }
    };

    init();

    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      console.log("[useAuth] onAuthStateChange event:", event, "session:", !!session, "isLoggingIn:", isLoggingInRef.current);
      
      // Pokud je to explicitní odhlášení, nastavit user na null
      if (event === "SIGNED_OUT") {
        setUser(null);
        setError(null);
        setLoading(false);
        isLoggingInRef.current = false;
        return;
      }

      // Pokud právě probíhá login, použít cached user okamžitě a neblokovat UI
      // Login funkce už nastavila user a loading, takže jen zajistíme, že loading zůstane false
      if (isLoggingInRef.current && event === "SIGNED_IN") {
        const cached = authUtils.getCachedUser();
        if (cached) {
          console.log("[useAuth] onAuthStateChange během login - používám cached user, loading zůstává false");
          setUser(cached);
          setError(null);
          setLoading(false);
          
          // Na pozadí načíst aktualizace (nickname, avatar z DB)
          authUtils.getCurrentUser()
            .then((current) => {
              if (isMounted && current) {
                setUser(current);
              }
              isLoggingInRef.current = false;
            })
            .catch((err) => {
              console.warn(`[useAuth] onAuthStateChange ${event}: Chyba při načítání aktualizací na pozadí:`, err.message);
              isLoggingInRef.current = false;
            });
          return;
        }
      }

      // Pro všechny eventy kromě SIGNED_OUT použít cached user okamžitě
      // a načíst aktualizace na pozadí, aby se UI neblokovalo
      const cached = authUtils.getCachedUser();
      if (cached) {
        // Okamžitě nastavit cached user, aby UI fungovalo
        setUser(cached);
        setError(null);
        setLoading(false);
        
        // Na pozadí načíst aktualizace (nickname, avatar z DB)
        // NEPOUŽÍVAT await, aby se UI neblokovalo
        authUtils.getCurrentUser()
          .then((current) => {
            if (isMounted && current) {
              setUser(current);
            }
          })
          .catch((err) => {
            console.warn(`[useAuth] onAuthStateChange ${event}: Chyba při načítání aktualizací na pozadí:`, err.message);
            // Nechat cached user, UI už funguje
          });
        return;
      }

      // Pokud nemáme cached user, zkusit načíst z API, ale s timeoutem
      // a nenastavovat loading na true, aby se UI neblokovalo
      try {
        // Použít Promise.race s timeoutem, aby se nečekalo příliš dlouho
        const timeoutPromise = new Promise<null>((resolve) => 
          setTimeout(() => resolve(null), 3000)
        );
        
        const currentPromise = authUtils.getCurrentUser();
        const current = await Promise.race([currentPromise, timeoutPromise]);
        
        if (!isMounted) return;
        
        if (current) {
          setUser(current);
          setError(null);
        } else {
          // Timeout - použít null user, ale neblokovat UI
          console.warn(`[useAuth] onAuthStateChange ${event}: Timeout při načítání uživatele`);
          setUser(null);
          setError(null);
        }
        setLoading(false);
      } catch (err: any) {
        if (!isMounted) return;
        
        // Pokud je to chyba o chybějící session, nastavit user na null
        const errorMsg = (err.message || "").toLowerCase();
        if (errorMsg.includes("auth session missing") || errorMsg.includes("session")) {
          // Zkontrolovat, jestli skutečně není session
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData.session) {
              setUser(null);
              setError(null);
              setLoading(false);
              return;
            }
          } catch {
            // Pokud ani getSession nefunguje, nastavit na null
            setUser(null);
            setError(null);
            setLoading(false);
            return;
          }
        }
        
        // Pro síťové chyby nebo timeout nastavit na null, ale neblokovat UI
        console.warn(`[useAuth] onAuthStateChange ${event}: Chyba při načítání uživatele:`, err.message);
        setError(err.message);
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    let loginTimeout: NodeJS.Timeout | null = null;
    try {
      console.log("[useAuth] Login začíná, nastavuji loading na true a isLoggingIn flag");
      setError(null);
      setLoading(true);
      isLoggingInRef.current = true;
      
      // Timeout pro zajištění, že loading se vždy resetuje
      loginTimeout = setTimeout(() => {
        console.warn("[useAuth] Timeout při login, resetuji loading");
        setLoading(false);
        isLoggingInRef.current = false;
      }, 15000); // 15 sekund timeout
      
      console.log("[useAuth] Volám authUtils.login...");
      const userData = await authUtils.login(credentials);
      
      // Okamžitě nastavit user a resetovat loading, aby UI mohlo pokračovat
      // onAuthStateChange se spustí asynchronně a může načíst aktualizace na pozadí
      if (loginTimeout) {
        clearTimeout(loginTimeout);
        loginTimeout = null;
      }
      console.log("[useAuth] Login úspěšný, nastavuji user a resetuji loading");
      setUser(userData);
      setError(null);
      setLoading(false);
      // isLoggingIn flag se resetuje v onAuthStateChange po načtení aktualizací
    } catch (err: any) {
      if (loginTimeout) {
        clearTimeout(loginTimeout);
        loginTimeout = null;
      }
      console.error("[useAuth] Login selhal:", err.message);
      setError(err.message);
      setLoading(false);
      isLoggingInRef.current = false;
      throw err;
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      setError(null);
      setLoading(true);
      const userData = await authUtils.register(credentials);
      setUser(userData);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await authUtils.logout();
    } catch (err: any) {
      console.warn("logout error:", err?.message || err);
    } finally {
      // Vynutit lokální odhlášení za každých okolností
      setUser(null);
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      // Vymazat cache před načtením, aby se načetla aktuální data z databáze
      authUtils.clearCachedUser();
      const current = await authUtils.getCurrentUser();
      setUser(current);
      setError(null);
    } catch (err: any) {
      console.error("Chyba při aktualizaci uživatele:", err);
      setError(err.message);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
