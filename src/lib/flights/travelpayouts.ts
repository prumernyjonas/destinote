/**
 * Travelpayouts Flight Data API integrace
 * Server-only modul pro získávání cacheovaných dealů
 */

export type FlightDeal = {
  origin: string;
  destination: string;
  price: number;
  airline?: string | null;
  departuredate: string; // ISO
  returndate?: string | null;
  link: string;
};

type TravelpayoutsResponse = {
  data?: Array<{
    destination: string;
    price: number;
    airline?: string;
    departure_at?: string;
    return_at?: string;
    link?: string;
  }>;
  error?: string;
};

/**
 * Vytvoří stabilní Aviasales search URL s query parametry
 * Používá formát podle Travelpayouts dokumentace
 */
export function buildAviasalesLink({
  origin,
  destination,
  departDate,
  returnDate,
  marker,
  currency = "czk",
  locale = "cs",
}: {
  origin: string;
  destination: string;
  departDate: string; // YYYY-MM-DD
  returnDate?: string | null; // YYYY-MM-DD
  marker: string;
  currency?: string;
  locale?: string;
}): string {
  // Použijeme www.aviasales.com s parametry podle Travelpayouts dokumentace
  // Pro českou/anglickou verzi použijeme locale=cs nebo locale=en
  // Pokud není return_date, použijeme oneway=true
  // Použijeme hlavní doménu www.aviasales.com místo search.aviasales.com pro lepší lokalizaci
  const baseUrl = "https://www.aviasales.com/flights/";
  const params = new URLSearchParams({
    origin_iata: origin.toUpperCase(),
    destination_iata: destination.toUpperCase(),
    depart_date: departDate,
    adults: "1", // Default 1 dospělý
    children: "0",
    infants: "0",
    trip_class: "0", // 0 = economy
    marker: marker,
  });

  // Přidáme currency a locale pro správnou lokalizaci (cs nebo en, ne ru)
  // Pokud je locale cs, použijeme cs, jinak použijeme en (angličtina)
  const finalLocale = locale && locale.toLowerCase() === "cs" ? "cs" : "en";
  params.set("locale", finalLocale);

  if (currency) {
    params.set("currency", currency.toLowerCase());
  }

  if (returnDate) {
    params.set("return_date", returnDate);
  } else {
    // Pro jednosměrné lety přidáme oneway=true
    params.set("oneway", "true");
  }

  // Vytvoříme finální URL
  const finalUrl = `${baseUrl}?${params.toString()}`;

  return finalUrl;
}

/**
 * Získá cacheované dealy z Travelpayouts Flight Data API
 * Používá endpoint pro populární destinace (levné lety z originu)
 */
