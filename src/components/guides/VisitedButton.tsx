"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";
import { FiCheckCircle } from "react-icons/fi";

type Props = {
  iso2: string;
  initialVisited: boolean;
  countryName: string;
  currentPath: string;
};

export default function VisitedButton({
  iso2,
  initialVisited,
  countryName,
  currentPath,
}: Props) {
  const [visited, setVisited] = useState(initialVisited);
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<"adding" | "removing" | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Aktualizovat stav, pokud se změní initialVisited (např. po refreshi)
  useEffect(() => {
    setVisited(initialVisited);
  }, [initialVisited, iso2]);

  // Načíst všechny navštívené země uživatele a zkontrolovat, jestli je aktuální země navštívená
  useEffect(() => {
    if (!mounted || !user) return;

    const loadVisitedCountries = async () => {
      try {
        const response = await fetch(
          `/api/visited`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        
        if (response.ok) {
          const result = await response.json();
          const visitedCountries = result.data || [];
          const visitedIso2s = visitedCountries.map((c: any) => c.iso2);

          const upperIso2 = iso2.toUpperCase();
          const isActuallyVisited = visitedIso2s.includes(upperIso2);

          if (isActuallyVisited !== visited) {
            setVisited(isActuallyVisited);
          }
        } else if (process.env.NODE_ENV === "development") {
          console.error("[VisitedButton] Failed to load visited countries:", response.status);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("[VisitedButton] Error loading visited countries:", error);
        }
      }
    };

    loadVisitedCountries();
  }, [mounted, user, iso2]);

  const handleClick = async () => {
    if (!user) {
      // Zobrazit zprávu, že funkce vyžaduje přihlášení
      toast.info("Tato funkce vyžaduje přihlášení. Přihlaste se prosím.");
      return;
    }

    const upperIso2 = iso2.toUpperCase();
    const currentlyVisited = visited;

    setLoading(true);
    const previousVisited = visited;
    // Uložit informaci o tom, co se provádí (přidávání nebo odebírání)
    // Pokud je navštívená, odebírám; pokud není, přidávám
    setActionType(currentlyVisited ? "removing" : "adding");
    
    // Optimistic update
    setVisited(!currentlyVisited);

    try {
      if (currentlyVisited) {
        const delRes = await fetch(
          `/api/visited?iso2=${upperIso2}`,
          {
            method: "DELETE",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }
        );
        if (!delRes.ok) {
          let message = `DELETE /api/visited ${delRes.status}`;
          try {
            const j = await delRes.json();
            if (j?.error) message = j.error;
          } catch {}
          throw new Error(message);
        }
      } else {
        const postRes = await fetch(
          `/api/visited?iso2=${upperIso2}`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ iso2: upperIso2 }),
          }
        );
        if (!postRes.ok) {
          let message = `POST /api/visited ${postRes.status}`;
          try {
            const j = await postRes.json();
            if (j?.error) message = j.error;
          } catch {}
          throw new Error(message);
        }
        await postRes.json();
      }
      
      // Aktualizovat stav tlačítka
      setVisited(!currentlyVisited);
      // Refresh stránku pro aktualizaci statistik a server komponenty
      router.refresh();
    } catch (error) {
      // Revert optimistic update při chybě
      setVisited(previousVisited);
      if (process.env.NODE_ENV === "development") {
        console.error("Chyba při označení země:", error);
      }
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  // Počkat na mount, aby se předešlo hydration mismatch
  if (!mounted || authLoading) {
    return (
      <button
        disabled
        className="inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm bg-gray-100 text-gray-700 border border-gray-300"
      >
        <FiCheckCircle className="w-4 h-4 mr-2" />
        Označit jako navštívené
      </button>
    );
  }

  // Pokud není přihlášený, zobrazit tlačítko s toast zprávou
  if (!user) {
    return (
      <button
        onClick={() => {
          toast.info("Tato funkce vyžaduje přihlášení. Přihlaste se prosím.");
        }}
        className="inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 px-4 py-2 text-sm cursor-pointer"
      >
        <FiCheckCircle className="w-4 h-4 mr-2" />
        Označit jako navštívené
      </button>
    );
  }

  // Pokud je navštíveno, zobrazit tlačítko pro odebrání
  if (visited) {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 cursor-pointer"
      >
        <FiCheckCircle className="w-4 h-4 mr-2" />
        {loading ? (actionType === "adding" ? "Ukládám..." : "Odebírám...") : "Navštíveno ✓"}
      </button>
    );
  }

  // Pokud není navštíveno, zobrazit aktivní tlačítko
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 cursor-pointer"
      >
        <FiCheckCircle className="w-4 h-4 mr-2" />
        {loading ? (actionType === "adding" ? "Ukládám..." : "Odebírám...") : "Označit jako navštívené"}
      </button>
  );
}
