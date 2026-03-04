"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { PageLoading } from "@/components/ui/PageLoading";

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
    return <PageLoading />;
  }
  if (!allowed) {
    return null;
  }
  return <>{children}</>;
}
