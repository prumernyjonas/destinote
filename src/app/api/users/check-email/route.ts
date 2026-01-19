import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * API endpoint pro kontrolu, zda email už existuje
 * GET /api/users/check-email?email=test@example.com
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const email = searchParams.get("email");

    if (!email || !email.trim()) {
      return NextResponse.json(
        { available: false, error: "Email je povinný" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Validace email formátu
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { available: false, error: "Neplatný formát emailu" },
        { status: 400 }
      );
    }

    const admin = createAdminSupabaseClient();

    // Zkontrolovat v Supabase Auth, zda už existuje uživatel s tímto emailem
    const { data: authUsers, error: authError } = await admin.auth.admin.listUsers();

    if (authError) {
      console.error("Chyba při kontrole emailu v Auth:", authError);
      return NextResponse.json(
        { available: false, error: "Chyba při kontrole emailu" },
        { status: 500 }
      );
    }

    // Zkontrolovat, zda už existuje email (case-insensitive)
    const exists = authUsers?.users?.some(
      (user) => user.email?.toLowerCase() === trimmedEmail
    );

    return NextResponse.json({
      available: !exists,
      message: exists
        ? `Email "${trimmedEmail}" je již zaregistrován. Zkuste se přihlásit nebo použijte jiný email.`
        : `Email "${trimmedEmail}" je dostupný.`,
    });
  } catch (err: any) {
    console.error("Chyba při kontrole emailu:", err);
    return NextResponse.json(
      { available: false, error: err?.message || "Neznámá chyba" },
      { status: 500 }
    );
  }
}
