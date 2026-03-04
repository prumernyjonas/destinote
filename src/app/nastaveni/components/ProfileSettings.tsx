"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { slugifyNickname } from "@/utils/slugify";
import AvatarCropModal from "@/components/profile/AvatarCropModal";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabase/client";
import { getAccessToken } from "@/lib/articles/authUtils";

export default function ProfileSettings() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [nickname, setNickname] = useState("");
  const [currentDbNickname, setCurrentDbNickname] = useState("");
  const [loadingNickname, setLoadingNickname] = useState(true);
  const [nicknameLoaded, setNicknameLoaded] = useState(false);
  const [displayInitial, setDisplayInitial] = useState<string>("?");
  const [nicknameChecking, setNicknameChecking] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(
    null
  );
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>("");
  const [pendingAvatarBlob, setPendingAvatarBlob] = useState<Blob | null>(null);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Načíst přezdívku a avatar z databáze (pouze při prvním načtení)
  useEffect(() => {
    async function loadUserData() {
      if (!user?.uid || nicknameLoaded) {
        if (!user?.uid) {
          setLoadingNickname(false);
        }
        return;
      }

      try {
        setLoadingNickname(true);
        console.log("[ProfileSettings] Načítám data uživatele z DB...");
        const accessToken = await getAccessToken();
        const res = await fetch(`/api/users/${user.uid}`, {
          credentials: "include",
          ...(accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {}),
        });
        if (res.ok) {
          const data = await res.json();
          const dbNickname = data.data?.nickname;
          const dbAvatarUrl = data.data?.avatarUrl;
          
          console.log("[ProfileSettings] DB data:", { dbNickname, dbAvatarUrl });
          
          if (dbNickname) {
            setNickname(dbNickname);
            setCurrentDbNickname(dbNickname);
            setDisplayInitial(getInitial(dbNickname));
            setNicknameLoaded(true);
          }
          
          // Načíst avatar_url z databáze (má přednost před user.photoURL)
          if (dbAvatarUrl && dbAvatarUrl.trim() !== "") {
            // Ignorovat Google fotky
            const isGooglePhoto = dbAvatarUrl.includes("googleusercontent.com") ||
              dbAvatarUrl.includes("google.com") ||
              dbAvatarUrl.includes("lh3.googleusercontent.com");
            
            if (!isGooglePhoto) {
              console.log("[ProfileSettings] Nastavuji avatarUrl z DB:", dbAvatarUrl);
              setAvatarUrl(dbAvatarUrl);
            } else {
              console.log("[ProfileSettings] Ignoruji Google fotku");
              setAvatarUrl(null);
            }
          } else {
            console.log("[ProfileSettings] Žádný avatar v DB, nastavuji null");
            setAvatarUrl(null);
          }
        } else {
          console.error("[ProfileSettings] Chyba při načítání dat:", res.status);
        }
      } catch (err) {
        console.error("[ProfileSettings] Chyba při načítání přezdívky:", err);
      } finally {
        setLoadingNickname(false);
      }
    }

    loadUserData();
  }, [user?.uid, nicknameLoaded]);

  // Cleanup pending avatar preview URL při unmount
  useEffect(() => {
    return () => {
      if (pendingAvatarPreview) {
        URL.revokeObjectURL(pendingAvatarPreview);
      }
    };
  }, [pendingAvatarPreview]);

  // Načíst avatar z user objektu pouze jako fallback (pokud ještě není načten z DB)
  useEffect(() => {
    if (user && !nicknameLoaded && !avatarUrl) {
      // Ignorovat Google fotky - zobrazit iniciál místo toho
      const photoUrl = user.photoURL;
      // Pokud je to Google fotka, ignorovat ji
      const isGooglePhoto = photoUrl && (
        photoUrl.includes("googleusercontent.com") ||
        photoUrl.includes("google.com") ||
        photoUrl.includes("lh3.googleusercontent.com")
      );
      // Zobrazit iniciál, pokud není fotka, je prázdný string, nebo je to Google fotka
      // Pouze pokud ještě nemáme avatarUrl z DB
      setAvatarUrl(
        photoUrl && photoUrl.trim() !== "" && !isGooglePhoto ? photoUrl : null
      );
    }
  }, [user, nicknameLoaded]);

  // Debounced kontrola dostupnosti nicknamu
  useEffect(() => {
    if (!nickname || nickname.trim().length < 3) {
      setNicknameAvailable(null);
      setNicknameError(null);
      return;
    }

    const trimmed = nickname.trim();

    // Pokud se nezměnil, není potřeba kontrolovat
    if (slugifyNickname(trimmed) === slugifyNickname(currentDbNickname)) {
      setNicknameAvailable(true);
      setNicknameError(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setNicknameChecking(true);
      try {
        const res = await fetch(
          `/api/users/check-nickname?nickname=${encodeURIComponent(trimmed)}`
        );
        const data = await res.json();

        if (data.available) {
          setNicknameAvailable(true);
          setNicknameError(null);
        } else {
          setNicknameAvailable(false);
          setNicknameError(data.message || "Přezdívka je již obsazena");
        }
      } catch (err) {
        console.error("Chyba při kontrole nicknamu:", err);
        setNicknameAvailable(null);
      } finally {
        setNicknameChecking(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [nickname, currentDbNickname]);

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);
    setNicknameError(null);
  };

  const handleNicknameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = nickname.trim();

    if (!trimmed || trimmed.length < 3) {
      setNicknameError("Přezdívka musí mít alespoň 3 znaky");
      return;
    }

    if (trimmed.length > 30) {
      setNicknameError("Přezdívka může mít maximálně 30 znaků");
      return;
    }

    if (!/^[\p{L}\p{N}_-]+$/u.test(trimmed)) {
      setNicknameError(
        "Přezdívka může obsahovat pouze písmena (včetně diakritiky), čísla, pomlčky a podtržítka"
      );
      return;
    }

    if (nicknameAvailable === false) {
      setNicknameError("Přezdívka je již obsazena");
      return;
    }

    setSaving(true);
    setNicknameError(null);

    try {
      // Nejdřív nahrát pending avatar, pokud existuje
      let uploadedAvatarUrl: string | null = null;
      if (pendingAvatarBlob) {
        setAvatarUploading(true);
        try {
          console.log("[ProfileSettings] Nahrávám avatar...");
          uploadedAvatarUrl = await uploadAvatar(pendingAvatarBlob);
          if (uploadedAvatarUrl) {
            console.log("[ProfileSettings] Avatar úspěšně nahrán:", uploadedAvatarUrl);
            setAvatarUrl(uploadedAvatarUrl);
            // Vyčistit pending avatar
            if (pendingAvatarPreview) {
              URL.revokeObjectURL(pendingAvatarPreview);
            }
            setPendingAvatarBlob(null);
            setPendingAvatarPreview(null);
          } else {
            console.warn("[ProfileSettings] Avatar nahrán, ale URL není k dispozici");
          }
        } catch (avatarErr: any) {
          console.error("[ProfileSettings] Chyba při nahrávání avatara:", avatarErr);
          toast.error(avatarErr.message || "Chyba při nahrávání avatara");
          setAvatarUploading(false);
          setSaving(false);
          return;
        } finally {
          setAvatarUploading(false);
        }
        
        // Aktualizovat uživatele PO nahrání avatara (mimo try-catch, aby se loader nezobrazoval)
        // Toto se provede na pozadí, aby se avatar zobrazil všude
        if (uploadedAvatarUrl && refreshUser) {
          refreshUser().catch((err) => {
            console.error("[ProfileSettings] Chyba při refreshUser po nahrání avatara:", err);
            // Necháme to projít, protože avatar už je nahráný
          });
        }
      }

      // Pokud se nemění nickname (je stejný jako aktuální) a už jsme nahráli avatar, ukončit
      if (trimmed === currentDbNickname && uploadedAvatarUrl) {
        console.log("[ProfileSettings] Nickname se nezměnil a avatar je nahrán, ukončuji");
        setSaving(false);
        toast.success("Změny byly úspěšně uloženy");
        return;
      }
      
      // Pokud se nemění nickname a není žádný pending avatar, ukončit
      if (trimmed === currentDbNickname && !pendingAvatarBlob && !uploadedAvatarUrl) {
        console.log("[ProfileSettings] Nickname se nezměnil a není žádná změna, ukončuji");
        setSaving(false);
        return;
      }

      // Pokud se nemění nickname (je stejný jako aktuální), ukončit hned po nahrání avatara
      if (trimmed === currentDbNickname && !pendingAvatarBlob) {
        console.log("[ProfileSettings] Nickname se nezměnil a není pending avatar, ukončuji");
        setSaving(false);
        toast.success("Změny byly úspěšně uloženy");
        return;
      }

      // Získat access token pro autorizaci (s timeoutem a fallbacky)
      console.log("[ProfileSettings] Získávám access token...");
      const accessToken = await getAccessToken();
      console.log("[ProfileSettings] Access token:", accessToken ? "získán" : "není k dispozici (použijí se cookies)");

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      console.log("[ProfileSettings] Odesílám request na /api/users/update-profile s nickname:", trimmed);
      
      // Přidat timeout pro request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error("[ProfileSettings] Request timeout!");
        controller.abort();
      }, 30000); // 30 sekund timeout

      let res: Response;
      try {
        res = await fetch("/api/users/update-profile", {
          method: "PATCH",
          headers,
          body: JSON.stringify({ nickname: trimmed }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        console.log("[ProfileSettings] Request dokončen, status:", res.status);
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        console.error("[ProfileSettings] Fetch error:", fetchErr);
        if (fetchErr.name === "AbortError") {
          throw new Error("Request trval příliš dlouho. Zkuste to prosím znovu.");
        }
        throw fetchErr;
      }

      console.log("[ProfileSettings] Response status:", res.status);
      
      let data: any;
      try {
        const responseText = await res.text();
        console.log("[ProfileSettings] Response text:", responseText.substring(0, 200));
        data = JSON.parse(responseText);
        console.log("[ProfileSettings] Response data:", data);
      } catch (parseErr) {
        console.error("[ProfileSettings] Chyba při parsování response:", parseErr);
        throw new Error("Neplatná odpověď ze serveru");
      }

      if (!res.ok) {
        throw new Error(data.error || "Chyba při aktualizaci přezdívky");
      }

      // Aktualizovat aktuální přezdívku lokálně (okamžitě)
      setCurrentDbNickname(trimmed);
      setNickname(trimmed);
      setDisplayInitial(getInitial(trimmed));

      // Nastavit saving na false PŘED refreshUser, aby se loader zastavil okamžitě
      setSaving(false);
      toast.success("Změny byly úspěšně uloženy");

      // Aktualizovat uživatele na pozadí (asynchronně), aby se slug propisoval do Navbaru
      // Toto se provede na pozadí, aby se UI nezablokovalo
      if (refreshUser) {
        console.log("[ProfileSettings] Aktualizuji user objekt na pozadí...");
        refreshUser()
          .then(() => {
            console.log("[ProfileSettings] User objekt aktualizován, slug by měl být:", slugifyNickname(trimmed));
          })
          .catch((err) => {
            console.error("[ProfileSettings] Chyba při refreshUser:", err);
            // Necháme to projít, protože přezdívka už je uložená
          });
      }

      // Pokud jsme nahráli avatar, už máme URL, takže nemusíme načítat z DB
      // Pokud jsme nenahráli avatar, ale změnili jsme nickname, načteme avatar z DB na pozadí
      if (!uploadedAvatarUrl && user?.uid) {
        fetch(`/api/users/${user.uid}?t=${Date.now()}`, {
          credentials: "include",
          cache: "no-store",
        })
          .then((profileRes) => {
            if (profileRes.ok) {
              return profileRes.json();
            }
            return null;
          })
          .then((profileData) => {
            if (profileData?.data?.avatarUrl) {
              const dbAvatarUrl = profileData.data.avatarUrl;
              if (dbAvatarUrl && dbAvatarUrl.trim() !== "") {
                const isGooglePhoto = dbAvatarUrl.includes("googleusercontent.com") ||
                  dbAvatarUrl.includes("google.com");
                if (!isGooglePhoto) {
                  setAvatarUrl(dbAvatarUrl);
                }
              }
            }
          })
          .catch((err) => {
            console.error("[ProfileSettings] Chyba při načítání avatara po uložení:", err);
          });
      }
    } catch (err: any) {
      console.error("[ProfileSettings] Chyba při aktualizaci nicknamu:", err);
      const errorMessage = err.message || "Chyba při aktualizaci přezdívky";
      setNicknameError(errorMessage);
      toast.error(errorMessage);
    } finally {
      console.log("[ProfileSettings] Nastavuji saving na false");
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validace typu
    if (!file.type.startsWith("image/")) {
      toast.error("Vyberte prosím obrázek");
      return;
    }

    // Validace velikosti (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Maximální velikost souboru je 5 MB");
      return;
    }

    // Zobrazit crop modal
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCropImageSrc(result);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedImageBlob: Blob) => {
    setShowCropModal(false);
    
    // Uložit blob do state a vytvořit preview URL
    setPendingAvatarBlob(croppedImageBlob);
    const previewUrl = URL.createObjectURL(croppedImageBlob);
    setPendingAvatarPreview(previewUrl);
    
    // Vyčistit file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadAvatar = async (blob: Blob): Promise<string | null> => {
    try {
      // Získat access token pro autorizaci (s timeoutem)
      const accessToken = await getAccessToken();

      const formData = new FormData();
      formData.append("file", blob, "avatar.jpg");

      const headers: HeadersInit = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      // Přidat timeout pro request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error("[ProfileSettings] Avatar upload timeout!");
        controller.abort();
      }, 60000); // 60 sekund timeout pro upload

      let res: Response;
      try {
        res = await fetch("/api/users/avatar", {
          method: "POST",
          headers,
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        console.log("[ProfileSettings] Avatar upload dokončen, status:", res.status);
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        console.error("[ProfileSettings] Avatar upload fetch error:", fetchErr);
        if (fetchErr.name === "AbortError") {
          throw new Error("Nahrávání avatara trvalo příliš dlouho. Zkuste to prosím znovu.");
        }
        throw fetchErr;
      }

      let data: any;
      try {
        const responseText = await res.text();
        console.log("[ProfileSettings] Avatar upload response:", responseText.substring(0, 200));
        data = JSON.parse(responseText);
      } catch (parseErr) {
        console.error("[ProfileSettings] Chyba při parsování avatar upload response:", parseErr);
        throw new Error("Neplatná odpověď ze serveru při nahrávání avatara");
      }

      if (!res.ok) {
        throw new Error(data.error || "Chyba při nahrávání avatara");
      }

      const avatarUrl = data.avatarUrl && data.avatarUrl.trim() !== "" ? data.avatarUrl : null;
      if (!avatarUrl) {
        console.warn("[ProfileSettings] Avatar upload úspěšný, ale URL není v response");
      }
      return avatarUrl;
    } catch (err: any) {
      console.error("[ProfileSettings] Chyba při nahrávání avatara:", err);
      throw err;
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm("Opravdu chcete odstranit profilovou fotku?")) {
      return;
    }

    setAvatarUploading(true);

    try {
      // Získat access token pro autorizaci (s timeoutem)
      const accessToken = await getAccessToken();

      const headers: HeadersInit = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const res = await fetch("/api/users/avatar", {
        method: "DELETE",
        headers,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Chyba při mazání avatara");
      }

      // Odstranit avatar z state
      setAvatarUrl(null);

      // Aktualizovat uživatele na pozadí
      refreshUser?.().catch((err) => {
        console.error("[ProfileSettings] Chyba při refreshUser po smazání avatara:", err);
      });

      toast.success("Profilová fotka byla odstraněna");
    } catch (err: any) {
      console.error("Chyba při mazání avatara:", err);
      toast.error(err.message || "Chyba při mazání avatara");
    } finally {
      setAvatarUploading(false);
    }
  };

  const getInitial = (nickname?: string) => {
    if (!nickname) return "?";
    return nickname.charAt(0).toUpperCase();
  };

  // Aktualizovat displayInitial když se změní nickname
  useEffect(() => {
    if (nickname) {
      setDisplayInitial(getInitial(nickname));
    } else if (user?.nickname) {
      setDisplayInitial(getInitial(user.nickname));
    } else {
      setDisplayInitial("?");
    }
  }, [nickname, user?.nickname]);

  return (
    <>
      <h1 className="text-2xl font-semibold mb-6">Osobní údaje</h1>

      {/* Avatar sekce */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Profilová fotka
        </label>
        <div className="flex items-center gap-4">
          <div className="relative">
            {/* Zobrazit pending preview, pokud existuje, jinak aktuální avatar */}
            {pendingAvatarPreview ? (
              <img
                src={pendingAvatarPreview}
                alt="Náhled profilové fotky"
                className="w-24 h-24 rounded-full object-cover border-2 border-blue-400 border-dashed"
              />
            ) : avatarUrl && avatarUrl.trim() !== "" ? (
              <img
                src={avatarUrl}
                alt="Profilová fotka"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                onError={(e) => {
                  // Pokud se obrázek nenačte, zobrazit iniciál
                  setAvatarUrl(null);
                }}
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-3xl font-semibold border-2 border-gray-200">
                {displayInitial}
              </div>
            )}
            {avatarUploading && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {pendingAvatarPreview && (
              <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                Nový
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAvatarClick}
              disabled={avatarUploading || saving}
            >
              {pendingAvatarPreview ? "Změnit fotku" : avatarUrl ? "Změnit fotku" : "Nahrát fotku"}
            </Button>
            {(avatarUrl || pendingAvatarPreview) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Zrušit pending avatar nebo smazat aktuální
                  if (pendingAvatarPreview) {
                    URL.revokeObjectURL(pendingAvatarPreview);
                    setPendingAvatarPreview(null);
                    setPendingAvatarBlob(null);
                  } else {
                    handleRemoveAvatar();
                  }
                }}
                disabled={avatarUploading || saving}
              >
                {pendingAvatarPreview ? "Zrušit" : "Odstranit"}
              </Button>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Nickname formulář */}
      <form onSubmit={handleNicknameSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="nickname"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Přezdívka
          </label>
          <div className="relative">
            <Input
              id="nickname"
              type="text"
              value={nickname}
              onChange={handleNicknameChange}
              placeholder="Vaše přezdívka"
              className={`pr-10 ${
                nicknameError
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : nicknameAvailable === true && nickname.trim().length >= 3
                  ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                  : ""
              }`}
              disabled={saving || loadingNickname}
            />
            {nicknameChecking && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!nicknameChecking && nicknameAvailable === true && nickname.trim().length >= 3 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                ✓
              </div>
            )}
            {!nicknameChecking && nicknameAvailable === false && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                ✗
              </div>
            )}
          </div>
          {nicknameError && (
            <p className="mt-1 text-sm text-red-600">{nicknameError}</p>
          )}
          {!nicknameError && nickname.trim().length > 0 && nickname.trim().length < 3 && (
            <p className="mt-1 text-sm text-gray-500">
              Přezdívka musí mít alespoň 3 znaky
            </p>
          )}
        </div>

        <div className="flex gap-3 items-center">
          <Button type="submit" variant="primary" loading={saving} disabled={avatarUploading}>
            Uložit změny
          </Button>
          {pendingAvatarPreview && (
            <span className="text-sm text-gray-500">
              (Nový avatar bude nahrán po uložení)
            </span>
          )}
        </div>
      </form>

      {/* Crop modal */}
      {showCropModal && (
        <AvatarCropModal
          imageSrc={cropImageSrc}
          onClose={() => {
            setShowCropModal(false);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
