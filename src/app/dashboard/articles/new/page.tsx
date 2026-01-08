"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";

export default function NewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [coverAlt, setCoverAlt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("[new-article] submit start");
    if (!title || !content) {
      setError("Vyplňte prosím název a obsah.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      console.log("[new-article] getting session...");
      const sessionResult = await Promise.race([
        supabase.auth.getSession(),
        new Promise<{ data: { session: any } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } } as any), 5000)
        ),
      ]);
      const session = sessionResult?.data?.session;
      console.log("[new-article] has session:", !!session?.access_token);
      // Pokud není uživatel přihlášen, přesměrujeme na login a nevoláme API
      if (!session?.access_token) {
        setSaving(false);
        // volitelně můžeš přidat redirect back param
        // např. `/auth/login?redirect=/dashboard/articles/new`
        router.push("/auth/login");
        return;
      }
      const headers: HeadersInit = {
        "content-type": "application/json",
        ...(session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}),
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
            ...(session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : {}),
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
      const res = await fetch("/api/articles", {
        method: "POST",
        headers,
        body: JSON.stringify({ title, summary, content, ...coverPayload }),
      });
      console.log("[new-article] create status:", res.status);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("[new-article] create error:", data);
        throw new Error(data.error || "Chyba při vytváření článku");
      }
      const data = (await res.json()) as { id: string };
      console.log("[new-article] created id:", data.id);
      router.push(`/dashboard/articles/${data.id}/edit`);
    } catch (err: any) {
      console.error("[new-article] submit error:", err?.message, err);
      setError(err.message || "Neznámá chyba");
    } finally {
      setSaving(false);
      console.log("[new-article] submit done");
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Nový článek</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Název
          </label>
          <input
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Např. Můj výlet do Peru"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Perex
          </label>
          <input
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Krátké uvedení článku"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Obsah
          </label>
          <textarea
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Text článku..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Cover image (volitelné)
          </label>
          <div className="mt-1 flex items-start gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>
          {previewUrl && (
            <div className="mt-3">
              <div className="relative w-full max-w-xl aspect-[16/9] overflow-hidden rounded-lg border">
                <img
                  src={previewUrl}
                  alt={coverAlt || file?.name || "Náhled"}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}
          <input
            className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            value={coverAlt}
            onChange={(e) => setCoverAlt(e.target.value)}
            placeholder="Alt text (popis obrázku)"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            Vytvořit
          </Button>
        </div>
      </form>
    </div>
  );
}
