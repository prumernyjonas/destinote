/**
 * Kiwi.com affiliate link generování a validace
 * Server-only modul
 */

/**
 * Vytvoří Kiwi.com deeplink s affiliate parametrem
 */
export function buildKiwiLink({
  origin,
  destination,
  departDate,
  returnDate,
  affilid,
  currency = "czk",
  locale = "cs",
}: {
  origin: string;
  destination: string;
  departDate: string; // YYYY-MM-DD
  returnDate?: string | null; // YYYY-MM-DD
  affilid: string;
  currency?: string;
  locale?: string;
}): string {
  const baseUrl = "https://www.kiwi.com/deep";
  const params = new URLSearchParams({
    from: origin.toUpperCase(),
    to: destination.toUpperCase(),
    departure: departDate,
    currency: currency.toLowerCase(),
    lang: locale.toLowerCase(),
    affilid: affilid,
  });

  if (returnDate) {
    params.set("return", returnDate);
  }

  // Přidáme UTM parametry pro tracking
  params.set("utm_source", "travelpayouts");
  params.set("utm_medium", "affiliate");

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Validuje Kiwi link server-side
 * Vrací true pokud link pravděpodobně funguje (200/301/302), false jinak
 */
export async function validateKiwiLink(
  url: string,
  timeout: number = 5000
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Zkusíme HEAD request (rychlejší), fallback na GET
    let response: Response | null = null;

    try {
      response = await fetch(url, {
        method: "HEAD",
        redirect: "manual", // Nechceme automatické redirecty, jen status
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; Travelpayouts/1.0; +https://travelpayouts.com)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
    } catch (headError: any) {
      // Pokud HEAD selže, zkusíme GET
      if (headError.name !== "AbortError") {
        try {
          response = await fetch(url, {
            method: "GET",
            redirect: "manual",
            signal: controller.signal,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (compatible; Travelpayouts/1.0; +https://travelpayouts.com)",
              Accept: "text/html,application/xhtml+xml",
            },
          });
        } catch (getError: any) {
          if (getError.name === "AbortError") {
            console.warn(`Kiwi link validation timeout: ${url}`);
            return false;
          }
          console.warn(`Kiwi link validation error: ${url}`, getError.message);
          return false;
        }
      } else {
        clearTimeout(timeoutId);
        return false;
      }
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response) {
      return false;
    }

    // 200, 301, 302 jsou OK (link funguje)
    const status = response.status;
    const isValid = status === 200 || status === 301 || status === 302;

    if (!isValid) {
      console.warn(
        `Kiwi link validation failed: ${url} - status ${status}`
      );
    }

    return isValid;
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.warn(`Kiwi link validation timeout: ${url}`);
      return false;
    }
    console.warn(`Kiwi link validation error: ${url}`, error.message);
    return false;
  }
}

/**
 * Validuje více Kiwi linků paralelně s limitem
 */
export async function validateKiwiLinks(
  urls: string[],
  maxConcurrent: number = 5,
  timeout: number = 5000
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();

  // Validujeme v dávkách, abychom neoverloadovali
  for (let i = 0; i < urls.length; i += maxConcurrent) {
    const batch = urls.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const isValid = await validateKiwiLink(url, timeout);
        return { url, isValid };
      })
    );

    batchResults.forEach(({ url, isValid }) => {
      results.set(url, isValid);
    });
  }

  return results;
}