export async function fetchDeals({
  origin,
  currency = "czk",
  limit = 50,
}: {
  origin: string;
  currency?: string;
  limit?: number;
}): Promise<FlightDeal[]> {
  const token = process.env.TRAVELPAYOUTS_TOKEN;
  const marker = process.env.TRAVELPAYOUTS_MARKER;

  if (!token) {
    throw new Error("TRAVELPAYOUTS_TOKEN není nastaven");
  }

  if (!marker) {
    throw new Error("TRAVELPAYOUTS_MARKER není nastaven");
  }

  // Debug: zkontroluj token (bez zobrazení celého tokenu)
  console.log("Travelpayouts API config:", {
    hasToken: !!token,
    tokenLength: token?.length || 0,
    tokenPrefix: token?.substring(0, 4) || "N/A",
    hasMarker: !!marker,
    origin: origin.toUpperCase(),
    currency: currency.toLowerCase(),
  });

  // Travelpayouts Flight Data API - populární destinace
  // Zkusíme několik možných endpointů
  const endpoints = [
    `https://api.travelpayouts.com/v1/city-directions`,
    `https://api.travelpayouts.com/v1/popular-destinations`,
    `https://api.travelpayouts.com/v1/prices/cheap`,
  ];

  // Zkusíme obě varianty autentizace: hlavička a URL parametr
  const params = new URLSearchParams({
    origin: origin.toUpperCase(),
    currency: currency.toLowerCase(),
    token: token, // Token také v URL jako fallback
  });

  let apiUrl = endpoints[0]; // Začneme s city-directions

  try {
    // Zkusíme různé endpointy a způsoby autentizace
    let response: Response | null = null;
    let lastError: Error | null = null;

    for (const endpoint of endpoints) {
      apiUrl = endpoint;
      console.log(`Trying endpoint: ${endpoint}`);

      // Zkusíme s hlavičkou
      try {
        response = await fetch(`${apiUrl}?${params.toString()}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-Access-Token": token, // Token v hlavičce
          },
          next: { revalidate: 3600 }, // Cache na 1 hodinu
        });

        if (response.ok) {
          console.log(`Success with endpoint: ${endpoint} (header auth)`);
          break;
        }

        // Pokud 401, zkusíme bez hlavičky (jen token v URL)
        if (response.status === 401) {
          console.log(
            `401 with header for ${endpoint}, trying with token in URL only`
          );
          response = await fetch(`${apiUrl}?${params.toString()}`, {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            next: { revalidate: 3600 },
          });

          if (response.ok) {
            console.log(`Success with endpoint: ${endpoint} (URL token auth)`);
            break;
          }
        }
      } catch (err: any) {
        lastError = err;
        console.log(`Error with endpoint ${endpoint}:`, err.message);
        continue;
      }
    }

    if (!response) {
      throw lastError || new Error("No response from any endpoint");
    }

    if (!response.ok) {
      // Zkusme získat chybovou zprávu z API
      let errorMessage = `Travelpayouts API error: ${response.status}`;
      let errorDetails: any = null;
      try {
        const errorText = await response.text();
        try {
          errorDetails = JSON.parse(errorText);
          if (errorDetails.message) {
            errorMessage = `Travelpayouts API error: ${errorDetails.message}`;
          } else if (errorDetails.error) {
            errorMessage = `Travelpayouts API error: ${errorDetails.error}`;
          }
        } catch {
          errorMessage = `Travelpayouts API error: ${
            response.status
          } - ${errorText.substring(0, 200)}`;
        }
      } catch {
        // Pokud se nepodařilo parsovat, použijeme status
      }
      console.error("Travelpayouts API error details:", {
        status: response.status,
        statusText: response.statusText,
        errorDetails,
        url: `${apiUrl}?origin=${origin.toUpperCase()}&currency=${currency.toLowerCase()}&token=***`,
      });
      throw new Error(errorMessage);
    }

    const apiData = await response.json();

    // Debug: vypiš strukturu odpovědi
    console.log("Travelpayouts API response structure:", {
      hasData: !!apiData.data,
      dataType: typeof apiData.data,
      isArray: Array.isArray(apiData.data),
      isObject: typeof apiData.data === "object" && apiData.data !== null,
      keys:
        apiData.data && typeof apiData.data === "object"
          ? Object.keys(apiData.data).slice(0, 5)
          : null,
      firstItem:
        apiData.data &&
        typeof apiData.data === "object" &&
        !Array.isArray(apiData.data)
          ? Object.values(apiData.data)[0]
          : null,
      rawResponse: JSON.stringify(apiData).substring(0, 500),
    });

    // Travelpayouts API vrací data jako objekt s klíči (destination codes)
    // nebo jako pole, záleží na endpointu
    let dealsArray: any[] = [];

    if (apiData.data && typeof apiData.data === "object") {
      // Pokud je data objekt, převedeme ho na pole
      if (Array.isArray(apiData.data)) {
        dealsArray = apiData.data;
      } else {
        // Objekt s klíči - převedeme na pole hodnot
        dealsArray = Object.values(apiData.data);
      }
    } else if (Array.isArray(apiData)) {
      dealsArray = apiData;
    } else if (apiData && typeof apiData === "object") {
      // Možná je to přímo objekt s destinacemi jako klíči
      dealsArray = Object.values(apiData);
    }

    console.log(`Parsed ${dealsArray.length} deals from API`);

    if (dealsArray.length === 0) {
      console.warn("No deals found in API response");
      return [];
    }

    // Transformace dat do FlightDeal formátu
    const currencyEnv = process.env.TRAVELPAYOUTS_CURRENCY || "czk";
    const localeEnv = process.env.TRAVELPAYOUTS_LOCALE || "cs";

    const deals: FlightDeal[] = dealsArray
      .slice(0, limit)
      .map((item: any) => {
        // Extrahujeme datum ve formátu YYYY-MM-DD z ISO stringu
        const extractDateOnly = (dateStr: string | undefined): string => {
          if (!dateStr) return new Date().toISOString().slice(0, 10);
          // Vezmeme prvních 10 znaků (YYYY-MM-DD) z ISO formátu
          return dateStr.slice(0, 10);
        };

        const departDate = extractDateOnly(
          item.departure_at || item.departuredate
        );
        const returnDate =
          item.return_at || item.returndate
            ? extractDateOnly(item.return_at || item.returndate)
            : null;

        // Vždy generujeme nový Aviasales link (ignorujeme item.link z API)
        const link = buildAviasalesLink({
          origin: origin.toUpperCase(),
          destination: item.destination?.toUpperCase() || "",
          departDate: departDate,
          returnDate: returnDate,
          marker: marker,
          currency: currencyEnv,
          locale: localeEnv,
        });

        // Normalizace datumu pro ukládání do DB - zajistíme ISO formát
        const normalizeDate = (dateStr: string | undefined): string => {
          if (!dateStr) return new Date().toISOString();
          // Pokud už je ISO formát, použijeme ho
          if (dateStr.includes("T")) {
            return dateStr;
          }
          // Pokud je to jen datum YYYY-MM-DD, přidáme čas
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return `${dateStr}T00:00:00Z`;
          }
          return dateStr;
        };

        return {
          origin: origin.toUpperCase(),
          destination: item.destination?.toUpperCase() || "",
          price: item.price || 0,
          airline: item.airline || null,
          departuredate: normalizeDate(item.departure_at || item.departuredate),
          returndate:
            item.return_at || item.returndate
              ? normalizeDate(item.return_at || item.returndate)
              : null,
          link: link,
        };
      })
      .filter((deal) => deal.destination && deal.price > 0);

    console.log(`Filtered to ${deals.length} valid deals`);

    return deals;
  } catch (error) {
    console.error("Error fetching deals from Travelpayouts:", error);

    // Pokud je to 401, token pravděpodobně není platný nebo nemá oprávnění
    if (error instanceof Error && error.message.includes("401")) {
      console.warn(
        "Travelpayouts API returned 401 - token may be invalid or missing permissions"
      );
      console.warn(
        "Returning empty array - check your TRAVELPAYOUTS_TOKEN in .env.local"
      );
    }

    throw error;
  }
}

/**
 * Fallback mock data pro testování UI, když API není dostupné
 */
export function getMockDeals(origin: string, limit: number = 12): FlightDeal[] {
  const destinations = [
    "BCN",
    "LON",
    "PAR",
    "ROM",
    "ATH",
    "AMS",
    "BER",
    "VIE",
    "PRG",
    "BUD",
    "WAW",
    "CPH",
  ];
  const airlines = ["OK", "VY", "LH", "FR", "U2", null];
  const marker = process.env.TRAVELPAYOUTS_MARKER || "";
  const currency = process.env.TRAVELPAYOUTS_CURRENCY || "czk";
  const locale = process.env.TRAVELPAYOUTS_LOCALE || "cs";

  return destinations.slice(0, limit).map((dest, index) => {
    const departDate = new Date();
    departDate.setDate(departDate.getDate() + 7 + index * 3);
    const returnDate = new Date(departDate);
    returnDate.setDate(returnDate.getDate() + 7);

    const price = 2000 + Math.floor(Math.random() * 5000);
    const airline = airlines[Math.floor(Math.random() * airlines.length)];

    // Použijeme stejný formát linku jako pro skutečná data
    const depDateStr = departDate.toISOString().slice(0, 10); // YYYY-MM-DD
    const retDateStr = returnDate.toISOString().slice(0, 10); // YYYY-MM-DD
    const link = buildAviasalesLink({
      origin: origin.toUpperCase(),
      destination: dest,
      departDate: depDateStr,
      returnDate: retDateStr,
      marker: marker,
      currency: currency,
      locale: locale,
    });

    return {
      origin: origin.toUpperCase(),
      destination: dest,
      price,
      airline,
      departuredate: departDate.toISOString(),
      returndate: returnDate.toISOString(),
      link,
    };
  });
}
