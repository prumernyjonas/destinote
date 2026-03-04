"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: HeadersInit = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {};

      const res = await fetch("/api/auth/role", {
        cache: "no-store",
        headers,
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
