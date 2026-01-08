"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useToast } from "@/components/ui/Toast";
import { LuEye, LuEyeOff } from "react-icons/lu";
import { authUtils } from "@/utils/supabase";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const { login, loading, error, user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    try {
      setSubmitting(true);
      await login({ email, password });
      toast.success("Přihlášení proběhlo úspěšně.");
      
      // Zkontroluj redirect parametr z URL
      const redirect = searchParams?.get("redirect");
      const redirectPath = redirect && redirect.startsWith("/") ? redirect : "/";
      router.replace(redirectPath);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Chyba při přihlášení");
      setLocalError(err instanceof Error ? err.message : "Neznámá chyba");
    } finally {
      setSubmitting(false);
    }
  };

  // Načtení chybové zprávy z query parametru po mountu
  // (vyhneme se změnám stavu během renderu pro SSR/CSR shodu)
  useEffect(() => {
    const err = searchParams?.get("error");
    if (err) {
      setLocalError(err);
      toast.error(err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Pokud je uživatel již přihlášen (např. po návratu z OAuth), přesměruj podle redirect parametru
  useEffect(() => {
    if (user) {
      const redirect = searchParams?.get("redirect");
      const redirectPath = redirect && redirect.startsWith("/") ? redirect : "/";
      router.replace(redirectPath);
    }
  }, [user, router, searchParams]);

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Přihlaste se</h1>
          <p className="mt-2 text-sm text-gray-600">
            Nebo{" "}
            <Link
              href="/auth/register"
              className="font-medium text-green-600 hover:text-green-500"
            >
              si vytvořte nový účet
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <ErrorMessage error={error || localError} />
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="jan.novak@email.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Heslo
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm pr-10"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
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
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Zapamatovat si mě
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-green-600 hover:text-green-500"
                >
                  Zapomněli jste heslo?
                </a>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                loading={submitting}
                disabled={submitting}
                className="w-full"
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
                <span className="px-2 bg-white text-gray-500">
                  Nebo pokračujte s
                </span>
              </div>
            </div>

            <div className="mt-6 gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Přihlásit se pomocí Google</span>
                <p>{googleLoading ? "Přesměrování..." : "Google"}</p>
                <svg className="h-5 w-5 ml-1" viewBox="0 0 24 24">
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
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
