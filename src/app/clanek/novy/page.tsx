"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import Lottie from "lottie-react";

export default function NewArticlePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [coverAlt, setCoverAlt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showSubmissionAnimation, setShowSubmissionAnimation] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [travelAnimation, setTravelAnimation] = useState<any>(null);

  // Kontrola přihlášení při načtení stránky
  useEffect(() => {
    if (!authLoading) {
      setCheckingAuth(false);
    }
  }, [authLoading]);

  // Načíst Travel.json animaci
  useEffect(() => {
    fetch("/Travel.json")
      .then((res) => res.json())
      .then((data) => setTravelAnimation(data))
      .catch((err) => console.error("Failed to load Travel.json:", err));
  }, []);

  // Vytvoří/zruší object URL náhledu pro vybraný soubor
  // aby uživatel viděl obrázek ještě před odesláním formuláře.
  React.useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  function getAccessTokenFromStorage(): string | null {
    // Supabase v2 ukládá tokeny do klíčů typu "sb-xxxxx-auth-token" – nemusí obsahovat řetězec "supabase"
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        const lower = key.toLowerCase();
        const looksSupabase =
          lower.includes("supabase") || lower.startsWith("sb-");
        const looksAuth =
          lower.includes("auth") ||
          lower.includes("session") ||
          lower.includes("token");
        if (!looksSupabase || !looksAuth) continue;
        try {
          const value = localStorage.getItem(key);
          if (!value) continue;
          const parsed = JSON.parse(value);
          if (parsed?.access_token) return parsed.access_token;
          if (parsed?.currentSession?.access_token)
            return parsed.currentSession.access_token;
          if (parsed?.session?.access_token) return parsed.session.access_token;
          if (parsed?.accessToken) return parsed.accessToken;
        } catch {
          // Ignorujeme chyby parsování
        }
      }
    } catch (e) {
      console.warn("[new-article] Error reading localStorage:", e);
    }
    return null;
  }

  async function onSubmit(
    e: React.FormEvent,
    submitForApproval: boolean = false
  ) {
    e.preventDefault();
    console.log(
      "[new-article] submit start, submitForApproval:",
      submitForApproval
    );
    if (!title || !content) {
      setError("Vyplňte prosím název a obsah.");
      return;
    }
    if (submitForApproval) {
      setSubmitting(true);
      // Zobrazit animaci hned na začátku
      setShowSubmissionAnimation(true);
      setSubmissionSuccess(false);
    } else {
      setSaving(true);
    }
    setError(null);
    try {
      console.log("[new-article] getting session...");

      // Zkusíme získat token z localStorage (rychlejší a spolehlivější)
      let accessToken: string | null = getAccessTokenFromStorage();
      console.log("[new-article] token from storage:", !!accessToken);

      // Pokud není v localStorage, zkusíme getSession s timeoutem
      if (!accessToken) {
        try {
          const sessionResult = await Promise.race([
            supabase.auth.getSession(),
            new Promise<{ data: { session: any } }>((resolve) =>
              setTimeout(
                () => resolve({ data: { session: null } } as any),
                3000
              )
            ),
          ]);
          accessToken = sessionResult?.data?.session?.access_token || null;
          console.log("[new-article] token from getSession:", !!accessToken);
        } catch (err) {
          console.warn("[new-article] getSession error:", err);
        }
      }

      // Pokud stále nemáme token, zkusíme getUser
      if (!accessToken) {
        try {
          const userResult = await Promise.race([
            supabase.auth.getUser(),
            new Promise<{ data: { user: any } }>((resolve) =>
              setTimeout(() => resolve({ data: { user: null } } as any), 3000)
            ),
          ]);
          // getUser nevrací token přímo, ale můžeme zkusit znovu getSession
          if (userResult?.data?.user) {
            const sessionResult = await supabase.auth.getSession();
            accessToken = sessionResult?.data?.session?.access_token || null;
            console.log("[new-article] token after getUser:", !!accessToken);
          }
        } catch (err) {
          console.warn("[new-article] getUser error:", err);
        }
      }

      console.log("[new-article] final token:", !!accessToken);

      // Pokud není token, zkusíme ještě jednou získat session
      if (!accessToken) {
        setSaving(false);
        setError(
          "Nepodařilo se získat autentizační token. Zkuste to prosím znovu nebo se přihlaste."
        );
        return;
      }

      const headers: HeadersInit = {
        "content-type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      };
      // volitelně nahrajeme cover na náš server -> Cloudinary
      let coverPayload:
        | {
            main_image_url: string;
            main_image_public_id: string;
            main_image_width?: number;
            main_image_height?: number;
            main_image_alt?: string;
          }
        | {} = {};
      if (file) {
        console.log("[new-article] uploading cover file:", {
          name: file.name,
          type: file.type,
          size: file.size,
        });
        const form = new FormData();
        form.append("file", file);
        form.append("folder", "destinote_articles");
        const uploadRes = await fetch("/api/images/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: form,
        });
        console.log("[new-article] upload status:", uploadRes.status);
        if (!uploadRes.ok) {
          const d = await uploadRes.json().catch(() => ({}));
          console.error("[new-article] upload error:", d);
          throw new Error(d.error || "Nahrání obrázku selhalo");
        }
        const data = (await uploadRes.json()) as {
          url: string;
          public_id: string;
          width?: number;
          height?: number;
        };
        console.log("[new-article] upload ok:", {
          url: data.url,
          public_id: data.public_id,
          width: data.width,
          height: data.height,
        });
        coverPayload = {
          main_image_url: data.url,
          main_image_public_id: data.public_id,
          ...(data.width ? { main_image_width: data.width } : {}),
          ...(data.height ? { main_image_height: data.height } : {}),
          ...(coverAlt ? { main_image_alt: coverAlt } : {}),
        };
      }
      console.log(
        "[new-article] Sending request to /api/articles with payload:",
        {
          hasTitle: !!title,
          hasContent: !!content,
          hasSummary: !!summary,
          hasCover: !!coverPayload && Object.keys(coverPayload).length > 0,
        }
      );

      const res = await fetch("/api/articles", {
        method: "POST",
        headers,
        body: JSON.stringify({ title, summary, content, ...coverPayload }),
      });

      console.log("[new-article] create status:", res.status);
      console.log(
        "[new-article] response headers:",
        Object.fromEntries(res.headers.entries())
      );

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        let errorData: any = {};
        try {
          if (errorText && errorText.trim()) {
            errorData = JSON.parse(errorText);
          }
        } catch {
          // Pokud není validní JSON, použijeme text jako chybu
          if (errorText && errorText.trim() && errorText !== "Unknown error") {
            errorData = { error: errorText };
          }
        }
        console.error("[new-article] create error:", {
          status: res.status,
          statusText: res.statusText,
          errorData,
          errorText,
        });
        const errorMessage =
          errorData?.error ||
          errorText ||
          `Chyba při vytváření článku (${res.status} ${res.statusText})`;
        throw new Error(errorMessage);
      }

      const data = (await res.json()) as { id: string; slug: string };
      console.log(
        "[new-article] created successfully, id:",
        data.id,
        "slug:",
        data.slug
      );

      // Pokud uživatel klikl na "Odeslat ke schválení", změníme status na pending
      if (submitForApproval) {
        const animationStartTime = Date.now();
        const minAnimationDuration = 7000; // Minimálně 7 sekund (délka animace)

        try {
          const submitRes = await fetch(`/api/articles/${data.id}/submit`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          if (!submitRes.ok) {
            const errorData = await submitRes.json().catch(() => ({}));
            throw new Error(
              errorData.error || "Nepodařilo se odeslat ke schválení"
            );
          }
          console.log("[new-article] Article submitted for approval");

          // Počkat, aby animace dojela do konce (minimálně 7 sekund od začátku)
          const elapsedTime = Date.now() - animationStartTime;
          const remainingTime = Math.max(0, minAnimationDuration - elapsedTime);

          await new Promise((resolve) => setTimeout(resolve, remainingTime));

          // Schovat animaci a zobrazit zprávu s tlačítkem
          setShowSubmissionAnimation(false);
          setShowSuccessMessage(true);
        } catch (submitErr: any) {
          console.error("[new-article] Submit error:", submitErr);
          // Skrýt animaci a zobrazit chybu
          setShowSubmissionAnimation(false);
          setError(
            `Článek byl vytvořen, ale nepodařilo se ho odeslat ke schválení: ${submitErr.message}`
          );
          if (submitForApproval) {
            setSubmitting(false);
          } else {
            setSaving(false);
          }
          return;
        }
      } else {
        // Pokud jen ukládáme jako koncept, přesměrujeme normálně
        router.push("/community");
      }
    } catch (err: any) {
      console.error("[new-article] submit error:", err?.message, err);
      // Skrýt animaci pokud byla zobrazená
      if (showSubmissionAnimation) {
        setShowSubmissionAnimation(false);
      }
      setError(err.message || "Neznámá chyba");
    } finally {
      if (submitForApproval) {
        // submitting se nastaví na false až po přesměrování nebo chybě
        // pokud je animace zobrazená a úspěšná, submitting zůstane true až do přesměrování
        if (!showSubmissionAnimation || !submissionSuccess) {
          setSubmitting(false);
        }
      } else {
        setSaving(false);
      }
      console.log("[new-article] submit done");
    }
  }

  // Zobrazit loading při kontrole autentizace
  if (checkingAuth || authLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Nový článek</h1>
        <div className="text-center py-12">
          <p className="text-gray-600">Kontroluji přihlášení...</p>
        </div>
      </div>
    );
  }

  // Pokud uživatel není přihlášen, zobrazit zprávu
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Nový článek</h1>
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Pro vytvoření článku se musíte přihlásit
            </h2>
            <p className="text-gray-600">
              Přihlaste se prosím, abyste mohli vytvořit nový článek.
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <Link href="/auth/login?redirect=/clanek/novy">
                <Button>Přihlásit se</Button>
              </Link>
              <Link href="/auth/register?redirect=/clanek/novy">
                <Button variant="outline">Registrovat se</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pokud je uživatel přihlášen, zobrazit formulář
  return (
    <>
      {/* Overlay s animací při odesílání */}
      {showSubmissionAnimation && travelAnimation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 max-w-md w-full mx-4">
            <div className="w-64 h-64">
              <Lottie
                animationData={travelAnimation}
                loop={!submissionSuccess}
                autoplay={true}
              />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Odesílání...
            </h2>
          </div>
        </div>
      )}

      {/* Overlay se zprávou o úspěchu */}
      {showSuccessMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 max-w-md w-full mx-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-2">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Odesláno ke schválení
            </h2>
            <p className="text-gray-600 text-center">
              Váš článek byl úspěšně odeslán a čeká na schválení.
            </p>
            <Button
              onClick={() => {
                const userNickname =
                  user?.nicknameSlug || user?.nickname || "smejd";
                router.push(`/profil/${userNickname}?tab=articles`);
              }}
              className="mt-4"
            >
              Ok
            </Button>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Nový článek</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Název <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Např. Můj výlet do Peru"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Perex (volitelné)
            </label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Krátké uvedení článku"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Obsah <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2"
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Text článku..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cover image (volitelné)
            </label>
            <div className="mt-1 flex items-start gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
              />
            </div>
            {previewUrl && (
              <div className="mt-3">
                <div className="relative w-full max-w-xl aspect-[16/9] overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={coverAlt || file?.name || "Náhled"}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}
            <input
              type="text"
              className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2 text-sm"
              value={coverAlt}
              onChange={(e) => setCoverAlt(e.target.value)}
              placeholder="Alt text (popis obrázku)"
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving || submitting}
            >
              Zrušit
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={(e) => onSubmit(e, false)}
              loading={saving}
              disabled={saving || submitting}
            >
              {saving ? "Ukládám..." : "Uložit jako koncept"}
            </Button>
            <Button
              type="button"
              onClick={(e) => onSubmit(e, true)}
              loading={submitting}
              disabled={saving || submitting}
            >
              {submitting ? "Odesílám..." : "Odeslat ke schválení"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
