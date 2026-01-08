"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export default function RoleLogger() {
  useEffect(() => {
    let alive = true;
    const timeoutId = setTimeout(() => {
      if (alive) {
        console.warn(
          "[RoleLogger] Timeout after 10 seconds - operation took too long"
        );
      }
    }, 10000);

    (async () => {
      try {
        console.log("[RoleLogger] Starting role check...");
        console.log(
          "[RoleLogger] Supabase client:",
          supabase ? "OK" : "MISSING"
        );
        // Použijeme přímo API endpoint, protože Supabase auth metody se zasekávají
        console.log("[RoleLogger] Fetching /api/auth/role directly...");

        let role: string | null = null;
        let apiError: any = null;
        let userId: string | null = null;

        // Nejdřív zkusíme získat userId z localStorage
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
                    console.log(
                      "[RoleLogger] Found userId in localStorage:",
                      userId
                    );
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

        try {
          const res = await fetch(apiUrl, {
            cache: "no-store",
          });
          console.log("[RoleLogger] API response status:", res.status);

          if (!res.ok) {
            const errorText = await res.text();
            // Během přihlašování je normální, že není session - nebudeme to logovat jako error
            if (res.status === 401) {
              console.log(
                "[RoleLogger] User not authenticated (this is normal during login)"
              );
            } else {
              console.warn("[RoleLogger] API error response:", errorText);
            }
            apiError = { status: res.status, text: errorText };
          } else {
            const j = await res.json();
            console.log("[RoleLogger] API response data:", j);
            role = typeof j?.role === "string" ? j.role : null;
            console.log("[RoleLogger] Role from API:", role);

            // Zkusíme získat userId z API response (pokud jsme ho neposlali)
            if (j?.userId && !userId) {
              userId = j.userId;
            }
          }
        } catch (err) {
          console.error("[RoleLogger] API fetch exception:", err);
          apiError = err;
        }

        console.log("[RoleLogger] User ID:", userId || "NOT LOGGED IN");

        // Fallback: pokud API selhalo, zkusíme přímý dotaz na Supabase
        if (!role && userId) {
          console.log(
            "[RoleLogger] API failed, trying direct Supabase query for userId:",
            userId
          );
          try {
            console.log("[RoleLogger] Executing Supabase query...");
            const queryPromise = supabase
              .from("users")
              .select("role")
              .eq("id", userId)
              .maybeSingle();

            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error("Query timeout after 3s")),
                3000
              )
            );

            const result = await Promise.race([queryPromise, timeoutPromise]);
            const { data: row, error: queryError } = result as any;

            console.log("[RoleLogger] Query completed");

            if (queryError) {
              console.error("[RoleLogger] Users query error:", queryError);
              console.error(
                "[RoleLogger] Error details:",
                JSON.stringify(queryError, null, 2)
              );
            } else {
              console.log("[RoleLogger] Users query result:", row);
              if (row?.role) {
                role = String(row.role);
                console.log("[RoleLogger] Role from direct query:", role);
              } else {
                console.warn("[RoleLogger] No role found in query result");
              }
            }
          } catch (queryErr: any) {
            if (queryErr?.message?.includes("timeout")) {
              console.warn(
                "[RoleLogger] Query timed out - RLS likely blocking client access"
              );
              console.warn(
                "[RoleLogger] To check role, run this SQL in Supabase:"
              );
              console.warn(
                `[RoleLogger] SELECT role FROM users WHERE id = '${userId}';`
              );
            } else {
              console.error("[RoleLogger] Direct query exception:", queryErr);
            }
          }
        }

        if (!alive) return;

        const finalRole = role || "unknown";
        console.log("========================================");
        console.log("🔐 USER ID:", userId || "NOT LOGGED IN");
        console.log("🔐 USER ROLE:", finalRole);
        if (finalRole === "unknown") {
          console.log("⚠️  Role cannot be determined from client");
          console.log("   Check role in Supabase or use server-side API");
        }
        console.log("========================================");

        // Loguj error jen pokud to není 401 (Unauthorized), což je normální pro nepřihlášené uživatele
        if (finalRole === "unknown" && apiError) {
          const isUnauthorized = apiError.status === 401;
          if (isUnauthorized) {
            // 401 je normální během přihlašování nebo pro nepřihlášené uživatele
            console.log("[RoleLogger] User not authenticated (this is normal)");
          } else {
            // Jiné chyby loguj jako warning
            console.warn(
              "[RoleLogger] Could not determine role. API error:",
              apiError
            );
          }
        }
      } catch (err) {
        if (alive) {
          console.error("[RoleLogger] Unexpected error:", err);
          console.log("========================================");
          console.log("🔐 USER ROLE: unknown (error occurred)");
          console.log("========================================");
        }
      }
    })();
    return () => {
      alive = false;
      clearTimeout(timeoutId);
    };
  }, []);
  return null;
}
