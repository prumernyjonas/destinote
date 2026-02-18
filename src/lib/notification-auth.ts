/**
 * Vrací hlavičky pro autentizované requesty na API notifikací.
 * Klient používá createClient() se session v localStorage, zatímco server
 * čte cookies – proto session k API nedorazí. Posíláme access_token v Bearer.
 */
import { supabase } from "@/lib/supabase/client";

export async function getNotificationAuthHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}
