"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { slugifyNickname } from "@/utils/slugify";

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
  const [originalCoverUrl, setOriginalCoverUrl] = React.useState<string | null>(null); // Původní cover URL pro zobrazení
  const [currentStatus, setCurrentStatus] = React.useState<string | null>(null);
  const [coverMarkedForDelete, setCoverMarkedForDelete] = React.useState(false);
  const [galleryPhotos, setGalleryPhotos] = React.useState<Array<{ id: string; url: string; alt: string | null; width: number | null; height: number | null }>>([]);
  const [galleryFiles, setGalleryFiles] = React.useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = React.useState<Array<{ file: File; preview: string }>>([]);
  const [uploadingGallery, setUploadingGallery] = React.useState(false);
  const [photosToDelete, setPhotosToDelete] = React.useState<string[]>([]);
  const [selectedCoverIndex, setSelectedCoverIndex] = React.useState<number | null>(null);

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
          setOriginalCoverUrl(data.main_image_url || null); // Uložit původní cover
          setCurrentStatus(data.status || null);
          setCoverMarkedForDelete(false);
          setCoverFromGallery(null);
          setGalleryFiles([]);
          setGalleryPreviews([]);
          setPhotosToDelete([]);
          setSelectedCoverIndex(null);
          
          // Načíst galerii obrázků
          try {
            const photosHeaders: Record<string, string> = {};
            if (token) photosHeaders["Authorization"] = `Bearer ${token}`;
            if (user?.uid) photosHeaders["x-user-id"] = user.uid;
            
            const photosRes = await fetch(`/api/articles/${encodeURIComponent(currentId)}/photos`, {
              method: "GET",
              headers: photosHeaders,
            });
            if (photosRes.ok) {
              const photosData = await photosRes.json();
              setGalleryPhotos(photosData.photos || []);
            } else {
              console.warn("[EditArticle] Failed to load photos:", photosRes.status, photosRes.statusText);
              const errorText = await photosRes.text().catch(() => "");
              console.warn("[EditArticle] Photos error response:", errorText);
            }
          } catch (photosErr) {
            console.warn("[EditArticle] Error loading photos:", photosErr);
            // Pokračujeme i bez galerie
          }
          
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
        setOriginalCoverUrl(data.main_image_url || null); // Uložit původní cover
        setCurrentStatus(data.status || null);
        setCoverMarkedForDelete(false);
        setCoverFromGallery(null);
        setGalleryFiles([]);
        setGalleryPreviews([]);
        setPhotosToDelete([]);
        setSelectedCoverIndex(null);
        
        // Načíst galerii obrázků (fallback)
        try {
          const { data: photosData, error: photosError } = await supabase
            .from("article_photos")
            .select("id, url, alt, width, height")
            .eq("article_id", currentId)
            .order("created_at", { ascending: true });
          if (!photosError && photosData) {
            setGalleryPhotos(photosData);
          }
        } catch (e) {
          // Ignorovat chyby při načítání galerie
        }
        
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

  function handleCoverDelete() {
    // Jen označit obrázek k smazání, skutečné smazání proběhne při uložení
    setCoverMarkedForDelete(true);
  }

  function handleCoverDeleteCancel() {
    // Zrušit označení k smazání
    setCoverMarkedForDelete(false);
  }

  // Preview pro nové obrázky v galerii
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

  function handleGalleryFilesSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setGalleryFiles((prev) => [...prev, ...files]);
    }
  }

  function handleRemoveGalleryFile(index: number) {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleRemoveGalleryPhoto(photoId: string) {
    setPhotosToDelete((prev) => [...prev, photoId]);
  }

  function handleCancelRemovePhoto(photoId: string) {
    setPhotosToDelete((prev) => prev.filter((id) => id !== photoId));
  }


  const [coverFromGallery, setCoverFromGallery] = React.useState<{ url: string; alt: string | null } | null>(null);

  function handleSetCoverFromGallery(photoUrl: string, photoAlt: string | null) {
    // Označit, že chceme použít tento obrázek z galerie jako cover
    setCoverFromGallery({ url: photoUrl, alt: photoAlt });
    setCoverMarkedForDelete(false);
    // Nastavit nový cover, ale původní zůstane v originalCoverUrl pro zobrazení
    setCoverUrl(photoUrl);
    setCoverAlt(photoAlt);
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

      // Získáme token pro API volání - stejný přístup jako v clanek/novy/page.tsx
      let token: string | null = getAccessTokenFromStorage();
      dbg("Token from storage:", !!token, token ? `length: ${token.length}` : "null");

      // Pokud není v localStorage, zkusíme getSession s timeoutem
      if (!token) {
        try {
          const sessionResult = await Promise.race([
            supabase.auth.getSession(),
            new Promise<{ data: { session: any } }>((resolve) =>
              setTimeout(() => resolve({ data: { session: null } } as any), 3000)
            ),
          ]);
          token = sessionResult?.data?.session?.access_token || null;
          dbg("Token from getSession:", !!token, token ? `length: ${token.length}` : "null");
        } catch (err) {
          console.warn("[EditArticle] getSession error:", err);
        }
      }

      // Pokud stále nemáme token, zkusíme getUser
      if (!token) {
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
            token = sessionResult?.data?.session?.access_token || null;
            dbg("Token after getUser:", !!token, token ? `length: ${token.length}` : "null");
          }
        } catch (err) {
          console.warn("[EditArticle] getUser error:", err);
        }
      }

      dbg("Final token:", !!token, token ? `length: ${token.length}, first 20 chars: ${token.substring(0, 20)}...` : "null");

      // Pokud není token, zkusíme ještě jednou získat session
      if (!token) {
        setSaving(false);
        setError(
          "Nepodařilo se získat autentizační token. Zkuste to prosím znovu nebo se přihlaste."
        );
        return;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (user?.uid) headers["x-user-id"] = user.uid;

      // Nahrát nové obrázky do galerie a vybrat cover
      if (galleryFiles.length > 0) {
        setUploadingGallery(true);
        try {
          // Zajistit, že máme token - pokud ne, zkusíme ho získat znovu
          let uploadToken: string | null = token;
          
          if (!uploadToken) {
            uploadToken = getAccessTokenFromStorage();
            if (!uploadToken) {
              try {
                const sessionResult = await supabase.auth.getSession();
                uploadToken = sessionResult?.data?.session?.access_token || null;
              } catch (err) {
                console.warn("[EditArticle] Failed to get token for upload:", err);
              }
            }
          }
          
          if (!uploadToken) {
            dbg("No token available for upload");
            throw new Error("Nepodařilo se získat autorizační token. Prosím, přihlaste se znovu.");
          }
          
          dbg("Upload token available:", !!uploadToken, "length:", uploadToken.length);
          
          let uploadedPhotos: Array<{ url: string; public_id: string; width?: number; height?: number }> = [];
          
          for (const file of galleryFiles) {
            // Nahrát obrázek na Cloudinary
            const form = new FormData();
            form.append("file", file);
            form.append("folder", "destinote_articles");

            // FormData automaticky nastaví Content-Type, takže nebudeme ho přepisovat
            const uploadHeaders: Record<string, string> = {};
            // Přidat Bearer token
            if (uploadToken) {
              uploadHeaders["Authorization"] = `Bearer ${uploadToken}`;
              dbg("Added Authorization header with token, length:", uploadToken.length, "first 20 chars:", uploadToken.substring(0, 20));
            } else {
              dbg("No token available, relying on cookies");
            }
            if (user?.uid) {
              uploadHeaders["x-user-id"] = user.uid;
              dbg("Added x-user-id header:", user.uid);
            }
            
            dbg("Uploading file:", file.name, "size:", file.size, "token present:", !!uploadToken, "headers:", Object.keys(uploadHeaders));
            const uploadRes = await fetch("/api/images/upload", {
              method: "POST",
              headers: uploadHeaders,
              credentials: "include", // Důležité - poslat cookies
              body: form,
            });

            dbg("Upload response status:", uploadRes.status);
            if (!uploadRes.ok) {
              const errorText = await uploadRes.text().catch(() => "");
              let errorData: any = {};
              try {
                errorData = JSON.parse(errorText);
              } catch {
                errorData = { error: errorText || `Upload failed with status ${uploadRes.status}` };
              }
              console.error("[EditArticle] Upload error:", uploadRes.status, errorData);
              throw new Error(errorData.error || `Nahrání obrázku selhalo (${uploadRes.status})`);
            }

            const uploadData = await uploadRes.json();
            uploadedPhotos.push({
              url: uploadData.url,
              public_id: uploadData.public_id,
              width: uploadData.width,
              height: uploadData.height,
            });
          }

          // Pokud je vybrán cover obrázek z nových, nastavíme ho
          if (selectedCoverIndex !== null && uploadedPhotos[selectedCoverIndex]) {
            const coverPhoto = uploadedPhotos[selectedCoverIndex];
            
            // Zajistit, že máme token pro PUT request
            let coverToken: string | null = uploadToken;
            if (!coverToken) {
              coverToken = getAccessTokenFromStorage();
              if (!coverToken) {
                try {
                  const sessionResult = await supabase.auth.getSession();
                  coverToken = sessionResult?.data?.session?.access_token || null;
                } catch (err) {
                  console.warn("[EditArticle] Failed to get token for cover PUT:", err);
                }
              }
            }
            
            const coverHeaders: Record<string, string> = {
              "Content-Type": "application/json",
            };
            if (coverToken) {
              coverHeaders["Authorization"] = `Bearer ${coverToken}`;
              dbg("Added Authorization header for cover PUT, token length:", coverToken.length);
            } else {
              dbg("No token available for cover PUT, relying on cookies");
            }
            if (user?.uid) {
              coverHeaders["x-user-id"] = user.uid;
            }
            
            const coverRes = await fetch(`/api/articles/${encodeURIComponent(id)}/cover`, {
              method: "PUT",
              headers: coverHeaders,
              credentials: "include",
              body: JSON.stringify({
                url: coverPhoto.url,
                public_id: coverPhoto.public_id,
                width: coverPhoto.width || null,
                height: coverPhoto.height || null,
                alt: coverAlt || null,
              }),
            });

            if (!coverRes.ok) {
              const errorData = await coverRes.json().catch(() => ({}));
              throw new Error(errorData.error || "Nastavení hlavní fotografie selhalo");
            }

            setCoverUrl(coverPhoto.url);
            setOriginalCoverUrl(coverPhoto.url);
            setCoverMarkedForDelete(false);
            setCoverFromGallery(null);
          }

          // Přidat všechny obrázky do galerie (kromě cover, pokud byl vybrán)
          const coverIndex = selectedCoverIndex !== null ? selectedCoverIndex : -1;
          for (let i = 0; i < uploadedPhotos.length; i++) {
            // Přeskočit cover obrázek, ten už je v článku
            if (i === coverIndex) continue;
            
            const photo = uploadedPhotos[i];
            
            // Zajistit, že máme token pro POST request
            let photoToken: string | null = uploadToken;
            if (!photoToken) {
              photoToken = getAccessTokenFromStorage();
              if (!photoToken) {
                try {
                  const sessionResult = await supabase.auth.getSession();
                  photoToken = sessionResult?.data?.session?.access_token || null;
                } catch (err) {
                  console.warn("[EditArticle] Failed to get token for photo POST:", err);
                }
              }
            }
            
            const photoHeaders: Record<string, string> = {
              "Content-Type": "application/json",
            };
            if (photoToken) {
              photoHeaders["Authorization"] = `Bearer ${photoToken}`;
              dbg("Added Authorization header for photo POST, token length:", photoToken.length);
            } else {
              dbg("No token available for photo POST, relying on cookies");
            }
            if (user?.uid) {
              photoHeaders["x-user-id"] = user.uid;
            }
            
            const photoRes = await fetch(`/api/articles/${encodeURIComponent(id)}/photos`, {
              method: "POST",
              headers: photoHeaders,
              credentials: "include",
              body: JSON.stringify({
                url: photo.url,
                public_id: photo.public_id,
                width: photo.width || null,
                height: photo.height || null,
                alt: null,
              }),
            });

            if (!photoRes.ok) {
              console.warn(`Failed to add photo ${i} to gallery`);
            }
          }
          
          setGalleryFiles([]);
          setGalleryPreviews([]);
          setSelectedCoverIndex(null);
        } catch (galleryError: any) {
          setUploadingGallery(false);
          throw galleryError;
        } finally {
          setUploadingGallery(false);
        }
      }


      // Smazat označené obrázky z galerie
      if (photosToDelete.length > 0) {
        for (const photoId of photosToDelete) {
          const deleteRes = await fetch(`/api/articles/${encodeURIComponent(id)}/photos/${photoId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!deleteRes.ok) {
            const errorData = await deleteRes.json().catch(() => ({}));
            throw new Error(errorData.error || "Odstranění obrázku z galerie selhalo");
          }
        }
        setPhotosToDelete([]);
      }

      // Pokud byl vybrán cover obrázek z galerie, uložíme ho
      if (coverFromGallery) {
        // Zajistit, že máme token pro PUT request
        let coverToken: string | null = token;
        if (!coverToken) {
          coverToken = getAccessTokenFromStorage();
          if (!coverToken) {
            try {
              const sessionResult = await supabase.auth.getSession();
              coverToken = sessionResult?.data?.session?.access_token || null;
            } catch (err) {
              console.warn("[EditArticle] Failed to get token for cover PUT from gallery:", err);
            }
          }
        }
        
        const coverHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (coverToken) {
          coverHeaders["Authorization"] = `Bearer ${coverToken}`;
          dbg("Added Authorization header for cover PUT from gallery, token length:", coverToken.length);
        } else {
          dbg("No token available for cover PUT from gallery, relying on cookies");
        }
        if (user?.uid) {
          coverHeaders["x-user-id"] = user.uid;
        }
        
        const coverRes = await fetch(`/api/articles/${encodeURIComponent(id)}/cover`, {
          method: "PUT",
          headers: coverHeaders,
          credentials: "include",
          body: JSON.stringify({
            url: coverFromGallery.url,
            public_id: null, // Z galerie nemáme public_id, ale to je OK
            width: null,
            height: null,
            alt: coverFromGallery.alt || null,
          }),
        });

        if (!coverRes.ok) {
          const errorData = await coverRes.json().catch(() => ({}));
          throw new Error(errorData.error || "Nastavení cover obrázku selhalo");
        }

        // Aktualizovat originalCoverUrl na nový cover
        setOriginalCoverUrl(coverFromGallery.url);
        setCoverUrl(coverFromGallery.url);
        setCoverFromGallery(null);
      }

      // Pokud je obrázek označen k smazání, smažeme ho
      if (coverMarkedForDelete && coverUrl && !coverFromGallery && galleryFiles.length === 0) {
        dbg("Attempting to delete cover, token available:", !!token, token ? `length: ${token.length}` : "null");
        
        // Zajistit, že máme token - pokud ne, zkusíme ho získat znovu
        let deleteToken: string | null = token;
        if (!deleteToken) {
          deleteToken = getAccessTokenFromStorage();
          if (!deleteToken) {
            try {
              const sessionResult = await supabase.auth.getSession();
              deleteToken = sessionResult?.data?.session?.access_token || null;
            } catch (err) {
              console.warn("[EditArticle] Failed to get token for delete:", err);
            }
          }
        }
        
        // Použít token, který jsme získali
        // Pokud není token, zkusíme použít cookies (endpoint podporuje oba způsoby)
        const deleteHeaders: Record<string, string> = {};
        if (deleteToken) {
          deleteHeaders["Authorization"] = `Bearer ${deleteToken}`;
          dbg("Added Authorization header with token, length:", deleteToken.length);
        } else {
          dbg("No token available, relying on cookies");
        }
        if (user?.uid) {
          deleteHeaders["x-user-id"] = user.uid;
          dbg("Added x-user-id header:", user.uid);
        }
        
        dbg("Sending DELETE request to /api/articles/cover with headers:", Object.keys(deleteHeaders));
        const deleteRes = await fetch(`/api/articles/${encodeURIComponent(id)}/cover`, {
          method: "DELETE",
          headers: deleteHeaders,
          credentials: "include", // Důležité - poslat cookies
        });

        dbg("Delete cover response status:", deleteRes.status);
        if (!deleteRes.ok) {
          const errorText = await deleteRes.text().catch(() => "");
          let errorData: any = {};
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || `Delete failed with status ${deleteRes.status}` };
          }
          console.error("[EditArticle] Delete cover error:", deleteRes.status, errorData);
          throw new Error(errorData.error || `Odstranění obrázku selhalo (${deleteRes.status})`);
        }
        
        dbg("Cover deleted successfully");

        // Aktualizovat lokální stav
        setCoverUrl(null);
        setCoverAlt(null);
        setOriginalCoverUrl(null); // Smazat i původní cover
        setCoverMarkedForDelete(false);
        setCoverFromGallery(null);
      }
      
      // Načíst aktualizovanou galerii po uložení
      try {
        const photosHeaders: Record<string, string> = {};
        if (token) photosHeaders["Authorization"] = `Bearer ${token}`;
        if (user?.uid) photosHeaders["x-user-id"] = user.uid;
        
        const photosRes = await fetch(`/api/articles/${encodeURIComponent(id)}/photos`, {
          method: "GET",
          headers: photosHeaders,
          credentials: "include",
        });
        if (photosRes.ok) {
          const photosData = await photosRes.json();
          setGalleryPhotos(photosData.photos || []);
        } else {
          const errorText = await photosRes.text().catch(() => "");
          console.warn("[EditArticle] Failed to reload photos:", photosRes.status, errorText);
        }
      } catch (photosErr) {
        console.warn("[EditArticle] Error reloading photos:", photosErr);
        // Pokračujeme i bez aktualizace galerie
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
      
      // Načíst aktuální nickname před přesměrováním
      let profileSlug = user?.uid || "";
      try {
        if (user?.uid) {
          const userRes = await fetch(`/api/users/${encodeURIComponent(user.uid)}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            credentials: "include",
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            const nickname = userData.data?.nickname;
            if (nickname) {
              profileSlug = slugifyNickname(nickname);
            }
          }
        }
      } catch (err) {
        console.warn("[EditArticle] Failed to fetch user nickname:", err);
        // Použijeme fallback
        profileSlug = user?.nicknameSlug || user?.nickname || user?.uid || "";
      }
      
      // Přesměrovat na profil po úspěšném uložení
      setTimeout(() => {
        router.push(`/profil/${profileSlug}?tab=articles`);
      }, 500);
    } catch (e: any) {
      dbg("save error", e?.message || e);
      setError(e?.message || "Uložení selhalo");
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
        
        // Načíst aktuální nickname před přesměrováním
        let profileSlug = user?.uid || "";
        try {
          if (user?.uid) {
            const userRes = await fetch(`/api/users/${encodeURIComponent(user.uid)}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              credentials: "include",
            });
            if (userRes.ok) {
              const userData = await userRes.json();
              const nickname = userData.data?.nickname;
              if (nickname) {
                profileSlug = nickname
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .toLowerCase()
                  .replace(/\s+/g, "-");
              }
            }
          }
        } catch (err) {
          console.warn("[EditArticle] Failed to fetch user nickname:", err);
          profileSlug = user?.nicknameSlug || user?.nickname || user?.uid || "";
        }
        
        router.push(`/profil/${profileSlug}?tab=articles`);
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
        
        // Načíst aktuální nickname před přesměrováním
        let profileSlug = user?.uid || "";
        try {
          if (user?.uid) {
            const userRes = await fetch(`/api/users/${encodeURIComponent(user.uid)}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              credentials: "include",
            });
            if (userRes.ok) {
              const userData = await userRes.json();
              const nickname = userData.data?.nickname;
              if (nickname) {
                profileSlug = nickname
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .toLowerCase()
                  .replace(/\s+/g, "-");
              }
            }
          }
        } catch (err) {
          console.warn("[EditArticle] Failed to fetch user nickname:", err);
          profileSlug = user?.nicknameSlug || user?.nickname || user?.uid || "";
        }
        
        router.push(`/profil/${profileSlug}?tab=articles`);
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
      {/* Sekce pro správu obrázků - stejná jako při vytváření */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Obrázky (volitelné)
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Nahrajte jeden nebo více obrázků. Kliknutím na obrázek vyberete hlavní fotografii (označena zeleným rámečkem).
          </p>
          
          {/* Tlačítko pro nahrání obrázků */}
          <div className="mb-4">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleGalleryFilesSelect}
                disabled={saving || uploadingGallery}
              />
              <Button
                type="button"
                variant="outline"
                disabled={saving || uploadingGallery}
                onClick={(e) => {
                  e.preventDefault();
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.multiple = true;
                  input.onchange = (e) => {
                    const files = Array.from((e.target as HTMLInputElement).files || []);
                    if (files.length > 0) {
                      setGalleryFiles((prev) => [...prev, ...files]);
                      // Pokud je to první obrázek a není žádný cover, automaticky ho vybereme
                      if (galleryFiles.length === 0 && !coverUrl && selectedCoverIndex === null) {
                        setSelectedCoverIndex(0);
                      }
                    }
                  };
                  input.click();
                }}
              >
                Přidat obrázky
              </Button>
            </label>
          </div>

          {/* Všechny obrázky (existující + nové) v jednom gridu */}
          {(galleryPhotos.length > 0 || galleryPreviews.length > 0 || (coverUrl && !coverMarkedForDelete)) && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Nahrané obrázky (klikněte pro výběr hlavní fotografie):
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Původní cover obrázek (pokud není v galerii a není vybrán jiný cover) */}
                {originalCoverUrl && 
                 !coverMarkedForDelete && 
                 !galleryPhotos.find(p => p.url === originalCoverUrl) &&
                 !coverFromGallery &&
                 selectedCoverIndex === null && (
                  <div
                    className="relative border-2 border-green-500 ring-2 ring-green-200 rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => {
                      // Cover už je vybrán, nic neděláme
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={originalCoverUrl}
                      alt={coverAlt || "Hlavní fotografie"}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      Hlavní fotografie
                    </div>
                    <div className="absolute top-1 right-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCoverDelete();
                        }}
                        disabled={saving || uploadingGallery}
                        className="text-xs bg-white"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Původní cover obrázek (pokud není v galerii, ale je vybrán jiný cover) - zobrazit bez označení jako hlavní */}
                {originalCoverUrl && 
                 !coverMarkedForDelete && 
                 !galleryPhotos.find(p => p.url === originalCoverUrl) &&
                 (coverFromGallery || selectedCoverIndex !== null) && (
                  <div
                    className="relative border-2 border-gray-200 hover:border-gray-300 rounded-lg overflow-hidden cursor-pointer transition-all"
                    onClick={() => {
                      // Vrátit původní cover
                      setCoverFromGallery(null);
                      setSelectedCoverIndex(null);
                      setCoverUrl(originalCoverUrl);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={originalCoverUrl}
                      alt={coverAlt || "Gallery photo"}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute top-1 right-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCoverDelete();
                        }}
                        disabled={saving || uploadingGallery}
                        className="text-xs bg-white"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                )}

                {/* Obrázky z galerie */}
                {galleryPhotos.map((photo) => {
                  const isMarkedForDelete = photosToDelete.includes(photo.id);
                  // Cover je z galerie pouze pokud není vybrán nový obrázek a tento obrázek je vybrán jako cover
                  const isCurrentCover = selectedCoverIndex === null && 
                                         ((coverUrl === photo.url && !coverMarkedForDelete) || 
                                          (coverFromGallery?.url === photo.url));
                  
                  if (isMarkedForDelete) {
                    return (
                      <div
                        key={photo.id}
                        className="relative border-2 border-yellow-300 rounded-lg p-2 bg-yellow-50"
                      >
                        <div className="text-xs text-yellow-800 text-center mb-2">
                          Bude smazán
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelRemovePhoto(photo.id)}
                          className="w-full"
                        >
                          Zrušit
                        </Button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={photo.id}
                      className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                        isCurrentCover
                          ? "border-green-500 ring-2 ring-green-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => {
                        handleSetCoverFromGallery(photo.url, photo.alt);
                        setSelectedCoverIndex(null); // Zrušit výběr nového obrázku
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.alt || "Gallery photo"}
                        className="w-full h-32 object-cover"
                      />
                      {isCurrentCover && (
                        <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          Hlavní fotografie
                        </div>
                      )}
                      <div className="absolute top-1 right-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveGalleryPhoto(photo.id);
                          }}
                          disabled={saving || uploadingGallery}
                          className="text-xs bg-white"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {/* Preview nových obrázků */}
                {galleryPreviews.map((preview, index) => {
                  const isCover = selectedCoverIndex === index;
                  return (
                    <div
                      key={`preview-${index}`}
                      className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                        isCover
                          ? "border-green-500 ring-2 ring-green-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => {
                        setSelectedCoverIndex(index);
                        setCoverFromGallery(null);
                        setCoverMarkedForDelete(false);
                        // Zrušit výběr cover z galerie, pokud byl vybrán
                        if (coverFromGallery) {
                          setCoverFromGallery(null);
                        }
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover opacity-75"
                      />
                      {isCover && (
                        <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          Hlavní fotografie
                        </div>
                      )}
                      <div className="absolute top-1 right-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveGalleryFile(index);
                          }}
                          disabled={saving || uploadingGallery}
                          className="text-xs bg-white"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Zpráva, že obrázek je označen k smazání */}
          {coverMarkedForDelete && coverUrl && !coverFromGallery && galleryFiles.length === 0 && (
            <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 text-yellow-800 px-4 py-3 text-sm">
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
          <input
            type="text"
            className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2 text-sm"
            value={coverAlt || ""}
            onChange={(e) => setCoverAlt(e.target.value)}
            placeholder="Alt text (popis hlavní fotografie)"
          />
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
