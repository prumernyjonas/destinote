/**
 * Slugifikace stringu - odstranění diakritiky a převod na malá písmena
 * Používá se pro URL-friendly verzi nickname
 */
export function slugifyNickname(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // odstranit diakritiku
    .toLowerCase()
    .replace(/\s+/g, "-") // mezery na pomlčky
    .replace(/[^a-z0-9-]/g, ""); // odstranit speciální znaky
}

