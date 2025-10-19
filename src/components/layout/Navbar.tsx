"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

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
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [countriesOpen, setCountriesOpen] = useState(false);
  const countriesRef = useRef<HTMLDivElement | null>(null);

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
  const navItems = [
    { label: "Home", href: "/", active: pathname === "/" },
    { label: "Země", href: "/countries", active: pathname === "/countries" },
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
                width={120}
                height={24}
                priority
              />
            </Link>
          </div>

          {/* Center: Nav links */}
          <nav
            className="hidden md:flex items-center space-x-8 text-blue-900"
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
              <button
                aria-haspopup="true"
                aria-expanded={countriesOpen}
                onClick={() => setCountriesOpen((v) => !v)}
                onMouseEnter={() => setCountriesOpen(true)}
                className={`${
                  pathname === "/countries" ? "underline" : "hover:underline"
                } underline-offset-4 decoration-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded`}
              >
                Země
              </button>
              {countriesOpen && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 mt-4 w-[900px] max-w-[90vw] bg-white shadow-xl border rounded-lg p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 z-50"
                  onMouseLeave={() => setCountriesOpen(false)}
                >
                  {[
                    {
                      title: "Asie",
                      items: [
                        "Thajsko",
                        "Indie",
                        "Srí Lanka",
                        "Vietnam",
                        "Indonésie",
                      ],
                      link: "/countries?continent=asia",
                    },
                    {
                      title: "Evropa",
                      items: [
                        "Polsko",
                        "Německo",
                        "Rakousko",
                        "Itálie",
                        "Švýcarsko",
                      ],
                      link: "/countries?continent=europe",
                    },
                    {
                      title: "Afrika",
                      items: [
                        "Maroko",
                        "Tanzánie",
                        "Keňa",
                        "Uganda",
                        "Madagaskar",
                      ],
                      link: "/countries?continent=africa",
                    },
                    {
                      title: "Amerika",
                      items: ["USA", "Kuba", "Peru", "Kanada", "Brazílie"],
                      link: "/countries?continent=americas",
                    },
                    {
                      title: "Austrálie a Oceánie",
                      items: [
                        "Austrálie",
                        "Nový Zéland",
                        "Papua Nová Guinea",
                        "Francouzská Polynésie",
                        "Tuvalu",
                      ],
                      link: "/countries?continent=oceania",
                    },
                    {
                      title: "Antarktida",
                      items: ["Antarktida"],
                      link: "/countries?continent=antarctica",
                    },
                  ].map((col) => (
                    <div key={col.title} className="min-w-[140px]">
                      <div className="font-semibold text-gray-900 mb-3">
                        {col.title}
                      </div>
                      <ul className="space-y-2 text-gray-700">
                        {col.items.map((i) => (
                          <li
                            key={i}
                            className="hover:text-green-700 cursor-pointer"
                          >
                            {i}
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={col.link}
                        className="inline-flex items-center text-sm text-gray-600 mt-3 hover:text-gray-900"
                      >
                        → Všechny země
                      </Link>
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
            {!user ? (
              <button
                onClick={() => router.push("/auth/login")}
                className="px-4 py-2 rounded-full bg-green-700 text-white text-sm hover:bg-green-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
              >
                Přihlásit se
              </button>
            ) : (
              <>
                <button
                  aria-label="Uživatelské menu"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                >
                  {getInitial(user)}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-12 w-44 bg-white shadow-lg rounded-md border py-1 z-50">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        router.push("/dashboard");
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await logout();
                          setMenuOpen(false);
                          router.push("/");
                        } catch {}
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                    >
                      Odhlásit se
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
