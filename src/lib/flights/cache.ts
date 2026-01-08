/**
 * Cache modul pro ukládání flight dealů do Supabase
 * Používá server-side Supabase klient s Service Role
 */

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fetchDeals, getMockDeals, type FlightDeal } from "./travelpayouts";

/**
 * Aktualizuje nebo vloží flight dealy do Supabase
 * Pro každý deal:
 * - najde existující řádek podle origin + destination + departuredate + returndate
 * - existuje → update (price, airline, link)
 * - neexistuje → insert
 * - created_at neměň, nic nemaž
 */
export async function refreshDealsToSupabase({
  origin,
  limit = 50,
}: {
  origin: string;
  limit?: number;
}): Promise<FlightDeal[]> {
  const supabase = createAdminSupabaseClient();

  try {
    // Získání dealů z Travelpayouts API
    const currency = process.env.TRAVELPAYOUTS_CURRENCY || "czk";
    console.log(
      `Fetching deals from Travelpayouts: origin=${origin}, currency=${currency}, limit=${limit}`
    );

    const deals = await fetchDeals({ origin, currency, limit });

    console.log(`Received ${deals.length} deals from Travelpayouts API`);

    if (deals.length === 0) {
      // Pokud fetch selže nebo je prázdný, vrať poslední data z DB
      const { data: existingDeals, error: fetchError } = await supabase
        .from("flights")
        .select("*")
        .eq("origin", origin.toUpperCase())
        .order("created_at", { ascending: false })
        .limit(limit);

      if (fetchError) {
        console.error("Error fetching existing deals:", fetchError);
        return [];
      }

      const dbDeals = (existingDeals || []).map((row) => ({
        origin: row.origin,
        destination: row.destination,
        price: row.price,
        airline: row.airline,
        departuredate: row.departure_date,
        returndate: row.return_date,
        link: row.link,
      }));

      return dbDeals;
    }

    // Pro každý deal zkontroluj, zda existuje, a aktualizuj nebo vlož
    const results: FlightDeal[] = [];
    let insertedCount = 0;
    let updatedCount = 0;

    for (const deal of deals) {
      // Najdi existující řádek podle origin + destination + departuredate + returndate
      let query = supabase
        .from("flights")
        .select("id")
        .eq("origin", deal.origin)
        .eq("destination", deal.destination)
        .eq("departure_date", deal.departuredate);

      if (deal.returndate) {
        query = query.eq("return_date", deal.returndate);
      } else {
        query = query.is("return_date", null);
      }

      const { data: existing, error: findError } = await query.maybeSingle();

      if (findError && findError.code !== "PGRST116") {
        // PGRST116 = no rows returned, což je OK
        console.error("Error finding existing flight:", findError);
        continue;
      }

      if (existing) {
        // Update existujícího řádku (price, airline, link)
        const { error: updateError } = await supabase
          .from("flights")
          .update({
            price: deal.price,
            airline: deal.airline,
            link: deal.link,
          })
          .eq("id", existing.id);

        if (updateError) {
          console.error("Error updating flight:", updateError);
          continue;
        }
        updatedCount++;
      } else {
        // Insert nového řádku
        console.log(
          `Inserting new flight: ${deal.origin} -> ${deal.destination}, price: ${deal.price}, date: ${deal.departuredate}`
        );
        const { data: insertedData, error: insertError } = await supabase
          .from("flights")
          .insert({
            origin: deal.origin,
            destination: deal.destination,
            price: deal.price,
            airline: deal.airline,
            departure_date: deal.departuredate,
            return_date: deal.returndate,
            link: deal.link,
            // created_at se nastaví automaticky (default now())
          })
          .select();

        if (insertError) {
          console.error("Error inserting flight:", insertError);
          console.error("Deal data:", JSON.stringify(deal, null, 2));
          continue;
        }
        console.log(
          `Successfully inserted flight ID: ${
            insertedData?.[0]?.id || "unknown"
          }`
        );
        insertedCount++;
      }

      results.push(deal);
    }

    console.log(
      `Saved to Supabase: ${insertedCount} inserted, ${updatedCount} updated, ${results.length} total`
    );

    // Ověříme, že se data skutečně uložila
    const { data: verifyData, error: verifyError } = await supabase
      .from("flights")
      .select("id, origin, destination, price")
      .eq("origin", origin.toUpperCase())
      .limit(5);

    if (verifyError) {
      console.error("Error verifying saved data:", verifyError);
    } else {
      console.log(
        `Verified: ${
          verifyData?.length || 0
        } flights in DB for ${origin.toUpperCase()}`
      );
      if (verifyData && verifyData.length > 0) {
        console.log("Sample saved flight:", verifyData[0]);
      }
    }

    return results;
  } catch (error) {
    console.error("Error refreshing deals to Supabase:", error);

    // Když fetch selže, vrať poslední data z DB
    try {
      const { data: existingDeals, error: fetchError } = await supabase
        .from("flights")
        .select("*")
        .eq("origin", origin.toUpperCase())
        .order("created_at", { ascending: false })
        .limit(limit);

      if (fetchError) {
        console.error("Error fetching existing deals:", fetchError);
        return [];
      }

      const dbDeals = (existingDeals || []).map((row) => ({
        origin: row.origin,
        destination: row.destination,
        price: row.price,
        airline: row.airline,
        departuredate: row.departure_date,
        returndate: row.return_date,
        link: row.link,
      }));

      return dbDeals;
    } catch (fallbackError) {
      console.error("Error in fallback:", fallbackError);
      return [];
    }
  }
}
