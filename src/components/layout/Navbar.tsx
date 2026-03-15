"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  FiAward,
  FiBell,
  FiChevronDown,
  FiGlobe,
  FiHelpCircle,
  FiHome,
  FiLayout,
  FiLogOut,
  FiMap,
  FiMenu,
  FiNavigation,
  FiSearch,
  FiSettings,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
import NotificationDropdown, {
  fetchUnreadCount,
} from "@/components/notifications/NotificationDropdown";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/lib/supabase/client";
import { authUtils } from "@/utils/supabase";
import { marble } from "@/lib/fonts";

function getInitial(
  user: { nickname?: string; displayName?: string; email?: string } | null,
) {
  return (
    user?.nickname?.charAt(0)?.toUpperCase() ||
    user?.displayName?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "?"
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const { user, logout, loading: authLoading, refreshUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [countriesOpen, setCountriesOpen] = useState(false);
  const countriesRef = useRef<HTMLDivElement | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const [mobileCountriesOpen, setMobileCountriesOpen] = useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [authLoadingTimeout, setAuthLoadingTimeout] = useState(false);
  const { isAdmin } = useIsAdmin();
  const [searchBarOpen, setSearchBarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Použít cached user jako fallback, pokud authLoading je true
  const [cachedUser, setCachedUser] = useState(() => {
    if (typeof window !== "undefined") {
      return authUtils.getCachedUser();
    }
    return null;
  });

  // Aktualizovat cached user když se změní user z useAuth
  useEffect(() => {
    if (user) {
      setCachedUser(user);
    } else if (!authLoading) {
      // Pokud authLoading je false a user je null, zkontrolovat, jestli existuje session
      // Pokud ne, vymazat cached user (uživatel se odhlásil)
      const checkSession = async () => {
        try {
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            // Session neexistuje - uživatel je odhlášen, vymazat cached user
            setCachedUser(null);
            // Také vymazat z localStorage pro jistotu
            authUtils.clearCachedUser();
          } else {
            // Session existuje, ale user není načten - zkusit načíst cached user
            const cached = authUtils.getCachedUser();
            if (cached) {
              setCachedUser(cached);
            } else {
              setCachedUser(null);
            }
          }
        } catch (err) {
          // Při chybě vymazat cached user
          console.warn("[Navbar] Chyba při kontrole session:", err);
          setCachedUser(null);
          authUtils.clearCachedUser();
        }
      };
      checkSession();
    }
  }, [user, authLoading]);

  // Když probíhá odhlášení, okamžitě vymazat cached user
  useEffect(() => {
    if (loggingOut) {
      setCachedUser(null);
      authUtils.clearCachedUser();
    }
  }, [loggingOut]);

  // Použít user nebo cachedUser pro zobrazení
  // Ale pouze pokud není právě probíhající odhlášení
  const displayUser = (!loggingOut && (user || cachedUser)) || null;

  // menuItems musí být useMemo, aby se přepočítaly když se změní isAdmin
  const menuItems = useMemo(
    () => [
      {
        label: "Můj profil",
        icon: FiUser,
        onClick: () => {
          setMenuOpen(false);
          const currentUser = user || cachedUser;
          router.push(
            `/profil/${currentUser?.nicknameSlug || currentUser?.uid}`,
          );
        },
      },
      ...(isAdmin
        ? [
            {
              label: "Dashboard",
              icon: FiLayout,
              onClick: () => {
                setMenuOpen(false);
                router.push("/admin");
              },
            },
          ]
        : []),
      {
        label: "Nastavení",
        icon: FiSettings,
        onClick: () => {
          setMenuOpen(false);
          router.push("/nastaveni");
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
    ],
    [
      isAdmin,
      user?.nicknameSlug,
      user?.uid,
      cachedUser?.nicknameSlug,
      cachedUser?.uid,
      router,
    ],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && displayUser) {
      fetchUnreadCount().then(setUnreadCount);
    }
  }, [mounted, displayUser]);

  // Timeout pro authLoading - po 3 sekundách zobrazit UI i když authLoading je true
  useEffect(() => {
    if (authLoading) {
      const timeout = setTimeout(() => {
        console.warn("[Navbar] authLoading timeout - zobrazuji UI");
        setAuthLoadingTimeout(true);
      }, 3000);
      return () => clearTimeout(timeout);
    } else {
      setAuthLoadingTimeout(false);
    }
  }, [authLoading]);

  // Retry mechanismus pro načítání uživatele, pokud se nenačte
  useEffect(() => {
    if (mounted && !authLoading && !user && !cachedUser) {
      // Pokud se user nenačte po 1 sekundě, zkusíme refresh
      const timeout = setTimeout(async () => {
        // Zkontrolovat, jestli existuje session
        if (typeof window !== "undefined") {
          try {
            const { data } = await supabase.auth.getSession();
            if (data.session && !user && !cachedUser) {
              // Session existuje, ale user se nenačetl - zkusíme refresh
              console.log(
                "[Navbar] Session existuje, ale user chybí, zkouším refreshUser...",
              );
              if (refreshUser) {
                try {
                  await refreshUser();
                } catch (err) {
                  console.error("[Navbar] Chyba při refreshUser:", err);
                  // Pokud refresh selže, zkusit reload jako poslední možnost
                  const retryTimeout = setTimeout(() => {
                    if (!user) {
                      console.warn(
                        "[Navbar] Refresh selhal, reloaduji stránku...",
                      );
                      window.location.reload();
                    }
                  }, 2000);
                  return () => clearTimeout(retryTimeout);
                }
              }
            }
          } catch (err) {
            console.error("[Navbar] Chyba při kontrole session:", err);
          }
        }
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [mounted, authLoading, user, cachedUser, refreshUser]);

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

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (!notificationsRef.current) return;
      if (!notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  useEffect(() => {
    const onMobileMenuClick = (e: MouseEvent) => {
      if (!mobileMenuRef.current) return;
      if (!mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener("mousedown", onMobileMenuClick);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("mousedown", onMobileMenuClick);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Focus search input when bar opens; close on Escape
  useEffect(() => {
    if (searchBarOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchBarOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchBarOpen(false);
    };
    if (searchBarOpen) {
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }
  }, [searchBarOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q.length >= 2) {
      router.push(`/hledat?q=${encodeURIComponent(q)}`);
      setSearchBarOpen(false);
      setSearchQuery("");
    }
  };

  const isCommunity = pathname === "/komunita";
  const isCountries = pathname === "/zeme" || pathname.startsWith("/zeme/");
  const navItems = [
    { label: "Domů", href: "/", active: pathname === "/" },
    { label: "Země", href: "/zeme", active: isCountries },
    // Komunita je nyní samostatná stránka
    {
      label: "Komunita",
      href: "/komunita",
      active: isCommunity,
    },
    { label: "Letenky", href: "/letenky", active: pathname === "/letenky" },
    {
      label: "Žebříček",
      href: "/zebricek",
      active: pathname === "/zebricek",
    },
  ];

  const countriesData = [
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
        {
          name: "USA",
          slug: "spojene-staty-americke",
          continent: "severni-amerika",
        },
        {
          name: "Kanada",
          slug: "kanada",
          continent: "severni-amerika",
        },
        {
          name: "Mexiko",
          slug: "mexiko",
          continent: "severni-amerika",
        },
        {
          name: "Brazílie",
          slug: "brazilie",
          continent: "jizni-amerika",
        },
        {
          name: "Argentina",
          slug: "argentina",
          continent: "jizni-amerika",
        },
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
  ];

  return (
    <>
      <header className="bg-[#cbe1f7] border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20 min-h-[3.5rem]">
            {/* Left: Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              <Link
                href="/"
                className={`${marble.variable} flex items-center space-x-2`}
              >
                <Image
                  src="/logo.svg"
                  alt="Destinote"
                  width={120}
                  height={26}
                  priority
                  className="h-7 w-auto sm:h-8 lg:h-9 max-w-[100px] sm:max-w-[120px]"
                />
              </Link>
            </div>

            {/* Center: Nav links - Desktop/tablet large only (lg+), pod 1024px hamburger */}
            <nav
              className="hidden lg:flex items-center space-x-4 xl:space-x-8 2xl:space-x-12 text-blue-900 text-base xl:text-lg shrink-0"
              role="navigation"
              aria-label="Hlavní"
            >
              <Link
                href="/"
                className={`px-2 py-1.5 lg:px-3 rounded-full transition whitespace-nowrap ${
                  pathname === "/" ? "bg-white/60" : "hover:bg-white/60"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600`}
              >
                Domů
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
                  onClick={() => setCountriesOpen(false)}
                  className={`inline-flex items-center gap-1 px-2 py-1.5 lg:px-3 rounded-full transition cursor-pointer whitespace-nowrap ${
                    isCountries ? "bg-white/60" : "hover:bg-white/60"
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600`}
                >
                  <span>Země</span>
                  <FiChevronDown
                    aria-hidden
                    className={`w-4 h-4 text-blue-900 transition-transform duration-200 ${
                      countriesOpen ? "rotate-180" : ""
                    }`}
                  />
                </Link>
                {countriesOpen && (
                  <div
                    className="absolute mt-2 left-1/2 -translate-x-1/2 w-[min(96vw,42rem)] max-w-[calc(100vw-2rem)] max-h-[min(70vh,28rem)] overflow-y-auto bg-slate-100 shadow-lg border border-slate-200 rounded-lg p-4 sm:p-5 z-50"
                    onMouseLeave={() => setCountriesOpen(false)}
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-0 items-stretch">
                      {countriesData.map((col) => (
                        <div
                          key={col.title}
                          className="min-w-0 flex flex-col"
                        >
                          <div className="font-bold text-gray-900 mb-3 text-sm shrink-0">
                            {col.title}
                          </div>
                          <ul className="space-y-1.5 text-gray-800 text-sm flex-1 min-h-[7.5rem]">
                            {col.items.map((i) => (
                              <li key={i.slug}>
                                <Link
                                  href={`/zeme/${
                                    (i as any).continent || col.continentSlug
                                  }/${i.slug}`}
                                  className="block py-0.5 rounded hover:text-green-700 hover:bg-slate-200/60 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset cursor-pointer"
                                  onClick={() => setCountriesOpen(false)}
                                >
                                  {i.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                          <Link
                            href={`/zeme/${col.continentSlug}`}
                            className="inline-block text-sm text-gray-700 mt-3 shrink-0 hover:text-gray-900 hover:underline cursor-pointer"
                            onClick={() => setCountriesOpen(false)}
                          >
                            → Všechny země
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/komunita"
                className={`px-2 py-1.5 lg:px-3 rounded-full transition cursor-pointer whitespace-nowrap ${
                  isCommunity ? "bg-white/60" : "hover:bg-white/60"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600`}
              >
                Komunita
              </Link>

              <Link
                href="/letenky"
                className={`px-2 py-1.5 lg:px-3 rounded-full transition cursor-pointer whitespace-nowrap ${
                  pathname === "/letenky" ? "bg-white/60" : "hover:bg-white/60"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600`}
              >
                Letenky
              </Link>

              <Link
                href="/zebricek"
                className={`px-2 py-1.5 lg:px-3 rounded-full transition cursor-pointer whitespace-nowrap ${
                  pathname === "/leaderboard"
                    ? "bg-white/60"
                    : "hover:bg-white/60"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600`}
              >
                Žebříček
              </Link>
            </nav>

            {/* Right: Search Icon + Notifications + Auth (Desktop) + Mobile/Tablet Menu Button */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Search Icon – otevře search bar pod navbarem */}
              <button
                type="button"
                onClick={() => setSearchBarOpen((v) => !v)}
                className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-white/60 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer shrink-0"
                aria-label={searchBarOpen ? "Zavřít vyhledávání" : "Vyhledávání"}
              >
                <FiSearch className="w-5 h-5 text-blue-900" />
              </button>

              {/* Notification Bell - Desktop (lg+), logged in only */}
              {mounted && displayUser && (
                <div
                  className="hidden lg:block relative shrink-0"
                  ref={notificationsRef}
                >
                  <button
                    onClick={() => setNotificationsOpen((v) => !v)}
                    className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/60 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
                    aria-label="Oznámení"
                  >
                    <FiBell className="w-5 h-5 text-blue-900" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-xs font-semibold text-white bg-red-500 rounded-full">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>
                  <NotificationDropdown
                    isOpen={notificationsOpen}
                    onClose={() => setNotificationsOpen(false)}
                    onUnreadCountChange={setUnreadCount}
                    unreadCount={unreadCount}
                  />
                </div>
              )}

              {/* Mobile/Tablet Menu Button - zobrazit pod 1024px */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/60 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer shrink-0"
                aria-label="Otevřít menu"
              >
                <FiMenu className="w-6 h-6 sm:w-7 sm:h-7 text-blue-900" />
              </button>

              {/* Auth Section - Desktop only (lg+) */}
              <div
                className="hidden lg:flex items-center relative shrink-0"
                ref={menuRef}
              >
                {!mounted ? (
                  <div style={{ width: 96, height: 36 }} />
                ) : displayUser ? (
                  <>
                    <button
                      aria-label="Uživatelské menu"
                      onClick={() => setMenuOpen((v) => !v)}
                      className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-white/60 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 cursor-pointer"
                    >
                      {displayUser.photoURL &&
                      displayUser.photoURL.trim() !== "" ? (
                        <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-green-200 relative">
                          <img
                            src={displayUser.photoURL}
                            alt={
                              displayUser.nickname ||
                              displayUser.displayName ||
                              "Avatar"
                            }
                            className="w-full h-full object-cover"
                            loading="eager"
                            onError={(e) => {
                              // Pokud se obrázek nenačte, zobrazit inicial
                              const target = e.currentTarget;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (
                                parent &&
                                !parent.querySelector(".fallback-initial")
                              ) {
                                const fallback = document.createElement("div");
                                fallback.className =
                                  "w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold ring-1 ring-green-200 absolute inset-0 fallback-initial";
                                fallback.textContent = getInitial(user);
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-green-100 text-green-700 flex items-center justify-center font-semibold ring-1 ring-green-200">
                          {getInitial(displayUser)}
                        </div>
                      )}
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
                          {displayUser.photoURL &&
                          displayUser.photoURL.trim() !== "" ? (
                            <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-green-200 relative">
                              <img
                                src={displayUser.photoURL}
                                alt={
                                  displayUser.nickname ||
                                  displayUser.displayName ||
                                  "Avatar"
                                }
                                className="w-full h-full object-cover"
                                loading="eager"
                                onError={(e) => {
                                  // Pokud se obrázek nenačte, zobrazit inicial
                                  const target = e.currentTarget;
                                  target.style.display = "none";
                                  const parent = target.parentElement;
                                  if (
                                    parent &&
                                    !parent.querySelector(".fallback-initial")
                                  ) {
                                    const fallback =
                                      document.createElement("div");
                                    fallback.className =
                                      "w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold ring-2 ring-green-200 absolute inset-0 fallback-initial";
                                    fallback.textContent =
                                      getInitial(displayUser);
                                    parent.appendChild(fallback);
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-green-100 text-green-700 flex items-center justify-center font-semibold ring-2 ring-green-200">
                              {getInitial(displayUser)}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-base font-semibold text-slate-900">
                              {displayUser.nickname ||
                                displayUser.displayName ||
                                displayUser.email?.split("@")[0] ||
                                "Uživatel"}
                            </span>
                            {displayUser.email && (
                              <span className="text-sm text-slate-500">
                                {displayUser.email}
                              </span>
                            )}
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
                                router.replace("/prihlaseni");
                                router.refresh();
                              }
                            }}
                            disabled={loggingOut}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 cursor-pointer"
                          >
                            <FiLogOut className="text-lg" aria-hidden />
                            <span>
                              {loggingOut ? "Odhlašuji…" : "Odhlásit se"}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => router.push("/prihlaseni")}
                    className="px-5 py-2.5 rounded-full bg-green-700 text-white cursor-pointer text-base hover:bg-green-800 active:bg-green-900 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                  >
                    Přihlásit se
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search bar – responzivní na mobil/tablet/desktop */}
      {searchBarOpen && (
        <div className="sticky top-14 sm:top-16 lg:top-20 z-40 bg-white border-b border-gray-200 py-3 sm:py-4 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-0">
              <form onSubmit={handleSearchSubmit} className="relative">
                <FiSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Hledat země, články..."
                  className="w-full pl-10 sm:pl-12 pr-24 sm:pr-32 py-3 sm:py-4 bg-white border-2 border-blue-200 rounded-full text-base sm:text-lg text-blue-900 placeholder-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  aria-label="Vyhledávací dotaz"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-14 sm:right-32 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition cursor-pointer"
                    aria-label="Vymazat vyhledávání"
                  >
                    <FiX className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base bg-blue-700 text-white rounded-full hover:bg-blue-800 transition cursor-pointer"
                >
                  Hledat
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Mobile/Tablet Menu Overlay – zobrazit pod 1024px */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Fullscreen Menu */}
          <div
            ref={mobileMenuRef}
            className="absolute inset-0 bg-[#cbe1f7] flex flex-col"
            style={{
              animation: "slideInRight 0.3s ease-out",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-blue-200 bg-[#cbe1f7]">
              <div className={`${marble.variable} flex items-center space-x-2`}>
                <Image
                  src="/logo.svg"
                  alt="Destinote"
                  width={140}
                  height={36}
                  className="h-8 w-auto"
                />
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-white/60 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
                aria-label="Zavřít menu"
              >
                <FiX className="w-6 h-6 text-blue-900" />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto">
              <div className="space-y-0 pb-12">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-6 py-5 text-blue-900 text-lg border-b border-blue-200 hover:bg-white/40 transition cursor-pointer ${
                    pathname === "/" ? "bg-white/60 font-semibold" : ""
                  }`}
                >
                  <FiHome className="w-5 h-5" />
                  <span>Domů</span>
                </Link>

                <Link
                  href="/zeme"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-6 py-5 text-blue-900 text-lg border-b border-blue-200 hover:bg-white/40 transition cursor-pointer ${
                    pathname === "/zeme" && !pathname.startsWith("/zeme/")
                      ? "bg-white/60 font-semibold"
                      : ""
                  }`}
                >
                  <FiGlobe className="w-5 h-5" />
                  <span>Mapa</span>
                </Link>

                <div className="border-b border-blue-200">
                  <button
                    onClick={() => setMobileCountriesOpen(!mobileCountriesOpen)}
                    className={`w-full flex items-center justify-between px-6 py-5 text-blue-900 text-lg hover:bg-white/40 transition cursor-pointer ${
                      isCountries ? "bg-white/60 font-semibold" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FiMap className="w-5 h-5 shrink-0" />
                      <span>Země</span>
                    </div>
                    <FiChevronDown
                      aria-hidden
                      className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
                        mobileCountriesOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {mobileCountriesOpen && (
                    <div className="bg-white/40 border-t border-blue-200">
                      <div className="px-4 py-4 max-h-[65vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                          {countriesData.map((col) => (
                            <div key={col.title} className="min-w-0">
                              <div className="font-semibold text-blue-900 mb-2 text-sm">
                                {col.title}
                              </div>
                              <ul className="space-y-0.5">
                                {col.items.map((i) => (
                                  <li key={i.slug}>
                                    <Link
                                      href={`/zeme/${
                                        (i as any).continent || col.continentSlug
                                      }/${i.slug}`}
                                      onClick={() => {
                                        setMobileMenuOpen(false);
                                        setMobileCountriesOpen(false);
                                      }}
                                      className="block text-sm text-blue-800 hover:text-green-700 py-1.5 px-2 -mx-2 rounded hover:bg-white/50 cursor-pointer"
                                    >
                                      {i.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                              <Link
                                href={`/zeme/${col.continentSlug}`}
                                onClick={() => {
                                  setMobileMenuOpen(false);
                                  setMobileCountriesOpen(false);
                                }}
                                className="inline-block text-xs font-medium text-blue-600 mt-1.5 px-2 -mx-2 py-1 rounded hover:bg-white/50 hover:text-blue-800 cursor-pointer"
                              >
                                Všechny země →
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  href="/komunita"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-6 py-5 text-blue-900 text-lg border-b border-blue-200 hover:bg-white/40 transition cursor-pointer ${
                    isCommunity ? "bg-white/60 font-semibold" : ""
                  }`}
                >
                  <FiUsers className="w-5 h-5" />
                  <span>Komunita</span>
                </Link>

                <Link
                  href="/letenky"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-6 py-5 text-blue-900 text-lg border-b border-blue-200 hover:bg-white/40 transition cursor-pointer ${
                    pathname === "/flights" ? "bg-white/60 font-semibold" : ""
                  }`}
                >
                  <FiNavigation className="w-5 h-5" />
                  <span>Letenky</span>
                </Link>

                <Link
                  href="/zebricek"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-6 py-5 text-blue-900 text-lg border-b border-blue-200 hover:bg-white/40 transition cursor-pointer ${
                    pathname === "/zebricek" ? "bg-white/60 font-semibold" : ""
                  }`}
                >
                  <FiAward className="w-5 h-5" />
                  <span>Žebříček</span>
                </Link>
              </div>
            </nav>

            {/* User Section */}
            {mounted && displayUser && (
              <div className="border-t border-blue-900 bg-blue-900 ">
                <button
                  onClick={() => setMobileUserMenuOpen(!mobileUserMenuOpen)}
                  className="w-full px-6 py-5 flex items-center gap-3 hover:bg-white/10 transition cursor-pointer"
                >
                  {displayUser.photoURL &&
                  displayUser.photoURL.trim() !== "" ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-green-200 shrink-0 relative ">
                      <img
                        src={displayUser.photoURL}
                        alt={
                          displayUser.nickname ||
                          displayUser.displayName ||
                          "Avatar"
                        }
                        className="w-full h-full object-cover"
                        loading="eager"
                        onError={(e) => {
                          // Pokud se obrázek nenačte, zobrazit inicial
                          const target = e.currentTarget;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (
                            parent &&
                            !parent.querySelector(".fallback-initial")
                          ) {
                            const fallback = document.createElement("div");
                            fallback.className =
                              "w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold ring-2 ring-green-200 flex-shrink-0 absolute inset-0 fallback-initial";
                            fallback.textContent = getInitial(user);
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-green-100 text-green-700 flex items-center justify-center font-semibold ring-2 ring-green-200 shrink-0">
                      {getInitial(displayUser)}
                    </div>
                  )}
                  <div className="flex flex-col flex-1 min-w-0 text-left ">
                    <span className="text-base font-semibold text-white truncate">
                      {displayUser.nickname ||
                        displayUser.displayName ||
                        displayUser.email?.split("@")[0] ||
                        "Uživatel"}
                    </span>
                    {displayUser.email && (
                      <span className="text-sm text-blue-200 truncate">
                        {displayUser.email}
                      </span>
                    )}
                  </div>
                  <FiChevronDown
                    className={`w-5 h-5 text-white transition-transform shrink-0 ${
                      mobileUserMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {mobileUserMenuOpen && (
                  <div className="px-6 pb-5 space-y-2 border-t border-blue-800 pt-3">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setMobileUserMenuOpen(false);
                        const currentUser = user || cachedUser;
                        router.push(
                          `/profil/${currentUser?.nicknameSlug || currentUser?.uid}`,
                        );
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base text-white hover:bg-white/10 transition cursor-pointer"
                    >
                      <FiUser className="text-lg" />
                      <span>Můj profil</span>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setMobileUserMenuOpen(false);
                          router.push("/admin");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base text-white hover:bg-white/10 transition cursor-pointer"
                      >
                        <FiLayout className="text-lg" />
                        <span>Dashboard</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setMobileUserMenuOpen(false);
                        router.push("/nastaveni");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base text-white hover:bg-white/10 transition cursor-pointer"
                    >
                      <FiSettings className="text-lg" />
                      <span>Nastavení</span>
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setMobileUserMenuOpen(false);
                        router.push("/nastaveni/oznameni");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base text-white hover:bg-white/10 transition cursor-pointer"
                    >
                      <FiBell className="text-lg" />
                      <span>Oznámení</span>
                      {unreadCount > 0 && (
                        <span className="ml-auto min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-semibold text-white bg-red-500 rounded-full">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setMobileUserMenuOpen(false);
                        router.push("/napoveda");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base text-white hover:bg-white/10 transition cursor-pointer"
                    >
                      <FiHelpCircle className="text-lg" />
                      <span>Nápověda</span>
                    </button>
                    <button
                      onClick={async () => {
                        if (loggingOut) return;
                        setLoggingOut(true);
                        try {
                          await logout();
                          setMobileMenuOpen(false);
                          setMobileUserMenuOpen(false);
                        } finally {
                          setLoggingOut(false);
                          router.replace("/prihlaseni");
                          router.refresh();
                        }
                      }}
                      disabled={loggingOut}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base text-red-300 hover:bg-red-500/10 disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      <FiLogOut className="text-lg" />
                      <span>{loggingOut ? "Odhlašuji…" : "Odhlásit se"}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {mounted && !displayUser && (
              <div className="border-t border-blue-900 px-6 pt-5 pb-12 bg-blue-900">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push("/prihlaseni");
                  }}
                  className="w-full px-6 py-3 rounded-full bg-green-700 text-white text-base hover:bg-green-800 active:bg-green-900 transition cursor-pointer"
                >
                  Přihlásit se
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
