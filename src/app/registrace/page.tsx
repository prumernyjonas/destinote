"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useToast } from "@/components/ui/Toast";
import { validatePasswordStrength } from "@/utils/password";
import { authUtils } from "@/utils/supabase";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nickname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [nicknameChecking, setNicknameChecking] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(
    null
  );
  const { register, loading, error } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validace přezdívky
    const trimmedNickname = formData.nickname.trim();
    if (!trimmedNickname) {
      setLocalError("Přezdívka je povinná!");
      return;
    }
    if (trimmedNickname.length < 3) {
      setLocalError("Přezdívka musí mít alespoň 3 znaky!");
      return;
    }
    if (trimmedNickname.length > 30) {
      setLocalError("Přezdívka může mít maximálně 30 znaků!");
      return;
    }
    // Povolené znaky: písmena (včetně diakritiky), čísla, pomlčky, podtržítka
    // Povolujeme Unicode písmena (včetně českých znaků), čísla, pomlčky a podtržítka
    if (!/^[\p{L}\p{N}_-]+$/u.test(trimmedNickname)) {
      setLocalError(
        "Přezdívka může obsahovat pouze písmena (včetně diakritiky), čísla, pomlčky a podtržítka!"
      );
      return;
    }

    // Kontrola, zda nickname už existuje (podle slugifikované verze)
    try {
      setNicknameChecking(true);
      const response = await fetch(
        `/api/users/check-nickname?nickname=${encodeURIComponent(
          trimmedNickname
        )}`
      );
      const data = await response.json();

      if (!data.available) {
        setLocalError(
          data.message ||
            `Přezdívka "${trimmedNickname}" je již obsazena. Zkuste jinou přezdívku.`
        );
        setNicknameAvailable(false);
        setNicknameChecking(false);
        return;
      }
      setNicknameAvailable(true);
    } catch (err) {
      console.error("Chyba při kontrole nicknamu:", err);
      // Pokračujeme i při chybě - kontrola se provede i na backendu
    } finally {
      setNicknameChecking(false);
    }

    const strengthError = validatePasswordStrength(formData.password);
    if (strengthError) {
      setLocalError(strengthError);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError("Hesla se neshodují!");
      return;
    }

    try {
      await register({
        ...formData,
        nickname: trimmedNickname,
      });
      // Toto by se nemělo stát, protože register vyhodí chybu pokud není potvrzený email
      toast.success("Registrace proběhla úspěšně.");
      router.push("/");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Chyba při registraci";

      // Pokud je to zpráva o potvrzení emailu, přesměruj na login stránku (ta zobrazí zprávu)
      if (
        errorMessage.includes("potvrďte registraci") ||
        errorMessage.includes("zkontrolujte svůj email")
      ) {
        setLocalError(null);
        // Okamžitě přesměruj na login stránku
        router.push("/prihlaseni?message=email-confirmation");
      } else {
        toast.error(errorMessage);
        setLocalError(errorMessage);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: newValue,
    });

    // Resetovat stav dostupnosti nicknamu při změně
    if (e.target.name === "nickname") {
      setNicknameAvailable(null);
      setLocalError(null);
    }
  };

  // Debounced kontrola nicknamu při psaní
  useEffect(() => {
    const trimmedNickname = formData.nickname.trim();

    // Kontrolovat pouze pokud je nickname dostatečně dlouhý a validní
    if (
      trimmedNickname.length >= 3 &&
      /^[\p{L}\p{N}_-]+$/u.test(trimmedNickname)
    ) {
      const timeoutId = setTimeout(async () => {
        try {
          setNicknameChecking(true);
          const response = await fetch(
            `/api/users/check-nickname?nickname=${encodeURIComponent(
              trimmedNickname
            )}`
          );
          const data = await response.json();
          setNicknameAvailable(data.available);
          if (!data.available && formData.nickname === trimmedNickname) {
            setLocalError(
              data.message || `Přezdívka "${trimmedNickname}" je již obsazena.`
            );
          } else if (data.available && formData.nickname === trimmedNickname) {
            setLocalError(null);
          }
        } catch (err) {
          console.error("Chyba při kontrole nicknamu:", err);
        } finally {
          setNicknameChecking(false);
        }
      }, 500); // Debounce 500ms

      return () => clearTimeout(timeoutId);
    } else {
      setNicknameAvailable(null);
    }
  }, [formData.nickname]);

  return (
    <div className="min-h-screen relative flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Dark blue background gradient */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          background: 'linear-gradient(135deg, rgb(15, 30, 75) 0%, rgb(28, 57, 142) 50%, rgb(20, 40, 100) 100%)',
        }}
      />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Registrujte se</h2>
          <p className="mt-2 text-sm text-white/80">
            Nebo{" "}
            <Link
              href="/prihlaseni"
              className="font-medium text-green-400 hover:text-green-300"
            >
              se přihlaste do existujícího účtu
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur border border-white/15 shadow-xl py-8 px-4 sm:rounded-2xl sm:px-10">
          <ErrorMessage error={error || localError} />
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="nickname"
                className="block text-sm font-medium text-gray-700"
              >
                Přezdívka
              </label>
              <div className="mt-1 relative">
                <input
                  id="nickname"
                  name="nickname"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.nickname}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white ${
                    nicknameAvailable === true
                      ? "border-green-500"
                      : nicknameAvailable === false
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="CestovatelSvetem"
                />
                {nicknameChecking && (
                  <div className="absolute right-3 top-2.5">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  </div>
                )}
                {!nicknameChecking && nicknameAvailable === true && (
                  <div className="absolute right-3 top-2.5 text-green-500">
                    ✓
                  </div>
                )}
                {!nicknameChecking && nicknameAvailable === false && (
                  <div className="absolute right-3 top-2.5 text-red-500">✗</div>
                )}
              </div>
              {nicknameAvailable === false &&
                formData.nickname.trim().length >= 3 && (
                  <p className="mt-1 text-sm text-red-600">
                    Tato přezdívka je již obsazena (včetně variant s diakritikou
                    a velkými písmeny)
                  </p>
                )}
              {nicknameAvailable === true &&
                formData.nickname.trim().length >= 3 && (
                  <p className="mt-1 text-sm text-green-600">
                    Přezdívka je dostupná
                  </p>
                )}
            </div>

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
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white"
                  placeholder="vas@email.cz"
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
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white"
                  placeholder="Minimálně 8 znaků"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Potvrdit heslo
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white"
                  placeholder="Zadejte heslo znovu"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label
                htmlFor="terms"
                className="ml-2 block text-sm text-gray-900"
              >
                Souhlasím s{" "}
                <a href="#" className="text-green-600 hover:text-green-500">
                  podmínkami použití
                </a>{" "}
                a{" "}
                <a href="#" className="text-green-600 hover:text-green-500">
                  zásadami ochrany osobních údajů
                </a>
              </label>
            </div>

            <div>
              <Button
                type="submit"
                loading={loading}
                disabled={loading}
                className="w-full"
              >
                Vytvořit účet
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
              <button
                type="button"
                onClick={async () => {
                  try {
                    await authUtils.loginWithGoogle();
                  } catch (err: any) {
                    toast.error(
                      err.message || "Chyba při přihlášení přes Google"
                    );
                  }
                }}
                className="w-full inline-flex items-center justify-center py-2 px-4 border border-white/15 rounded-xl shadow-sm bg-white/95 backdrop-blur text-sm font-medium text-gray-700 hover:bg-white transition-colors cursor-pointer"
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
                <span>Přihlásit přes Google</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
