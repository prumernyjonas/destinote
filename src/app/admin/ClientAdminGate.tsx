"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function ClientAdminGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Získáme userId z localStorage (stejně jako RoleLogger)
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

        // Sestavíme URL s userId jako query parametr
        const apiUrl = userId
          ? `/api/auth/role?userId=${encodeURIComponent(userId)}`
          : "/api/auth/role";

        const res = await fetch(apiUrl, {
          cache: "no-store",
        });

        if (!res.ok) {
          setAllowed(false);
          router.replace("/");
          return;
        }
        const j = await res.json();
        const isAdmin = !!j?.isAdmin;
        if (cancelled) return;
        if (!isAdmin) {
          setAllowed(false);
          router.replace("/");
        } else {
          setAllowed(true);
        }
      } catch {
        if (!cancelled) {
          setAllowed(false);
          router.replace("/");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (allowed === null) {
    return null;
  }
  if (!allowed) {
    return null;
  }
  return <>{children}</>;
}
