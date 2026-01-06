"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  FiChevronDown,
  FiHelpCircle,
  FiLogOut,
  FiSettings,
  FiUser,
} from "react-icons/fi";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";

function getInitial(user: { displayName?: string; email?: string } | null) {
  return (
    user?.displayName?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "?"
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [countriesOpen, setCountriesOpen] = useState(false);
  const countriesRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const menuItems = [
    {
      label: "Můj profil",
      icon: FiUser,
      onClick: () => {
        setMenuOpen(false);
        router.push(`/profil/${user?.nicknameSlug || user?.uid}`);
      },
    },
    {
      label: "Nápověda",
      icon: FiHelpCircle,
      onClick: () => {
        setMenuOpen(false);
        router.push("/napoveda");
      },
    },
    {
      label: "Nastavení",
      icon: FiSettings,
      onClick: () => {
        setMenuOpen(false);
        router.push("/nastaveni");
      },
    },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (!countriesRef.current) return;
      if (!countriesRef.current.contains(e.target as Node)) {
        setCountriesOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const isCommunity = pathname === "/community";
  const isCountries = pathname === "/zeme" || pathname.startsWith("/zeme/");
  const navItems = [
    { label: "Home", href: "/", active: pathname === "/" },
    { label: "Země", href: "/zeme", active: isCountries },
    // Komunita je nyní samostatná stránka
    {
      label: "Komunita",
      href: "/community",
      active: isCommunity,
    },
    { label: "Letenky", href: "/flights", active: pathname === "/flights" },
    {
      label: "Žebříček",
      href: "/leaderboard",
      active: pathname === "/leaderboard",
    },
  ];

  return (
    <header className="bg-[#cbe1f7] border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left: Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/logo.svg"
                alt="Destinote"
                width={140}
                height={36}
                priority
              />
            </Link>
          </div>

          {/* Center: Nav links */}
          <nav
            className="hidden md:flex items-center space-x-12 text-blue-900 text-lg"
            role="navigation"
            aria-label="Hlavní"
          >
            <Link
              href="/"
              className={`${
                pathname === "/" ? "underline" : "hover:underline"
              } underline-offset-4 decoration-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded`}
            >
              Home
            </Link>

            <div className="relative" ref={countriesRef}>
              <Link
                href="/zeme"
                prefetch={false}
                aria-haspopup="true"
                aria-expanded={countriesOpen}
                onMouseEnter={() => setCountriesOpen(true)}
                onFocus={() => setCountriesOpen(true)}
                onTouchStart={() => setCountriesOpen(true)}
                onClick={() => {
                  setCountriesOpen(false);
                }}
                className={`${
                  isCountries ? "underline" : "hover:underline"
                } cursor-pointer underline-offset-4 decoration-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded`}
              >
                Země
              </Link>
              {countriesOpen && (
                <div
                  className="absolute mt-7 left-1/2 -translate-x-1/2 w-auto max-w-[95vw] bg-white shadow-xl border rounded-lg p-5 flex gap-6 z-50"
                  onMouseLeave={() => setCountriesOpen(false)}
                >
                  {[
                    {
                      title: "Asie",
                      continentSlug: "asie",
                      items: [
                        { name: "Thajsko", slug: "thajsko" },
                        { name: "Indie", slug: "indie" },
                        { name: "Srí Lanka", slug: "sri-lanka" },
                        { name: "Vietnam", slug: "vietnam" },
                        { name: "Indonésie", slug: "indonesie" },
                      ],
                    },
                    {
                      title: "Evropa",
                      continentSlug: "evropa",
                      items: [
                        { name: "Polsko", slug: "polsko" },
                        { name: "Německo", slug: "nemecko" },
                        { name: "Rakousko", slug: "rakousko" },
                        { name: "Itálie", slug: "italie" },
                        { name: "Švýcarsko", slug: "svycarsko" },
                      ],
                    },
                    {
                      title: "Afrika",
                      continentSlug: "afrika",
                      items: [
                        { name: "Maroko", slug: "maroko" },
                        { name: "Tanzánie", slug: "tanzanie" },
                        { name: "Keňa", slug: "kena" },
                        { name: "Uganda", slug: "uganda" },
                        { name: "Madagaskar", slug: "madagaskar" },
                      ],
                    },
                    {
                      title: "Amerika",
                      continentSlug: "amerika",
                      items: [
                        { name: "USA", slug: "spojene-staty-americke", continent: "severni-amerika" },
                        { name: "Kanada", slug: "kanada", continent: "severni-amerika" },
                        { name: "Mexiko", slug: "mexiko", continent: "severni-amerika" },
                        { name: "Kuba", slug: "kuba", continent: "severni-amerika" },
                        { name: "Brazílie", slug: "brazilie", continent: "jizni-amerika" },
                        { name: "Argentina", slug: "argentina", continent: "jizni-amerika" },
                        { name: "Peru", slug: "peru", continent: "jizni-amerika" },
                      ],
                    },
                    {
                      title: "Austrálie a Oceánie",
                      continentSlug: "australie",
                      items: [
                        { name: "Austrálie", slug: "australie" },
                        { name: "Nový Zéland", slug: "novy-zeland" },
                        {
                          name: "Papua Nová Guinea",
                          slug: "papua-nova-guinea",
                        },
                        {
                          name: "Francouzská Polynésie",
                          slug: "francouzska-polynesie",
                        },
                        { name: "Tuvalu", slug: "tuvalu" },
                      ],
                    },
                    {
                      title: "Antarktida",
                      continentSlug: "antarktida",
                      items: [{ name: "Antarktida", slug: "antarktida" }],
                    },
                  ].map((col) => (
                    <div key={col.title} className="flex-shrink-0 min-w-[150px]">
                      <div className="font-semibold text-gray-900 mb-2.5 text-base">
                        {col.title}
                      </div>
                      <ul className="space-y-1.5 text-gray-700 text-sm">
                        {col.items.map((i) => (
                          <li key={i.slug}>
                            <Link
                              href={`/zeme/${(i as any).continent || col.continentSlug}/${i.slug}`}
                              className="hover:text-green-700 cursor-pointer block"
                              onClick={() => setCountriesOpen(false)}
                            >
                              {i.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-2 mt-2.5">
                        <Link
                          href={`/zeme/severni-amerika`}
                          className="inline-flex items-center text-gray-600 hover:text-gray-900 text-xs"
                          onClick={() => setCountriesOpen(false)}
                        >
                          → Severní
                        </Link>
                        <Link
                          href={`/zeme/jizni-amerika`}
                          className="inline-flex items-center text-gray-600 hover:text-gray-900 text-xs"
                          onClick={() => setCountriesOpen(false)}
                        >
                          → Jižní
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/community"
              className={`${
                isCommunity ? "underline" : "hover:underline"
              } underline-offset-4 decoration-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded`}
            >
              Komunita
            </Link>

            <Link
              href="/flights"
              className={`${
                pathname === "/flights" ? "underline" : "hover:underline"
              } underline-offset-4 decoration-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded`}
            >
              Letenky
            </Link>

            <Link
              href="/leaderboard"
              className={`${
                pathname === "/leaderboard" ? "underline" : "hover:underline"
              } underline-offset-4 decoration-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded`}
            >
              Žebříček
            </Link>
          </nav>

          {/* Right: Auth */}
          <div className="flex items-center relative" ref={menuRef}>
            {!mounted ? (
              <div style={{ width: 96, height: 36 }} />
            ) : user ? (
              <>
                {/* Resolve admin role once menu becomes available */}
                {/* We purposefully fetch lazily after mount to avoid SSR mismatch */}
                {mounted && <RoleResolver onResolved={(v) => setIsAdmin(v)} />}
                <button
                  aria-label="Uživatelské menu"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-white/60 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-green-100 text-green-700 flex items-center justify-center font-semibold ring-1 ring-green-200">
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt={user.displayName || user.email}
                        width={36}
                        height={36}
                        className="object-cover w-9 h-9"
                      />
                    ) : (
                      getInitial(user)
                    )}
                  </div>
                  <FiChevronDown
                    aria-hidden
                    className={`text-green-800 transition-transform ${
                      menuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-14 w-80 bg-white shadow-2xl rounded-2xl border border-slate-200 p-4 z-50">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-green-100 text-green-700 flex items-center justify-center font-semibold ring-2 ring-green-200">
                        {user.photoURL ? (
                          <Image
                            src={user.photoURL}
                            alt={user.displayName || user.email}
                            width={48}
                            height={48}
                            className="object-cover w-12 h-12"
                          />
                        ) : (
                          getInitial(user)
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-semibold text-slate-900">
                          {user.displayName || user.email || "Uživatel"}
                        </span>
                        <span className="text-sm text-slate-500">
                          {user.email || "Člen Destinote"}
                        </span>
                      </div>
                    </div>
                    <div className="pt-3 space-y-1">
                      {menuItems.map((item) => (
                        <button
                          key={item.label}
                          onClick={item.onClick}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 cursor-pointer"
                        >
                          <item.icon
                            className="text-lg text-slate-600"
                            aria-hidden
                          />
                          <span>{item.label}</span>
                        </button>
                      ))}
                      <button
                        onClick={async () => {
                          if (loggingOut) return;
                          setLoggingOut(true);
                          try {
                            await logout();
                          } finally {
                            setMenuOpen(false);
                            setLoggingOut(false);
                            router.replace("/auth/login");
                            router.refresh();
                          }
                        }}
                        disabled={loggingOut}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 cursor-pointer"
                      >
                        <FiLogOut className="text-lg" aria-hidden />
                        <span>{loggingOut ? "Odhlašuji…" : "Odhlásit se"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : authLoading ? (
              <div style={{ width: 96, height: 36 }} />
            ) : (
              <button
                onClick={() => router.push("/auth/login")}
                className="px-5 py-2.5 rounded-full bg-green-700 text-white cursor-pointer text-base hover:bg-green-800 active:bg-green-900 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
              >
                Přihlásit se
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function RoleResolver({
  onResolved,
}: {
  onResolved: (isAdmin: boolean) => void;
}) {
  useEffect(() => {
    let cancelled = false;
    let unsub: { data?: { subscription?: { unsubscribe(): void } } } | null =
      null;

    async function checkRole() {
      try {
        const { data } = await supabase.auth.getSession();
        const access = data.session?.access_token;
        const headers: Record<string, string> = {};
        if (access) headers["Authorization"] = `Bearer ${access}`;
        const res = await fetch("/api/auth/role", {
          cache: "no-store",
          headers,
        });
        if (!res.ok) {
          return;
        }
        const d = await res.json();
        if (!cancelled) onResolved(!!d?.isAdmin && d.role === "admin");
      } catch {
        // ignore
      }
    }

    // 1) První pokus
    checkRole();
    // 2) Znovu při změně auth stavu
    unsub = supabase.auth.onAuthStateChange(() => {
      checkRole();
    });
    // 3) Bezpečný retry po krátké prodlevě (řeší závod o session)
    const t = setTimeout(() => checkRole(), 700);

    return () => {
      cancelled = true;
      try {
        unsub?.data?.subscription?.unsubscribe();
      } catch {}
      clearTimeout(t);
    };
  }, [onResolved]);
  return null;
}
