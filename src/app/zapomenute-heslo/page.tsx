"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabase/client";
import AuthShell from "@/components/auth/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const toast = useToast();

  // Shared input class for consistency
  const inputClass = "appearance-none block w-full px-4 py-3 bg-white/7 border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-travel-300/40 focus:border-travel-300/40 sm:text-sm backdrop-blur-sm transition-all duration-200";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccess(false);

    // Validace emailu
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setLocalError("Email je povinný!");
      return;
    }

    // Validace email formátu
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setLocalError("Neplatný formát emailu!");
      return;
    }

    try {
      setSubmitting(true);

      // Získat redirect URL pro reset hesla
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/obnovit-heslo`
          : undefined;

      // Odeslat email pro reset hesla
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Úspěch - zobrazit zprávu
      setSuccess(true);
      toast.success("Email s instrukcemi pro obnovení hesla byl odeslán.");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Chyba při odesílání emailu";
      toast.error(errorMessage);
      setLocalError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Obnovit heslo"
      subtitle={
        <>
          Zadejte svůj email a pošleme vám instrukce pro obnovení hesla.{" "}
          <Link
            href="/prihlaseni"
            className="font-medium text-green-400 hover:text-green-300 transition-colors"
          >
            Zpět na přihlášení
          </Link>
        </>
      }
    >
      {success ? (
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
                  Email byl odeslán
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    Pokud email <strong>{email}</strong> existuje v našem systému,
                    obdržíte instrukce pro obnovení hesla.
                  </p>
                  <p className="mt-2">
                    Zkontrolujte svou emailovou schránku a klikněte na odkaz v emailu.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              type="button"
              onClick={() => router.push("/prihlaseni")}
              className="w-full cursor-pointer"
            >
              Zpět na přihlášení
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSuccess(false);
                setEmail("");
              }}
              className="w-full cursor-pointer"
            >
              Odeslat znovu
            </Button>
          </div>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <ErrorMessage error={localError} />

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-white/70 mb-1.5"
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
              placeholder="vas@email.cz"
              disabled={submitting}
            />
            <p className="mt-2 text-sm text-gray-500">
              Pošleme vám odkaz pro obnovení hesla na tento email.
            </p>
          </div>

          <div>
            <Button
              type="submit"
              loading={submitting}
              disabled={submitting}
              className="w-full cursor-pointer"
            >
              Odeslat odkaz pro obnovení hesla
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
      )}
    </AuthShell>
  );
}
