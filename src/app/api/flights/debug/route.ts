import { NextRequest, NextResponse } from "next/server";
import { fetchDeals } from "@/lib/flights/travelpayouts";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * Debug endpoint pro testování Travelpayouts API a Supabase
 * GET /api/flights/debug?origin=PRG
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const origin = searchParams.get("origin") || "PRG";

    const debug: any = {
      timestamp: new Date().toISOString(),
      origin: origin.toUpperCase(),
      env: {
        hasToken: !!process.env.TRAVELPAYOUTS_TOKEN,
        hasMarker: !!process.env.TRAVELPAYOUTS_MARKER,
        hasCurrency: !!process.env.TRAVELPAYOUTS_CURRENCY,
        currency: process.env.TRAVELPAYOUTS_CURRENCY || "czk",
      },
    };

    // Test Travelpayouts API - zkusíme různé způsoby autentizace
    try {
      const currency = process.env.TRAVELPAYOUTS_CURRENCY || "czk";
      const token = process.env.TRAVELPAYOUTS_TOKEN;
      const apiUrl = `https://api.travelpayouts.com/v1/city-directions`;
      
      debug.travelpayouts = {
        status: "testing",
        url: `${apiUrl}?origin=${origin.toUpperCase()}&currency=${currency}`,
        tokenLength: token?.length || 0,
        tokenPrefix: token?.substring(0, 4) || "N/A",
      };

      // Zkusíme přímý fetch s různými způsoby autentizace
      const testResults: any[] = [];

      // Test 1: Token v hlavičce
      try {
        const params1 = new URLSearchParams({
          origin: origin.toUpperCase(),
          currency: currency.toLowerCase(),
        });
        const res1 = await fetch(`${apiUrl}?${params1.toString()}`, {
          headers: { Accept: "application/json", "X-Access-Token": token || "" },
        });
        testResults.push({
          method: "header",
          status: res1.status,
          ok: res1.ok,
        });
      } catch (e: any) {
        testResults.push({ method: "header", error: e.message });
      }

      // Test 2: Token v URL
      try {
        const params2 = new URLSearchParams({
          origin: origin.toUpperCase(),
          currency: currency.toLowerCase(),
          token: token || "",
        });
        const res2 = await fetch(`${apiUrl}?${params2.toString()}`, {
          headers: { Accept: "application/json" },
        });
        testResults.push({
          method: "url",
          status: res2.status,
          ok: res2.ok,
        });
      } catch (e: any) {
        testResults.push({ method: "url", error: e.message });
      }

      debug.travelpayouts.testResults = testResults;

      // Zkusíme použít fetchDeals funkci
      const deals = await fetchDeals({ origin, currency, limit: 5 });
      debug.travelpayouts.result = {
        success: true,
        dealsCount: deals.length,
        sampleDeal: deals[0] || null,
      };
    } catch (error: any) {
      debug.travelpayouts = {
        ...debug.travelpayouts,
        status: "error",
        error: error?.message,
        stack: error?.stack?.split("\n").slice(0, 5).join("\n"),
      };
    }

    // Test Supabase
    try {
      const supabase = createAdminSupabaseClient();
      const { data: flights, error: dbError } = await supabase
        .from("flights")
        .select("*")
        .eq("origin", origin.toUpperCase())
        .limit(5);

      debug.supabase = {
        status: dbError ? "error" : "success",
        error: dbError?.message || null,
        flightsCount: flights?.length || 0,
        sampleFlight: flights?.[0] || null,
      };
    } catch (error: any) {
      debug.supabase = {
        status: "error",
        error: error?.message,
        stack: error?.stack,
      };
    }

    return NextResponse.json(debug, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Internal server error",
        stack: error?.stack,
      },
      { status: 500 }
    );
  }
}

