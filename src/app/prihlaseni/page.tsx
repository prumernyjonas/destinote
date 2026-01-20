"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useToast } from "@/components/ui/Toast";
import { LuEye, LuEyeOff } from "react-icons/lu";
import { authUtils } from "@/utils/supabase";
import { useSearchParams } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const { login, loading: authLoading, error, user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const isMountedRef = useRef(true);
  const toastShownRef = useRef<string | null>(null);
  
  // Na login stránce ignorujeme authLoading pokud uživatel není přihlášen
  // (protože na login stránce nepotřebujeme čekat na načtení uživatele)
  const loading = user ? authLoading : false;
  
  // Debug logování pro diagnostiku
  useEffect(() => {
    console.log("[LoginPage] Debug stav:", {
      submitting,
      loading,
      authLoading,
      user: user ? "přihlášen" : "nepřihlášen",
      disabled: submitting || loading,
    });
  }, [submitting, loading, authLoading, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    console.log("[LoginPage] handleSubmit začíná, nastavuji submitting na true");
    setSubmitting(true);

    // Timeout pro zajištění, že submitting se vždy resetuje
    const submittingTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        console.warn("[LoginPage] Timeout při přihlášení, resetuji submitting");
        setSubmitting(false);
        toast.error("Přihlášení trvá příliš dlouho. Zkuste to prosím znovu.");
      }
    }, 10000); // 10 sekund timeout

    try {
      console.log("[LoginPage] Volám login funkci...");
      await login({ email, password });
      clearTimeout(submittingTimeout);
      console.log("[LoginPage] Login úspěšný");
      if (isMountedRef.current) {
        toast.success("Přihlášení proběhlo úspěšně.");
        // Přesměrování proběhne automaticky přes useEffect, který sleduje změnu user
        // submitting se resetuje v useEffect, když se user nastaví
        // Pro jistotu přidáme timeout, aby se submitting resetoval i když se user nenastaví
        setTimeout(() => {
          if (isMountedRef.current && !user) {
            console.log("[LoginPage] Timeout: resetuji submitting na false (user se nenastavil)");
            setSubmitting(false);
          }
        }, 2000);
      }
    } catch (err: unknown) {
      clearTimeout(submittingTimeout);
      console.error("[LoginPage] Login selhal:", err);
      if (isMountedRef.current) {
        toast.error(err instanceof Error ? err.message : "Chyba při přihlášení");
        setLocalError(err instanceof Error ? err.message : "Neznámá chyba");
        setSubmitting(false);
      }
    } finally {
      // Zajistit, že timeout se vždy vyčistí
      clearTimeout(submittingTimeout);
    }
  };

  // Načtení chybové zprávy z query parametru po mountu
  // (vyhneme se změnám stavu během renderu pro SSR/CSR shodu)
  useEffect(() => {
    const err = searchParams?.get("error");
    if (err && toastShownRef.current !== `error-${err}`) {
      setLocalError(err);
      toast.error(err);
      toastShownRef.current = `error-${err}`;
    }
    const message = searchParams?.get("message");
    if (message === "email-confirmation" && toastShownRef.current !== "email-confirmation") {
      toast.success("Zkontrolujte svůj email a potvrďte registraci kliknutím na odkaz v emailu.");
      toastShownRef.current = "email-confirmation";
    }
    if (message === "password-reset-success" && toastShownRef.current !== "password-reset-success") {
      toast.success("Heslo bylo úspěšně změněno. Nyní se můžete přihlásit.");
      toastShownRef.current = "password-reset-success";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Pokud je uživatel již přihlášen (např. po návratu z OAuth), přesměruj podle redirect parametru
  useEffect(() => {
    if (user) {
      console.log("[LoginPage] User je přihlášen, resetuji submitting a přesměrovávám");
      // Resetovat submitting stav, pokud je uživatel přihlášen
      if (isMountedRef.current) {
        setSubmitting(false);
      }
      const redirect = searchParams?.get("redirect");
      const redirectPath = redirect && redirect.startsWith("/") ? redirect : "/";
      router.replace(redirectPath);
    }
  }, [user, router, searchParams]);

  // Cleanup při unmountu
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setLocalError(null);
      setGoogleLoading(true);
      await authUtils.loginWithGoogle();
      // proběhne redirect na Google, poté zpět na /auth/callback
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Chyba při přihlášení přes Google";
      toast.error(message);
      setLocalError(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Shared input class for consistency
  const inputClass = "appearance-none block w-full px-4 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white transition-colors";

  return (
    <AuthShell
      title="Přihlaste se"
      subtitle={
        <>
          Nebo{" "}
          <Link
            href="/registrace"
            className="font-medium text-green-400 hover:text-green-300 transition-colors"
          >
            si vytvořte nový účet
          </Link>
        </>
      }
    >
      <ErrorMessage error={error || localError} />
      <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="jan.novak@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Heslo
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  placeholder="••••••••••••"
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

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900 cursor-pointer"
                >
                  Zapamatovat si mě
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/zapomenute-heslo"
                  className="font-medium text-green-600 hover:text-green-500 transition-colors"
                >
                  Zapomněli jste heslo?
                </Link>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                loading={submitting || loading}
                disabled={submitting || loading}
                className="w-full cursor-pointer"
              >
                Přihlásit se
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/95 backdrop-blur text-gray-500">
                  Nebo pokračujte s
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                loading={googleLoading}
                className="w-full cursor-pointer"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {googleLoading ? "Přesměrování..." : "Přihlásit přes Google"}
              </Button>
            </div>
          </div>
    </AuthShell>
  );
}
