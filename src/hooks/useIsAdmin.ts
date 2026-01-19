"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      
      // Získáme userId z localStorage (stejně jako ClientAdminGate)
      let userId: string | null = null;
      try {
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          if (key.includes("supabase") || key.includes("auth")) {
            try {
              const value = localStorage.getItem(key);
              if (value) {
                const parsed = JSON.parse(value);
                if (parsed?.user?.id) {
                  userId = parsed.user.id;
                  break;
                }
              }
            } catch {}
          }
        }
      } catch {}

      // Sestavíme URL s userId jako query parametr (stejně jako ClientAdminGate)
      const apiUrl = userId
        ? `/api/auth/role?userId=${encodeURIComponent(userId)}`
        : "/api/auth/role";

      const res = await fetch(apiUrl, {
        cache: "no-store",
      });

      if (!res.ok) {
        setIsAdmin(false);
        return;
      }

      const j = await res.json();
      console.log("👤 ROLE UŽIVATELE:", j?.role || "NENÍ");
      setIsAdmin(!!j?.isAdmin && j?.role === "admin");
    } catch (err) {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return { isAdmin, loading };
}
