import { NextRequest, NextResponse } from "next/server";
import { refreshDealsToSupabase } from "@/lib/flights/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getMockDeals, type FlightDeal } from "@/lib/flights/travelpayouts";
import { buildKiwiLink, validateKiwiLinks } from "@/lib/flights/kiwi";
import { buildAviasalesLink } from "@/lib/flights/travelpayouts";

/**
 * Rozšířený FlightDeal s buyLink pro UI
 */
type FlightDealWithBuyLink = FlightDeal & {
  buyLink: string;
};

/**
 * GET /api/flights/deals
 * Query params:
 * - origin: IATA kód letiště (např. PRG)
 * - limit: počet výsledků (default 12)
 * - refresh: pokud = "1", aktualizuje dealy z Travelpayouts API
 * - provider: "kiwi" (default) nebo "aviasales"
 * - validate: "1" (default pro kiwi) nebo "0" (pro rychlost)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const origin =
      searchParams.get("origin") || process.env.TRAVELPAYOUTS_ORIGIN || "PRG";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 12;
    const refresh = searchParams.get("refresh") === "1";
    const provider = searchParams.get("provider") || "kiwi"; // "kiwi" nebo "aviasales"
    const validateParam = searchParams.get("validate");
    // Pro kiwi je default validate=1, pro aviasales validate=0
    const shouldValidate =
      validateParam === "1" || (validateParam === null && provider === "kiwi");

    if (!origin) {
      return NextResponse.json(
        { error: "Origin parameter is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Pokud je refresh=1, aktualizuj dealy z Travelpayouts API
    if (refresh) {
      try {
        console.log(`Refreshing deals for origin: ${origin.toUpperCase()}`);
        const refreshedDeals = await refreshDealsToSupabase({
          origin: origin.toUpperCase(),
          limit,
        });
        console.log(`Refresh completed: ${refreshedDeals.length} deals`);
      } catch (refreshError: any) {
        console.error("Error refreshing deals:", refreshError);
        console.error("Error details:", {
          message: refreshError?.message,
          stack: refreshError?.stack,
        });
        // Pokud je to 401, token není platný - použijeme mock data
        if (refreshError?.message?.includes("401")) {
          console.warn("API returned 401 - using mock data for testing");
          const mockDeals = getMockDeals(origin.toUpperCase(), limit);
          // Uložíme mock data do DB pro další použití
          try {
            const supabase = createAdminSupabaseClient();
            for (const deal of mockDeals) {
              const { error: upsertError } = await supabase
                .from("flights")
                .upsert(
                  {
                    origin: deal.origin,
                    destination: deal.destination,
                    price: deal.price,
                    airline: deal.airline,
                    departure_date: deal.departuredate,
                    return_date: deal.returndate,
                    link: deal.link,
                  },
                  {
                    onConflict: "origin,destination,departure_date,return_date",
                  }
                );
              if (upsertError) {
                console.error("Error upserting mock deal:", upsertError);
              }
            }
          } catch (dbError) {
            console.error("Error saving mock data to DB:", dbError);
          }
        }
        // Pokračujeme dál, načteme z DB i když refresh selhal
      }
    }

    // Načti dealy z DB: filter origin, order created_at DESC, sekundárně price ASC, limit
    const originUpper = origin.toUpperCase();
    console.log(
      `Fetching flights from DB: origin=${originUpper}, limit=${limit}`
    );

    // Nejdřív zkontrolujme, kolik řádků je celkem v tabulce
    const { count: totalCount, error: countError } = await supabase
      .from("flights")
      .select("*", { count: "exact", head: true })
      .eq("origin", originUpper);

    console.log(`Total flights in DB for ${originUpper}: ${totalCount || 0}`);

    const { data: flights, error: dbError } = await supabase
      .from("flights")
      .select("*")
      .eq("origin", originUpper)
      .order("created_at", { ascending: false })
      .order("price", { ascending: true })
      .limit(limit);

    if (dbError) {
      console.error("Error fetching flights from DB:", dbError);
      console.error("DB error details:", {
        message: dbError.message,
        code: dbError.code,
        details: dbError.details,
        hint: dbError.hint,
      });
      return NextResponse.json(
        { error: "Failed to fetch flights", details: dbError.message },
        { status: 500 }
      );
    }

    console.log(
      `Found ${flights?.length || 0} flights in DB for origin ${originUpper}`
    );

    if (flights && flights.length > 0) {
      console.log("Sample flight from DB:", {
        id: flights[0].id,
        origin: flights[0].origin,
        destination: flights[0].destination,
        price: flights[0].price,
      });
    }

    // Transformace do FlightDeal formátu
    const deals: FlightDeal[] = (flights || []).map((row) => ({
      origin: row.origin,
      destination: row.destination,
      price: row.price,
      airline: row.airline,
      departuredate: row.departure_date,
      returndate: row.return_date,
      link: row.link,
    }));

    // Vytvoříme buyLink pro každý deal podle provideru
    const affilid = process.env.KIWI_AFFILID || "";
    const kiwiCurrency = process.env.KIWI_CURRENCY || "czk";
    const kiwiLocale = process.env.KIWI_LOCALE || "cs";
    const marker = process.env.TRAVELPAYOUTS_MARKER || "";
    const aviasalesCurrency = process.env.TRAVELPAYOUTS_CURRENCY || "czk";
    const aviasalesLocale = process.env.TRAVELPAYOUTS_LOCALE || "cs";

    const dealsWithBuyLink: FlightDealWithBuyLink[] = deals.map((deal) => {
      // Extrahujeme datum ve formátu YYYY-MM-DD
      const departDate = deal.departuredate.slice(0, 10);
      const returnDate = deal.returndate ? deal.returndate.slice(0, 10) : null;

      let buyLink: string;

      if (provider === "kiwi") {
        if (!affilid) {
          console.warn("KIWI_AFFILID není nastaven, nelze vytvořit Kiwi link");
          buyLink = deal.link; // Fallback na Aviasales link
        } else {
          buyLink = buildKiwiLink({
            origin: deal.origin,
            destination: deal.destination,
            departDate: departDate,
            returnDate: returnDate,
            affilid: affilid,
            currency: kiwiCurrency,
            locale: kiwiLocale,
          });
        }
      } else {
        // Aviasales - použijeme stávající buildAviasalesLink
        buyLink = buildAviasalesLink({
          origin: deal.origin,
          destination: deal.destination,
          departDate: departDate,
          returnDate: returnDate,
          marker: marker,
          currency: aviasalesCurrency,
          locale: aviasalesLocale,
        });
      }

      return {
        ...deal,
        buyLink,
      };
    });

    // Validace Kiwi linků (pokud provider=kiwi a validate=1)
    let validatedDeals = dealsWithBuyLink;
    let filteredOut = 0;

    if (provider === "kiwi" && shouldValidate && affilid) {
      // Validujeme maximálně prvních 12 linků, aby to nebylo pomalé
      const maxValidation = Math.min(12, validatedDeals.length);
      const toValidate = validatedDeals.slice(0, maxValidation);
      const rest = validatedDeals.slice(maxValidation);

      console.log(
        `Validating ${toValidate.length} Kiwi links (max ${maxValidation})`
      );

      const urls = toValidate.map((deal) => deal.buyLink);
      const validationResults = await validateKiwiLinks(urls, 5, 5000);

      // Filtrujeme nevalidní dealy
      validatedDeals = [
        ...toValidate.filter((deal) => validationResults.get(deal.buyLink)),
        ...rest, // Zbytek nevalidujeme, ale zahrneme
      ];

      filteredOut = dealsWithBuyLink.length - validatedDeals.length;
      console.log(
        `Kiwi validation: ${validatedDeals.length} valid, ${filteredOut} filtered out`
      );
    }

    // updatedAt je max(created_at) z vrácených řádků
    const updatedAt =
      flights && flights.length > 0
        ? Math.max(
            ...flights
              .map((f) => (f.created_at ? new Date(f.created_at).getTime() : 0))
              .filter((t) => t > 0)
          )
        : null;

    return NextResponse.json({
      deals: validatedDeals,
      updatedAt: updatedAt ? new Date(updatedAt).toISOString() : null,
      provider: provider as "kiwi" | "aviasales",
      filteredOut,
    });
  } catch (error: any) {
    console.error("Error in /api/flights/deals:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
