import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getUserIdFromRequest } from "@/app/api/_utils/auth";
import { createNotification } from "@/lib/notifications";

/**
 * POST /api/notifications/test
 * Vytvoří jednu testovací notifikaci pro přihlášeného uživatele.
 * Pouze v development (NODE_ENV === 'development').
 * Slouží k ověření, že zápis do DB a zobrazení v UI fungují.
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return new Response(
      JSON.stringify({ error: "Test endpoint je jen pro development" }),
      { status: 404, headers: { "content-type": "application/json" } }
    );
  }

  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return new Response(
      JSON.stringify({
        error: "Nejste přihlášeni",
        hint: "Otevřete konzoli na stránce localhost:3000 v záložce, kde jste přihlášeni (např. po kliknutí na Přihlásit). Pak znovu spusťte fetch.",
      }),
      { status: 401, headers: { "content-type": "application/json" } }
    );
  }

  const admin = createAdminSupabaseClient();

  try {
    await createNotification(admin, {
      userId,
      type: "new_follower",
      title: "Test oznámení",
      body: "Pokud toto vidíte, oznámení fungují.",
      link: "/nastaveni/oznameni",
      metadata: { _test: true, follower_id: userId },
    });
  } catch (e) {
    console.error("[notifications/test] createNotification failed:", e);
    const message = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Vytvoření notifikace selhalo",
        detail: message,
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      message:
        "Testovací notifikace vytvořena. Otevřete zvoník v navbaru nebo Nastavení → Oznámení.",
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}
