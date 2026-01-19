"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { slugifyNickname } from "@/utils/slugify";
import { getAccessToken } from "@/lib/articles/authUtils";
import {
  uploadImages,
  setArticleCover,
  deleteArticleCover,
  addPhotoToGallery,
  deletePhotoFromGallery,
  getArticlePhotos,
  type UploadedPhoto,
} from "@/lib/articles/imageUtils";
import { ArticleImageGallery } from "@/components/articles/ArticleImageGallery";
import { ArticleFormFields } from "@/components/articles/ArticleFormFields";
import { ImageUploadButton } from "@/components/articles/ImageUploadButton";

const DEBUG_EDIT = true;
function dbg(...args: any[]) {
  if (DEBUG_EDIT) {
    // eslint-disable-next-line no-console
    console.log("[EditArticle]", ...args);
  }
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
  const [selectedCountryId, setSelectedCountryId] = React.useState<string>("");
  const [countries, setCountries] = React.useState<Array<{ id: string; name: string; iso_code: string }>>([]);
  const [loadingCountries, setLoadingCountries] = React.useState(false);
  const [destination, setDestination] = React.useState<string | null>(null);

  // Načíst seznam zemí
  React.useEffect(() => {
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

  // Načíst destination a najít odpovídající zemi po načtení zemí
  React.useEffect(() => {
    if (destination && countries.length > 0) {
      const matchingCountry = countries.find(
        c => c.name === destination || c.name.toLowerCase() === destination.toLowerCase()
      );
      if (matchingCountry) {
        setSelectedCountryId(matchingCountry.id);
      } else {
        setSelectedCountryId("");
      }
    } else if (!destination) {
      setSelectedCountryId("");
    }
  }, [destination, countries]);

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
        let token = await getAccessToken();

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
          setDestination(data.destination || null);
          
          // Načíst galerii obrázků
          try {
            const photos = await getArticlePhotos(currentId, token || undefined, user?.uid);
            setGalleryPhotos(photos);
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
            "title, summary, content, status, main_image_url, main_image_alt, author_id, destination"
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
        setDestination(data.destination || null);
        
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

  function handleGalleryFilesSelect(files: File[]) {
    if (currentStatus === "pending") return;
    if (files.length > 0) {
      setGalleryFiles((prev) => {
        const newFiles = [...prev, ...files];
        // Pokud je to první obrázek a není žádný cover, automaticky ho vybereme
        if (prev.length === 0 && !coverUrl && selectedCoverIndex === null) {
          setSelectedCoverIndex(0);
        }
        return newFiles;
      });
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
    if (currentStatus === "pending") return;
    // Označit, že chceme použít tento obrázek z galerie jako cover
    setCoverFromGallery({ url: photoUrl, alt: photoAlt });
    setCoverMarkedForDelete(false);
    // Nastavit nový cover, ale původní zůstane v originalCoverUrl pro zobrazení
    setCoverUrl(photoUrl);
    setCoverAlt(photoAlt);
  }

  // Pomocná funkce pro nahrávání obrázků - sdílená mezi saveDraft a submitForApproval
  async function uploadGalleryImages(token: string): Promise<void> {
    if (galleryFiles.length === 0) return;

    setUploadingGallery(true);
    try {
      if (!token) {
        token = (await getAccessToken()) || "";
      }
      
      if (!token) {
        throw new Error("Nepodařilo se získat autorizační token. Prosím, přihlaste se znovu.");
      }
      
      // Nahrát všechny obrázky
      const uploadedPhotos = await uploadImages(galleryFiles, token, user?.uid);

      // Pokud je vybrán cover obrázek z nových, nastavíme ho
      if (selectedCoverIndex !== null && uploadedPhotos[selectedCoverIndex]) {
        const coverPhoto = uploadedPhotos[selectedCoverIndex];
        await setArticleCover(id, coverPhoto, coverAlt, token, user?.uid);
        
        setCoverUrl(coverPhoto.url);
        setOriginalCoverUrl(coverPhoto.url);
        setCoverMarkedForDelete(false);
        setCoverFromGallery(null);
      }

      // Přidat všechny obrázky do galerie (kromě cover, pokud byl vybrán)
      const coverIndex = selectedCoverIndex !== null ? selectedCoverIndex : -1;
      for (let i = 0; i < uploadedPhotos.length; i++) {
        if (i === coverIndex) continue;
        await addPhotoToGallery(id, uploadedPhotos[i], token, user?.uid);
      }
      
      setGalleryFiles([]);
      setGalleryPreviews([]);
      setSelectedCoverIndex(null);
    } catch (galleryError: any) {
      throw galleryError;
    } finally {
      setUploadingGallery(false);
    }
  }

  // Pomocná funkce pro správu cover obrázku a mazání obrázků
  async function manageCoverAndDeletePhotos(token: string): Promise<void> {
    // Smazat označené obrázky z galerie
    if (photosToDelete.length > 0) {
      for (const photoId of photosToDelete) {
        await deletePhotoFromGallery(id, photoId, token, user?.uid);
      }
      setPhotosToDelete([]);
    }

    // Pokud byl vybrán cover obrázek z galerie, uložíme ho
    if (coverFromGallery) {
      await setArticleCover(
        id,
        { url: coverFromGallery.url, alt: coverFromGallery.alt },
        coverFromGallery.alt,
        token,
        user?.uid
      );

      setOriginalCoverUrl(coverFromGallery.url);
      setCoverUrl(coverFromGallery.url);
      setCoverFromGallery(null);
    }

    // Pokud je obrázek označen k smazání, smažeme ho
    if (coverMarkedForDelete && coverUrl && !coverFromGallery && galleryFiles.length === 0) {
      await deleteArticleCover(id, token, user?.uid);

      setCoverUrl(null);
      setCoverAlt(null);
      setOriginalCoverUrl(null);
      setCoverMarkedForDelete(false);
      setCoverFromGallery(null);
    }
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
      const token = await getAccessToken();
      dbg("Final token:", !!token, token ? `length: ${token.length}, first 20 chars: ${token.substring(0, 20)}...` : "null");

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
      await uploadGalleryImages(token || "");

      // Spravovat cover obrázek a mazat obrázky
      await manageCoverAndDeletePhotos(token || "");

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
      }

      // Získat název země pro uložení do textového pole destination
      let destinationName: string | null = null;
      if (selectedCountryId && selectedCountryId.trim() !== "") {
        const trimmedId = selectedCountryId.trim();
        const selectedCountry = countries.find(c => c.id === trimmedId);
        if (selectedCountry) {
          destinationName = selectedCountry.name;
        }
      }

      // Použijeme API endpoint pro konzistenci
      const res = await fetch(`/api/articles/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          title,
          summary,
          content,
          destination: destinationName,
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
      const token = await getAccessToken();

      if (!token) {
        setSubmitting(false);
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
      await uploadGalleryImages(token);

      // Spravovat cover obrázek a mazat obrázky
      await manageCoverAndDeletePhotos(token);

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
      }

      // Pro schválené články: uložíme změny (PUT automaticky změní status na "pending")
      // a pak explicitně odešleme ke schválení přes submit endpoint
      // Pro koncepty: nejdřív uložíme změny, pak odešleme přes submit endpoint
      if (currentStatus === "approved") {
        // Získat název země pro uložení do textového pole destination
        let destinationName: string | null = null;
        if (selectedCountryId && selectedCountryId.trim() !== "") {
          const trimmedId = selectedCountryId.trim();
          const selectedCountry = countries.find(c => c.id === trimmedId);
          if (selectedCountry) {
            destinationName = selectedCountry.name;
          }
        }

        // Pro schválené články: uložíme změny - PUT endpoint automaticky změní status na pending
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
              destination: destinationName,
            }),
          }
        );

        dbg("PUT response", { status: updateRes.status, ok: updateRes.ok });

        if (!updateRes.ok) {
          const errorData = await updateRes.json().catch(() => ({}));
          dbg("PUT error", errorData);
          throw new Error(errorData.error || "Uložení změn selhalo");
        }

        // Explicitně odešleme ke schválení (i když PUT už změnil status na pending,
        // toto zajistí, že se článek správně označí jako čekající na schválení)
        const submitRes = await fetch(
          `/api/articles/${encodeURIComponent(id)}/submit`,
          {
            method: "POST",
            headers,
          }
        );

        if (!submitRes.ok) {
          const errorData = await submitRes.json().catch(() => ({}));
          dbg("Submit error after PUT", errorData);
          // I když submit selže, změny byly uloženy a status je už pending,
          // takže pokračujeme dál
          console.warn("[EditArticle] Submit failed but changes were saved");
        }

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
        // Získat název země pro uložení do textového pole destination
        let destinationName: string | null = null;
        if (selectedCountryId && selectedCountryId.trim() !== "") {
          const trimmedId = selectedCountryId.trim();
          const selectedCountry = countries.find(c => c.id === trimmedId);
          if (selectedCountry) {
            destinationName = selectedCountry.name;
          }
        }

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
              destination: destinationName,
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

  const isPending = currentStatus === "pending";

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Upravit článek</h1>
      {savedMsg && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-2 text-sm">
          {savedMsg}
        </div>
      )}
      {isPending && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 text-yellow-800 px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Článek čeká na schválení. Nelze ho upravovat, dokud nebude schválen nebo zamítnut.</span>
          </div>
        </div>
      )}
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
          coverAlt={coverAlt || ""}
          countries={countries}
          loadingCountries={loadingCountries}
          isPending={isPending}
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
            onFilesSelect={handleGalleryFilesSelect}
            disabled={isPending || saving || uploadingGallery}
          />

          <ArticleImageGallery
            galleryPhotos={galleryPhotos}
            galleryPreviews={galleryPreviews}
            originalCoverUrl={originalCoverUrl}
            coverUrl={coverUrl}
            coverAlt={coverAlt}
            coverMarkedForDelete={coverMarkedForDelete}
            coverFromGallery={coverFromGallery}
            selectedCoverIndex={selectedCoverIndex}
            photosToDelete={photosToDelete}
            isPending={isPending}
            saving={saving}
            uploadingGallery={uploadingGallery}
            onCoverFromGallery={handleSetCoverFromGallery}
            onCoverFromPreview={(index) => {
              setSelectedCoverIndex(index);
              setCoverFromGallery(null);
              setCoverMarkedForDelete(false);
            }}
            onRemoveGalleryPhoto={handleRemoveGalleryPhoto}
            onCancelRemovePhoto={handleCancelRemovePhoto}
            onRemovePreview={handleRemoveGalleryFile}
            onCoverDelete={handleCoverDelete}
            onCoverDeleteCancel={handleCoverDeleteCancel}
            onRestoreOriginalCover={() => {
              setCoverFromGallery(null);
              setSelectedCoverIndex(null);
              setCoverUrl(originalCoverUrl);
            }}
          />
          <input
            type="text"
            className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            value={coverAlt || ""}
            onChange={(e) => setCoverAlt(e.target.value)}
            placeholder="Alt text (popis hlavní fotografie)"
            disabled={isPending}
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
            disabled={isPending || saving || submitting}
          >
            Zrušit
          </Button>
          {/* Tlačítko "Uložit změny" se zobrazí jen pro koncepty (draft), ne pro schválené články ani pending */}
          {currentStatus !== "approved" && currentStatus !== "pending" && (
            <Button
              type="button"
              variant="secondary"
              onClick={saveDraft}
              loading={saving}
              disabled={isPending || saving || submitting}
            >
              {saving ? "Ukládám…" : "Uložit změny"}
            </Button>
          )}
          <Button
            type="button"
            onClick={submitForApproval}
            loading={submitting}
            disabled={isPending || saving || submitting}
          >
            {submitting ? "Odesílám…" : "Odeslat ke schválení"}
          </Button>
        </div>
      </form>
    </div>
  );
}
