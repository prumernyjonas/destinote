"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import Lottie from "lottie-react";
import { slugifyNickname } from "@/utils/slugify";
import { getAccessToken } from "@/lib/articles/authUtils";
import {
  uploadImages,
  setArticleCover,
  addPhotoToGallery,
  type UploadedPhoto,
} from "@/lib/articles/imageUtils";
import { ArticleFormFields } from "@/components/articles/ArticleFormFields";
import { ImageUploadButton } from "@/components/articles/ImageUploadButton";
import { ArticleImageGallery } from "@/components/articles/ArticleImageGallery";

export default function NewArticlePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [coverAlt, setCoverAlt] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<Array<{ file: File; preview: string }>>([]);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showSubmissionAnimation, setShowSubmissionAnimation] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [travelAnimation, setTravelAnimation] = useState<any>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<string>("");
  const [countries, setCountries] = useState<Array<{ id: string; name: string; iso_code: string }>>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);

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

  // Načíst seznam zemí
  useEffect(() => {
    const loadCountries = async () => {
      setLoadingCountries(true);
      try {
        const res = await fetch("/api/countries/list");
        if (res.ok) {
          const data = await res.json();
          if (data.ok && Array.isArray(data.data)) {
            setCountries(data.data);
          }
        }
      } catch (err) {
        console.error("Chyba při načítání zemí:", err);
      } finally {
        setLoadingCountries(false);
      }
    };
    loadCountries();
  }, []);

  // Preview pro galerii obrázků
  React.useEffect(() => {
    const previews: Array<{ file: File; preview: string }> = [];
    galleryFiles.forEach((file) => {
      const url = URL.createObjectURL(file);
      previews.push({ file, preview: url });
    });
    setGalleryPreviews(previews);

    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.preview));
    };
  }, [galleryFiles]);


  async function onSubmit(
    e: React.SyntheticEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>,
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

      // Získat token
      const accessToken = await getAccessToken();
      console.log("[new-article] final token:", !!accessToken);

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
      
      let coverPayload:
        | {
            main_image_url: string;
            main_image_public_id: string;
            main_image_width?: number;
            main_image_height?: number;
            main_image_alt?: string;
          }
        | {} = {};
      
      // Nahrát všechny obrázky z galerie
      if (galleryFiles.length > 0) {
        const uploadedPhotos = await uploadImages(galleryFiles, accessToken, user?.uid);
        
        // Pokud je vybrán cover obrázek z galerie, použijeme ho
        if (selectedCoverIndex !== null && uploadedPhotos[selectedCoverIndex]) {
          const coverPhoto = uploadedPhotos[selectedCoverIndex];
          coverPayload = {
            main_image_url: coverPhoto.url,
            main_image_public_id: coverPhoto.public_id,
            ...(coverPhoto.width ? { main_image_width: coverPhoto.width } : {}),
            ...(coverPhoto.height ? { main_image_height: coverPhoto.height } : {}),
            ...(coverAlt ? { main_image_alt: coverAlt } : {}),
          };
        } else if (uploadedPhotos.length > 0) {
          // Pokud není vybrán cover, použijeme první obrázek
          const coverPhoto = uploadedPhotos[0];
          coverPayload = {
            main_image_url: coverPhoto.url,
            main_image_public_id: coverPhoto.public_id,
            ...(coverPhoto.width ? { main_image_width: coverPhoto.width } : {}),
            ...(coverPhoto.height ? { main_image_height: coverPhoto.height } : {}),
            ...(coverAlt ? { main_image_alt: coverAlt } : {}),
          };
        }
        
        // Uložit uploadedPhotos pro pozdější použití
        (window as any).__uploadedPhotos = uploadedPhotos;
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

      // Připravit payload - destination je textový název země
      const payload: any = {
        title,
        summary: summary || null,
        content,
        ...coverPayload,
      };
      
      // Získat název země pro uložení do textového pole destination
      if (selectedCountryId && selectedCountryId.trim() !== "") {
        const trimmedId = selectedCountryId.trim();
        // Zkontrolovat, zda země existuje v načteném seznamu
        const selectedCountry = countries.find(c => c.id === trimmedId);
        if (selectedCountry) {
          // Přidat textový název země pro uložení do pole destination
          payload.destination = selectedCountry.name;
        } else {
          console.warn("[new-article] Selected country ID not found in countries list:", trimmedId);
          payload.destination = null;
        }
      } else {
        payload.destination = null;
      }

      console.log("[new-article] Sending request to /api/articles with payload:", {
        hasTitle: !!payload.title,
        hasContent: !!payload.content,
        hasSummary: !!payload.summary,
        hasCover: !!payload.main_image_url,
        hasDestination: !!payload.destination,
        destination: payload.destination,
      });

      const res = await fetch("/api/articles", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      console.log("[new-article] create status:", res.status);
      console.log(
        "[new-article] response headers:",
        Object.fromEntries(res.headers.entries())
      );

      if (!res.ok) {
        let errorText = "";
        let errorData: any = {};
        try {
          errorText = await res.text();
          if (errorText && errorText.trim()) {
            try {
              errorData = JSON.parse(errorText);
            } catch {
              // Pokud není validní JSON, použijeme text jako chybu
              if (errorText && errorText !== "Unknown error") {
                errorData = { error: errorText };
              }
            }
          }
        } catch (e) {
          errorText = "Nepodařilo se načíst chybovou zprávu";
          console.error("[new-article] Error reading response:", e);
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

      // Přidat všechny nahráné obrázky do galerie (kromě cover obrázku)
      const uploadedPhotos = (window as any).__uploadedPhotos as UploadedPhoto[] | undefined;
      if (uploadedPhotos && uploadedPhotos.length > 0) {
        const coverIndex = selectedCoverIndex !== null ? selectedCoverIndex : 0;
        for (let i = 0; i < uploadedPhotos.length; i++) {
          // Přeskočit cover obrázek, ten už je v článku
          if (i === coverIndex) continue;
          await addPhotoToGallery(data.id, uploadedPhotos[i], accessToken, user?.uid);
        }
        delete (window as any).__uploadedPhotos;
      }

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
        // Pokud jen ukládáme jako koncept, přesměrujeme na profil uživatele s tabem articles
        setSaving(false); // Resetovat loading před přesměrováním
        
        // Načíst aktuální nickname z API
        let userNickname = user?.nicknameSlug || user?.nickname || user?.uid || "";
        if (user?.uid) {
          try {
            const userRes = await fetch(`/api/users/${encodeURIComponent(user.uid)}`, {
              headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
              credentials: "include",
            });
            if (userRes.ok) {
              const userData = await userRes.json();
              const nickname = userData.data?.nickname;
              if (nickname) {
                userNickname = slugifyNickname(nickname);
              }
            }
          } catch (err) {
            console.warn("Failed to fetch user nickname:", err);
            // Použijeme fallback
            userNickname = user?.nicknameSlug || user?.nickname || user?.uid || "";
          }
        }
        
        if (userNickname) {
          router.push(`/profil/${userNickname}?tab=articles`);
        } else {
          router.push("/komunita");
        }
        return; // Ukončit funkci, aby se finally blok neprovedl
      }
    } catch (err: any) {
      console.error("[new-article] submit error:", err?.message, err);
      // Skrýt animaci pokud byla zobrazená
      if (showSubmissionAnimation) {
        setShowSubmissionAnimation(false);
      }
      // Vždy zrušit loading při chybě
      if (submitForApproval) {
        setSubmitting(false);
      } else {
        setSaving(false);
      }
      setError(err.message || "Neznámá chyba");
    } finally {
      // Zajistit, že loading je vždy zrušen (pokud nebyl už zrušen v catch nebo před přesměrováním)
      // Poznámka: setSaving(false) se může volat vícekrát, což je v pořádku (React state setter je idempotentní)
      if (submitForApproval) {
        // submitting se nastaví na false až po přesměrování nebo chybě
        // pokud je animace zobrazená a úspěšná, submitting zůstane true až do přesměrování
        if (!showSubmissionAnimation || !submissionSuccess) {
          setSubmitting(false);
        }
      } else {
        // Pro koncept se setSaving(false) volá před přesměrováním, ale finally se vždy provede
        // Takže to může být voláno dvakrát, což je v pořádku
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
              <Link href="/prihlaseni?redirect=/clanek/novy">
                <Button>Přihlásit se</Button>
              </Link>
              <Link href="/registrace?redirect=/clanek/novy">
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
              onClick={async () => {
                let userNickname = user?.nicknameSlug || user?.nickname || user?.uid || "";
                // Načíst aktuální nickname z API
                if (user?.uid && !userNickname) {
                  try {
                    const userRes = await fetch(`/api/users/${encodeURIComponent(user.uid)}`);
                    if (userRes.ok) {
                      const userData = await userRes.json();
                      const nickname = userData.data?.nickname;
                      if (nickname) {
                        userNickname = slugifyNickname(nickname);
                      }
                    }
                  } catch (err) {
                    console.warn("Failed to fetch user nickname:", err);
                  }
                }
                if (userNickname) {
                  router.push(`/profil/${userNickname}?tab=articles`);
                } else {
                  router.push("/komunita");
                }
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
          <ArticleFormFields
            title={title}
            summary={summary}
            content={content}
            selectedCountryId={selectedCountryId}
            coverAlt={coverAlt}
            countries={countries}
            loadingCountries={loadingCountries}
            isPending={false}
            onTitleChange={setTitle}
            onSummaryChange={setSummary}
            onContentChange={setContent}
            onCountryChange={setSelectedCountryId}
            onCoverAltChange={setCoverAlt}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Obrázky (volitelné)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Nahrajte jeden nebo více obrázků. Kliknutím na obrázek vyberete hlavní fotografii (označena zeleným rámečkem).
            </p>
            
            <ImageUploadButton
              onFilesSelect={(files) => {
                setGalleryFiles((prev) => {
                  const newFiles = [...prev, ...files];
                  // Pokud je to první obrázek, automaticky ho vybereme jako cover
                  if (prev.length === 0 && selectedCoverIndex === null) {
                    setSelectedCoverIndex(0);
                  }
                  return newFiles;
                });
              }}
              disabled={saving || submitting}
            />

            <ArticleImageGallery
              galleryPreviews={galleryPreviews}
              selectedCoverIndex={selectedCoverIndex}
              onCoverFromPreview={(index) => setSelectedCoverIndex(index)}
              onRemovePreview={(index) => {
                setGalleryFiles((prev) => {
                  const newFiles = prev.filter((_, i) => i !== index);
                  // Pokud byl smazán cover obrázek, vybereme první zbývající
                  if (selectedCoverIndex === index) {
                    setSelectedCoverIndex(newFiles.length > 0 ? 0 : null);
                  } else if (selectedCoverIndex !== null && selectedCoverIndex > index) {
                    setSelectedCoverIndex(selectedCoverIndex - 1);
                  }
                  return newFiles;
                });
              }}
            />
            <input
              type="text"
              className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2 text-sm"
              value={coverAlt}
              onChange={(e) => setCoverAlt(e.target.value)}
              placeholder="Alt text (popis hlavní fotografie)"
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
              onClick={(e) => {
                e.preventDefault();
                onSubmit(e as any, false);
              }}
              loading={saving}
              disabled={saving || submitting}
            >
              {saving ? "Ukládám..." : "Uložit jako koncept"}
            </Button>
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onSubmit(e as any, true);
              }}
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
