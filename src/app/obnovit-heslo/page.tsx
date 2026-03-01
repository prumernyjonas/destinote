"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabase/client";
import { LuEye, LuEyeOff } from "react-icons/lu";
import { validatePasswordStrength } from "@/utils/password";
import AuthShell from "@/components/auth/AuthShell";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();

  // Shared input class for consistency
  const inputClass = "appearance-none block w-full px-4 py-3 bg-white/7 border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-travel-300/40 focus:border-travel-300/40 sm:text-sm backdrop-blur-sm transition-all duration-200";

  // Zkontrolovat, zda je token validní při načtení stránky
  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        // Nejdřív zkusit načíst session z URL hash (Supabase to tam ukládá při redirectu)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        // Pokud máme tokeny v hash, nastavit session
        if (accessToken && refreshToken && type === "recovery") {
          const { error: setSessionError, data: sessionData } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!mounted) return;

          if (setSessionError) {
            if (process.env.NODE_ENV === "development") {
              console.error("Chyba při nastavení session:", setSessionError);
            }
            setIsValidToken(false);
            setLocalError(setSessionError.message || "Neplatný nebo expirovaný odkaz pro obnovení hesla.");
            return;
          }

          if (sessionData?.session) {
            // Vyčistit hash z URL
            window.history.replaceState(null, "", window.location.pathname);
            setIsValidToken(true);
            return;
          }
        }

        // Pokud nemáme tokeny v hash, zkusit načíst existující session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          if (process.env.NODE_ENV === "development") {
            console.error("Chyba při načítání session:", error);
          }
          setIsValidToken(false);
          setLocalError("Neplatný nebo expirovaný odkaz pro obnovení hesla.");
          return;
        }

        // Pokud máme session, token je validní
        if (session) {
          setIsValidToken(true);
        } else {
          // Zkusit zkontrolovat, zda je to recovery flow pomocí code parametru
          const code = searchParams?.get("code");
          if (code) {
            // Code se musí zpracovat na serveru, takže přesměrujeme na callback
            router.replace(`/auth/callback?code=${code}&type=recovery`);
            return;
          }

          setIsValidToken(false);
          setLocalError("Neplatný nebo expirovaný odkaz pro obnovení hesla. Požádejte o nový odkaz.");
        }
      } catch (err: any) {
        if (!mounted) return;
        if (process.env.NODE_ENV === "development") {
          console.error("Chyba při ověřování odkazu:", err);
        }
        setIsValidToken(false);
        setLocalError(err?.message || "Chyba při ověřování odkazu.");
      }
    };

    // Nastavit listener pro auth state changes (Supabase může automaticky zpracovat hash)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        // Vyčistit hash z URL
        if (window.location.hash) {
          window.history.replaceState(null, "", window.location.pathname);
        }
        setIsValidToken(true);
      }
    });

    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validace hesla
    const strengthError = validatePasswordStrength(password);
    if (strengthError) {
      setLocalError(strengthError);
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Hesla se neshodují!");
      return;
    }

    try {
      setSubmitting(true);

      // Nejdřív zkontrolovat, zda máme validní session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        if (process.env.NODE_ENV === "development") {
          console.error("Session error:", sessionError);
        }
        throw new Error(sessionError.message || "Neplatná session. Prosím, použijte odkaz z emailu znovu.");
      }

      if (!session) {
        throw new Error("Neplatná session. Prosím, použijte odkaz z emailu znovu.");
      }

      // Aktualizovat heslo
      const { error, data } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Chyba při aktualizaci hesla:", error);
        }
        // Zobrazit detailnější chybovou zprávu
        let errorMessage = error.message || "Chyba při změně hesla";
        
        // Přeložit běžné chyby
        if (error.status === 422) {
          errorMessage = "Neplatná session nebo expirovaný token. Požádejte o nový odkaz pro obnovení hesla.";
        } else if (error.message?.includes("session")) {
          errorMessage = "Session expirovala. Požádejte o nový odkaz pro obnovení hesla.";
        }
        
        throw new Error(errorMessage);
      }

      // Úspěch
      setSuccess(true);
      toast.success("Heslo bylo úspěšně změněno.");

      // Po 2 sekundách přesměrovat na login
      setTimeout(() => {
        router.push("/prihlaseni?message=password-reset-success");
      }, 2000);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Chyba při změně hesla";
      toast.error(errorMessage);
      setLocalError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (isValidToken === null) {
    // Načítání - kontrola tokenu
    return (
      <AuthShell
        title="Obnovit heslo"
        subtitle="Ověřování odkazu..."
      >
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-sm text-white/50">Ověřování odkazu...</p>
        </div>
      </AuthShell>
    );
  }

  if (isValidToken === false) {
    // Neplatný token
    return (
      <AuthShell
        title="Neplatný odkaz"
        subtitle={
          <>
            Odkaz pro obnovení hesla je neplatný nebo expirovaný.{" "}
            <Link
              href="/zapomenute-heslo"
              className="font-medium text-travel-100 hover:text-white transition-colors"
            >
              Požádejte o nový odkaz
            </Link>
          </>
        }
      >
        <ErrorMessage error={localError} />
        <div className="space-y-4">
          <p className="text-sm text-white/50">
            Odkaz pro obnovení hesla mohl expirovat nebo byl již použit. 
            Požádejte o nový odkaz pro obnovení hesla.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              onClick={() => router.push("/zapomenute-heslo")}
              className="w-full cursor-pointer"
            >
              Požádat o nový odkaz
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/prihlaseni")}
              className="w-full cursor-pointer"
            >
              Zpět na přihlášení
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  if (success) {
    // Úspěch
    return (
      <AuthShell
        title="Heslo bylo změněno"
        subtitle="Vaše heslo bylo úspěšně změněno."
      >
        <div className="space-y-6">
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Heslo bylo úspěšně změněno
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Nyní se můžete přihlásit s novým heslem.</p>
                </div>
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => router.push("/prihlaseni")}
            className="w-full cursor-pointer"
          >
            Přihlásit se
          </Button>
        </div>
      </AuthShell>
    );
  }

  // Formulář pro zadání nového hesla
  return (
    <AuthShell
      title="Nastavit nové heslo"
      subtitle="Zadejte nové heslo pro svůj účet"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <ErrorMessage error={localError} />

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-white/70 mb-1.5"
          >
            Nové heslo
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-10`}
              placeholder="Minimálně 8 znaků"
              disabled={submitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors cursor-pointer"
              aria-label={showPassword ? "Skrýt heslo" : "Zobrazit heslo"}
              title={showPassword ? "Skrýt heslo" : "Zobrazit heslo"}
            >
              {showPassword ? (
                <LuEyeOff className="h-5 w-5" />
              ) : (
                <LuEye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-white/70 mb-1.5"
          >
            Potvrdit nové heslo
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`${inputClass} pr-10`}
              placeholder="Zadejte heslo znovu"
              disabled={submitting}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors cursor-pointer"
              aria-label={showConfirmPassword ? "Skrýt heslo" : "Zobrazit heslo"}
              title={showConfirmPassword ? "Skrýt heslo" : "Zobrazit heslo"}
            >
              {showConfirmPassword ? (
                <LuEyeOff className="h-5 w-5" />
              ) : (
                <LuEye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            loading={submitting}
            disabled={submitting}
            className="w-full cursor-pointer"
          >
            Nastavit nové heslo
          </Button>
        </div>

        <div className="text-center">
          <Link
            href="/prihlaseni"
            className="text-sm font-medium text-travel-100 hover:text-white transition-colors"
          >
            Zpět na přihlášení
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
