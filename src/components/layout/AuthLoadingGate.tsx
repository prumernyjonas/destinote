"use client";

/**
 * Obaluje Navbar + stránku. Auth se řeší na pozadí – obsah se zobrazí hned bez loadera.
 */
export function AuthLoadingGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
