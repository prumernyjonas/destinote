import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { slugifyNickname } from "@/utils/slugify";

/**
 * Zkontroluje, zda nickname s daným slugem už existuje (kromě aktuálního uživatele)
 * Používá optimalizovaný dotaz s ILIKE místo načítání všech uživatelů
 */
export async function checkNicknameExists(
  nickname: string,
  excludeUserId?: string
): Promise<boolean> {
  const admin = createAdminSupabaseClient();
  const nicknameSlug = slugifyNickname(nickname);

  if (!nicknameSlug) {
    return false;
  }

  try {
    // Použít ILIKE pro přibližné hledání - rychlejší než načítat všechny uživatele
    // Hledat podle původního nicknamu (může obsahovat diakritiku)
    // a také podle slugifikované verze (bez diakritiky)
    const searchPattern = nicknameSlug.replace(/-/g, "%"); // Pomlčky jako wildcard
    
    const { data: users, error: queryError } = await admin
      .from("users")
      .select("id, nickname")
      .is("deleted_at", null)
      .or(`nickname.ilike.%${nickname}%,nickname.ilike.%${searchPattern}%`)
      .limit(100); // Limit pro bezpečnost a výkon

    if (queryError) {
      console.error("[checkNicknameExists] Query error:", queryError);
      // Pokud selže, vrátit true (bezpečnější - zabrání duplicitám)
      return true;
    }

    if (!users || users.length === 0) {
      return false;
    }

    // Zkontrolovat, zda některý z nalezených uživatelů má stejný slug
    return users.some(
      (user) =>
        user.id !== excludeUserId &&
        slugifyNickname(user.nickname) === nicknameSlug
    );
  } catch (err) {
    console.error("[checkNicknameExists] Error:", err);
    // Při chybě vrátit true (bezpečnější - zabrání duplicitám)
    return true;
  }
}

/**
 * Najde uživatele podle slugifikovaného nicknamu
 * Používá efektivní dotaz místo načítání všech uživatelů
 */
export async function findUserBySlug(
  slug: string
): Promise<{
  id: string;
  nickname: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
} | null> {
  const admin = createAdminSupabaseClient();
  const slugToFind = slugifyNickname(slug);

  if (!slugToFind) {
    return null;
  }

  try {
    // Pro malé databáze (< 1000 uživatelů) je nejspolehlivější načíst všechny
    // a filtrovat podle slug
    // ILIKE dotazy v PostgreSQL nemusí správně fungovat s diakritikou
    const { data: users, error } = await admin
      .from("users")
      .select("id, nickname, first_name, last_name, avatar_url, bio")
      .is("deleted_at", null)
      .limit(1000); // Limit pro bezpečnost

    if (error) {
      console.error("[findUserBySlug] Query error:", error);
      return null;
    }

    if (!users || users.length === 0) {
      return null;
    }

    // Najít uživatele se shodným slugem (filtrování na serveru)
    // Toto je spolehlivější než ILIKE dotazy s diakritikou
    const found = users.find(
      (u) => u.nickname && slugifyNickname(u.nickname) === slugToFind
    );

    return found || null;
  } catch (err) {
    console.error("[findUserBySlug] Error:", err);
    return null;
  }
}
