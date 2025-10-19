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
    try {
      setError(null);
      await authUtils.logout();
      setUser(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
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
