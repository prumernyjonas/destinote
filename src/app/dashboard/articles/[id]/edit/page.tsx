"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const DEBUG_EDIT = true;
function dbg(...args: any[]) {
  if (DEBUG_EDIT) {
    // eslint-disable-next-line no-console
    console.log("[EditArticle]", ...args);
  }
}

function getAccessTokenFromStorage(): string | null {
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
      } catch {}
    }
  } catch {}
  return null;
}

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || "";
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [savedMsg, setSavedMsg] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [content, setContent] = React.useState("");
  const [coverUrl, setCoverUrl] = React.useState<string | null>(null);
  const [coverAlt, setCoverAlt] = React.useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = React.useState<string | null>(null);
  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const [coverPreview, setCoverPreview] = React.useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = React.useState(false);
  const [coverMarkedForDelete, setCoverMarkedForDelete] = React.useState(false);

  // Načítání článku - jednoduchý přístup
  React.useEffect(() => {
    if (authLoading || !id || !user?.uid) {
      if (!authLoading && (!id || !user?.uid)) {
        setLoading(false);
      }
      return;
    }

    let cancelled = false;
    const currentId = id;

    async function load() {
      try {
        dbg("[load] START", { id: currentId, userId: user?.uid });
        setError(null);
        setLoading(true);

        if (!user?.uid) {
          setError("Pro úpravu článku se prosím přihlaste.");
          setLoading(false);
          return;
        }

        // Zkusíme získat token rychle
        let token = getAccessTokenFromStorage();
        if (!token) {
          try {
            const session = await Promise.race([
              supabase.auth.getSession(),
              new Promise<{ data: { session: any } }>((_, reject) =>
                setTimeout(() => reject(new Error("Timeout")), 1000)
              ),
            ]);
            token = session?.data?.session?.access_token || null;
          } catch {
            // Pokračujeme bez tokenu
          }
        }

        if (cancelled || currentId !== id) return;

        // Načteme přes API
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        headers["x-user-id"] = user.uid;

        const res = await fetch(
          `/api/articles/${encodeURIComponent(currentId)}`,
          {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
            headers,
          }
        );

        if (cancelled || currentId !== id) return;

        if (res.ok) {
          const data = await res.json();
          if (cancelled || currentId !== id) return;

          setTitle(data.title || "");
          setSummary(data.summary || "");
          setContent(data.content || "");
          setCoverUrl(data.main_image_url || null);
          setCoverAlt(data.main_image_alt || null);
          setCurrentStatus(data.status || null);
          setCoverMarkedForDelete(false);
          setLoading(false);
          return;
        }

        // Fallback na Supabase - pouze pokud API selhalo
        if (cancelled || currentId !== id) return;

        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) {
          if (!cancelled && currentId === id) {
            setError("Pro úpravu článku se prosím přihlaste.");
            setLoading(false);
          }
          return;
        }

        if (cancelled || currentId !== id) return;

        const { data, error: supabaseError } = await supabase
          .from("articles")
          .select(
            "title, summary, content, status, main_image_url, main_image_alt, author_id"
          )
          .eq("id", currentId)
          .maybeSingle();

        if (cancelled || currentId !== id) return;

        if (supabaseError) {
          if (!cancelled && currentId === id) {
            setError(`Chyba při načítání článku: ${supabaseError.message}`);
            setLoading(false);
          }
          return;
        }

        if (!data) {
          if (!cancelled && currentId === id) {
            setError("Článek nebyl nalezen.");
            setLoading(false);
          }
          return;
        }

        // Kontrola vlastnictví
        if (data.author_id !== sessionData.session.user.id) {
          if (!cancelled && currentId === id) {
            setError("Nemáte oprávnění upravit tento článek.");
            setLoading(false);
          }
          return;
        }

        if (cancelled || currentId !== id) return;

        // Uložíme data
        setTitle(data.title || "");
        setSummary(data.summary || "");
        setContent(data.content || "");
        setCoverUrl(data.main_image_url || null);
        setCoverAlt(data.main_image_alt || null);
        setCurrentStatus(data.status || null);
        setCoverMarkedForDelete(false);
        setLoading(false);
      } catch (err: any) {
        dbg("[load] error", err);
        if (!cancelled && currentId === id) {
          setError(err?.message || "Nepodařilo se načíst článek");
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id, authLoading, user?.uid]);

  // Preview pro nový obrázek
  React.useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [coverFile]);

  // Preview se vytvoří automaticky, ale nahrání proběhne až při uložení změn

  function handleCoverDelete() {
    // Jen označit obrázek k smazání, skutečné smazání proběhne při uložení
    setCoverMarkedForDelete(true);
    setCoverFile(null);
    setCoverPreview(null);
  }

  function handleCoverDeleteCancel() {
    // Zrušit označení k smazání
    setCoverMarkedForDelete(false);
  }

  async function saveDraft(e: React.FormEvent) {
    e.preventDefault();

    // Pro schválené články nelze ukládat změny, jen odeslat ke schválení
    if (currentStatus === "approved") {
      setError(
        "Schválené články nelze ukládat jako koncept. Použijte 'Odeslat ke schválení'."
      );
      return;
    }

    setSaving(true);
    setError(null);
    try {
      dbg("save start", { id, currentStatus });

      // Získáme token pro API volání
      let token = getAccessTokenFromStorage();
      if (!token) {
        try {
          const session = await supabase.auth.getSession();
          token = session?.data?.session?.access_token || null;
        } catch {
          // Pokračujeme bez tokenu
        }
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (user?.uid) headers["x-user-id"] = user.uid;

      // Pokud je nový obrázek vybrán, nahrajeme ho
      if (coverFile) {
        setUploadingCover(true);
        try {
          // Nahrát obrázek na Cloudinary
          const form = new FormData();
          form.append("file", coverFile);
          form.append("folder", "destinote_articles");

          const uploadRes = await fetch("/api/images/upload", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: form,
          });

          if (!uploadRes.ok) {
            const errorData = await uploadRes.json().catch(() => ({}));
            throw new Error(errorData.error || "Nahrání obrázku selhalo");
          }

          const uploadData = await uploadRes.json();
          const { url, public_id, width, height } = uploadData;

          // Uložit metadata do článku
          const coverRes = await fetch(`/api/articles/${encodeURIComponent(id)}/cover`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              url,
              public_id,
              width: width || null,
              height: height || null,
              alt: coverAlt || null,
            }),
          });

          if (!coverRes.ok) {
            const errorData = await coverRes.json().catch(() => ({}));
            throw new Error(errorData.error || "Uložení obrázku selhalo");
          }

          // Aktualizovat lokální stav
          setCoverUrl(url);
          setCoverFile(null);
          setCoverPreview(null);
          setCoverMarkedForDelete(false);
        } catch (uploadError: any) {
          setUploadingCover(false);
          throw uploadError;
        } finally {
          setUploadingCover(false);
        }
      }

      // Pokud je obrázek označen k smazání, smažeme ho
      if (coverMarkedForDelete && coverUrl && !coverFile) {
        const deleteRes = await fetch(`/api/articles/${encodeURIComponent(id)}/cover`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!deleteRes.ok) {
          const errorData = await deleteRes.json().catch(() => ({}));
          throw new Error(errorData.error || "Odstranění obrázku selhalo");
        }

        // Aktualizovat lokální stav
        setCoverUrl(null);
        setCoverAlt(null);
        setCoverFile(null);
        setCoverPreview(null);
        setCoverMarkedForDelete(false);
      }

      // Použijeme API endpoint pro konzistenci
      const res = await fetch(`/api/articles/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          title,
          summary,
          content,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Uložení selhalo");
      }

      setSavedMsg("Změny uloženy");
      setTimeout(() => setSavedMsg(null), 3000);
    } catch (e: any) {
      dbg("save error", e?.message || e);
      setError(e?.message || "Uložení selhalo");
    } finally {
      setSaving(false);
    }
  }

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      if (
        (isMac && e.metaKey && e.key === "s") ||
        (!isMac && e.ctrlKey && e.key === "s")
      ) {
        e.preventDefault();
        // Klávesová zkratka funguje jen pro koncepty, ne pro schválené články
        if (!saving && !submitting && currentStatus !== "approved") {
          saveDraft({ preventDefault: () => {} } as unknown as React.FormEvent);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, submitting, title, summary, content, currentStatus]);

  async function submitForApproval(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      dbg("submit start", { id, currentStatus });

      // Získáme token pro API volání
      let token = getAccessTokenFromStorage();
      if (!token) {
        try {
          const session = await supabase.auth.getSession();
          token = session?.data?.session?.access_token || null;
        } catch {
          // Pokračujeme bez tokenu
        }
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (user?.uid) headers["x-user-id"] = user.uid;

      // Pro schválené články: PUT endpoint automaticky změní status na "pending"
      // Pro koncepty: nejdřív uložíme změny, pak odešleme přes submit endpoint
      if (currentStatus === "approved") {
        // Pro schválené články stačí jen uložit změny - PUT endpoint automaticky změní status na pending
        dbg("updating approved article via PUT", { id, hasToken: !!token });
        const updateRes = await fetch(
          `/api/articles/${encodeURIComponent(id)}`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify({
              title,
              summary,
              content,
            }),
          }
        );

        dbg("PUT response", { status: updateRes.status, ok: updateRes.ok });

        if (!updateRes.ok) {
          const errorData = await updateRes.json().catch(() => ({}));
          dbg("PUT error", errorData);
          throw new Error(errorData.error || "Uložení změn selhalo");
        }

        const updateResult = await updateRes.json().catch(() => ({}));
        dbg("PUT success", updateResult);
        dbg("submit ok (approved article) -> redirect to profile");
        router.push(`/profil/${user?.nicknameSlug || user?.uid}?tab=articles`);
      } else {
        // Pro koncepty: uložíme změny a pak odešleme ke schválení
        const updateRes = await fetch(
          `/api/articles/${encodeURIComponent(id)}`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify({
              title,
              summary,
              content,
            }),
          }
        );

        if (!updateRes.ok) {
          const errorData = await updateRes.json().catch(() => ({}));
          throw new Error(errorData.error || "Uložení změn selhalo");
        }

        // Pak odesleme ke schválení přes submit endpoint
        const submitRes = await fetch(
          `/api/articles/${encodeURIComponent(id)}/submit`,
          {
            method: "POST",
            headers,
          }
        );

        if (!submitRes.ok) {
          const errorData = await submitRes.json().catch(() => ({}));
          throw new Error(errorData.error || "Odeslání ke schválení selhalo");
        }

        dbg("submit ok (concept) -> redirect to profile");
        router.push(`/profil/${user?.nicknameSlug || user?.uid}?tab=articles`);
      }
    } catch (e: any) {
      dbg("submit error", e?.message || e);
      setError(e?.message || "Odeslání ke schválení selhalo");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Upravit článek</h1>
        <div className="text-center py-12">
          <p className="text-gray-600">Načítám článek…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Upravit článek</h1>
      {savedMsg && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-2 text-sm">
          {savedMsg}
        </div>
      )}
      {/* Sekce pro správu cover obrázku */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cover obrázek
        </label>
        
        {/* Zobrazení aktuálního nebo preview obrázku */}
        {(coverUrl || coverPreview) && !coverMarkedForDelete && (
          <div className="relative w-full max-w-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverPreview || coverUrl || ""}
              alt={coverAlt || "Cover"}
              className={`w-full rounded-md border object-cover ${
                coverPreview ? "opacity-75" : ""
              }`}
              style={{ maxHeight: 360 }}
            />
            {coverPreview && (
              <div className="mt-2 text-sm text-blue-600 font-medium">
                Náhled nového obrázku (bude nahrán po uložení změn)
              </div>
            )}
          </div>
        )}
        
        {/* Zpráva, že obrázek je označen k smazání */}
        {coverMarkedForDelete && coverUrl && !coverFile && (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 text-yellow-800 px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Obrázek bude smazán po uložení změn</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCoverDeleteCancel}
              >
                Zrušit
              </Button>
            </div>
          </div>
        )}

        {/* Input pro alt text */}
        <div>
          <input
            type="text"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2"
            value={coverAlt || ""}
            onChange={(e) => setCoverAlt(e.target.value)}
            placeholder="Alt text (popis obrázku)"
          />
        </div>

        {/* Tlačítka pro správu obrázku */}
        <div className="flex gap-3">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                if (file) {
                  setCoverFile(file);
                }
              }}
              disabled={uploadingCover}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploadingCover || saving}
              onClick={(e) => {
                e.preventDefault();
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0] || null;
                  if (file) {
                    setCoverFile(file);
                    setCoverMarkedForDelete(false); // Zrušit smazání, pokud je nový obrázek vybrán
                  }
                };
                input.click();
              }}
            >
              {coverFile ? "Změnit výběr" : coverUrl ? "Nahradit obrázek" : "Nahrát obrázek"}
            </Button>
          </label>
          
          {coverUrl && !coverFile && !coverMarkedForDelete && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCoverDelete}
              disabled={uploadingCover || saving}
            >
              Odstranit obrázek
            </Button>
          )}
          
          {coverFile && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCoverFile(null);
                setCoverPreview(null);
              }}
              disabled={uploadingCover || saving}
            >
              Zrušit výběr
            </Button>
          )}
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Název
          </label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Název článku"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Perex
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
            Obsah
          </label>
          <textarea
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2"
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Text článku..."
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
            Zpět
          </Button>
          {/* Tlačítko "Uložit změny" se zobrazí jen pro koncepty (draft/pending), ne pro schválené články */}
          {currentStatus !== "approved" && (
            <Button
              type="button"
              variant="secondary"
              onClick={saveDraft}
              loading={saving}
              disabled={saving || submitting}
            >
              {saving ? "Ukládám…" : "Uložit změny"}
            </Button>
          )}
          <Button
            type="button"
            onClick={submitForApproval}
            loading={submitting}
            disabled={saving || submitting}
          >
            {submitting ? "Odesílám…" : "Odeslat ke schválení"}
          </Button>
        </div>
      </form>
    </div>
  );
}
