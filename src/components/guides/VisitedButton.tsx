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
  console.log(`[VisitedButton] 🎨 Render - ISO2: ${iso2}, countryName: ${countryName}, initialVisited: ${initialVisited}`);
  const [visited, setVisited] = useState(initialVisited);
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<"adding" | "removing" | null>(null); // Typ akce během loading
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  
  console.log(`[VisitedButton] 👤 User: ${user?.uid || 'not logged in'}, visited state: ${visited}, loading: ${loading}`);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Aktualizovat stav, pokud se změní initialVisited (např. po refreshi)
  useEffect(() => {
    console.log(`[VisitedButton] 🔄 initialVisited changed: ${initialVisited} for ISO2: ${iso2}`);
    setVisited(initialVisited);
  }, [initialVisited, iso2]);

  // Načíst všechny navštívené země uživatele a zkontrolovat, jestli je aktuální země navštívená
  // Použít client-side kontrolu (stejně jako na mapě), protože je spolehlivější než server-side
  useEffect(() => {
    if (!mounted || !user) return;
    
    const loadVisitedCountries = async () => {
      try {
        console.log(`[VisitedButton] 🔄 Loading visited countries for user ${user.uid}...`);
        const response = await fetch(
          `/api/visited?userId=${encodeURIComponent(user.uid)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": user.uid,
            },
          }
        );
        
        if (response.ok) {
          const result = await response.json();
          const visitedCountries = result.data || [];
          const visitedIso2s = visitedCountries.map((c: any) => c.iso2);
          console.log(`[VisitedButton] 📋 User ${user.uid} has ${visitedIso2s.length} visited countries:`, visitedIso2s);
          
          const upperIso2 = iso2.toUpperCase();
          const isActuallyVisited = visitedIso2s.includes(upperIso2);
          console.log(`[VisitedButton] 🔍 Current country ISO2: ${upperIso2}, is in list: ${isActuallyVisited}`);
          console.log(`[VisitedButton] 🔄 initialVisited from server: ${initialVisited}, actual from API: ${isActuallyVisited}`);
          
          // Vždy použít hodnotu z API (client-side kontrola je spolehlivější než server-side)
          if (isActuallyVisited !== visited) {
            console.log(`[VisitedButton] ✅ Updating visited state from ${visited} to ${isActuallyVisited} (using API data)`);
            setVisited(isActuallyVisited);
          } else {
            console.log(`[VisitedButton] ✅ State is correct: ${visited}`);
          }
        } else {
          console.error(`[VisitedButton] ❌ Failed to load visited countries: ${response.status}`);
        }
      } catch (error) {
        console.error("[VisitedButton] ❌ Error loading visited countries:", error);
      }
    };
    
    loadVisitedCountries();
  }, [mounted, user, iso2]); // Odstranit initialVisited a visited z dependencies, aby se nevolalo zbytečně

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
      console.log(`[VisitedButton] 🚀 ${currentlyVisited ? 'Removing' : 'Adding'} country ${upperIso2} for user ${user.uid}`);
      
      // Použít stejný endpoint jako na mapě: /api/visited s iso2
      if (currentlyVisited) {
        // Odebrat zemi
        console.log(`[VisitedButton] 🗑️ DELETE /api/visited?iso2=${upperIso2}&userId=${user.uid}`);
        const delRes = await fetch(
          `/api/visited?iso2=${upperIso2}&userId=${encodeURIComponent(user.uid)}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": user.uid,
            },
          }
        );
        console.log(`[VisitedButton] 📥 DELETE response status: ${delRes.status}`);
        if (!delRes.ok) {
          let message = `DELETE /api/visited ${delRes.status}`;
          try {
            const j = await delRes.json();
            console.error("[VisitedButton] ❌ DELETE error response:", j);
            if (j?.error) message = j.error;
          } catch {}
          throw new Error(message);
        }
        console.log(`[VisitedButton] ✅ Successfully removed country ${upperIso2}`);
      } else {
        // Přidat zemi
        console.log(`[VisitedButton] ➕ POST /api/visited?iso2=${upperIso2}&userId=${user.uid}`);
        const postRes = await fetch(
          `/api/visited?iso2=${upperIso2}&userId=${encodeURIComponent(user.uid)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": user.uid,
            },
            body: JSON.stringify({ iso2: upperIso2 }),
          }
        );
        console.log(`[VisitedButton] 📥 POST response status: ${postRes.status}`);
        if (!postRes.ok) {
          let message = `POST /api/visited ${postRes.status}`;
          try {
            const j = await postRes.json();
            console.error("[VisitedButton] ❌ POST error response:", j);
            if (j?.error) message = j.error;
          } catch {}
          throw new Error(message);
        }
        const result = await postRes.json();
        console.log(`[VisitedButton] ✅ Successfully added country ${upperIso2}:`, result);
      }
      
      // Aktualizovat stav tlačítka
      setVisited(!currentlyVisited);
      // Refresh stránku pro aktualizaci statistik a server komponenty
      router.refresh();
    } catch (error) {
      // Revert optimistic update při chybě
      setVisited(previousVisited);
      console.error("Chyba při označení země:", error);
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
