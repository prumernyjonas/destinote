"use client";

// hooks/useAuth.ts
import {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        // 1) Eager rehydratace z cache (okamžitě, bez čekání na síť)
        const cached = authUtils.getCachedUser();
        if (isMounted && cached) {
          setUser(cached);
          // UI může pokračovat bez čekání na síť
          setLoading(false);
        }

        // 2) Síťové ověření aktuální session u Supabase
        const current = await authUtils.getCurrentUser();
        if (!isMounted) return;
        setUser(current);
        setError(null);
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Chyba při načítání uživatele:", err);
        setError(err.message);
        setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    const { data: subscription } = supabase.auth.onAuthStateChange(async () => {
      try {
        const current = await authUtils.getCurrentUser();
        if (!isMounted) return;
        setUser(current);
        setError(null);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message);
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setError(null);
      setLoading(true);
      const userData = await authUtils.login(credentials);
      setUser(userData);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
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

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
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
