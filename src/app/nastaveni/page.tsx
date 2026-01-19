"use client";

import { useEffect, useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { FiBell, FiEye, FiLock, FiShield, FiUser } from "react-icons/fi";
import ProfileSettings from "./components/ProfileSettings";
import SecuritySettings from "./components/Security";
import VisibilitySettings from "./components/VisibilitySettings";
import PrivacySettings from "./components/PrivacySettings";
import NotificationSettings from "./components/NotificationSettings";
import ProfileHero from "@/components/profile/ProfileHero";
import { useAuth } from "@/hooks/useAuth";

const menu = [
  { id: "profile", label: "Osobní údaje", icon: FiUser },
  { id: "security", label: "Bezpečnost", icon: FiLock },
  { id: "visibility", label: "Viditelnost", icon: FiEye },
  { id: "privacy", label: "Ochrana dat", icon: FiShield },
  { id: "notifications", label: "Oznámení", icon: FiBell },
];

export default function NastaveniPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Získat aktuální název sekce pro breadcrumbs
  const getSectionLabel = (id: string) => {
    const item = menu.find((m) => m.id === id);
    return item?.label || "Nastavení";
  };

  // Získat aktuální profile slug (pouze na klientu, aby se předešlo hydration mismatch)
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Použít useMemo pro aktualizaci profileSlug, když se změní user objekt
  const profileSlug = useMemo(() => {
    if (!isClient) return null;
    return user?.nicknameSlug || user?.uid || null;
  }, [isClient, user?.nicknameSlug, user?.uid]);

  const idToSlug: Record<string, string> = {
    profile: "",
    security: "bezpecnost",
    visibility: "viditelnost",
    privacy: "ochrana-dat",
    notifications: "oznameni",
  };

  const slugToId: Record<string, string> = {
    "": "profile",
    bezpecnost: "security",
    viditelnost: "visibility",
    "ochrana-dat": "privacy",
    oznameni: "notifications",
  };

  const currentSlug =
    pathname?.split("/").filter(Boolean)[1] === "nastaveni"
      ? (pathname.split("/").filter(Boolean)[2] ?? "")
      : (pathname?.split("/").filter(Boolean)[1] ?? "");

  const derivedActive = slugToId[currentSlug ?? ""] ?? "profile";
  const [active, setActive] = useState(derivedActive);

  useEffect(() => {
    setActive(derivedActive);
  }, [derivedActive]);

  const handleChange = (id: string) => {
    setActive(id);
    const slug = idToSlug[id] ?? "";
    const next = slug ? `/nastaveni/${slug}` : "/nastaveni";
    router.push(next);
  };

  return (
    <div className="min-h-screen relative">
      {/* Hero sekce jako pozadí za celou stránkou */}
      <ProfileHero />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4 mt-6" aria-label="Breadcrumb">
          {profileSlug ? (
            <>
              <Link
                href={`/profil/${profileSlug}`}
                className="hover:text-green-600 font-medium transition-colors"
              >
                Profil
              </Link>
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-900 font-semibold">
                {getSectionLabel(active)}
              </span>
            </>
          ) : (
            <span className="text-gray-900 font-semibold">Nastavení</span>
          )}
        </nav>

        <div className="mt-2 rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
          <div className="flex flex-col lg:flex-row">
            {/* Menu */}
            <aside className="lg:w-56 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/40">
              <div className="p-4">
                <h2 className="text-base font-semibold text-slate-900 mb-3">
                  Nastavení
                </h2>

                <nav className="space-y-0.5">
                  {menu.map((item) => {
                    const isActive = active === item.id;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleChange(item.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-sm cursor-pointer 
                          transition-all duration-200 
                          rounded-lg
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2
                          ${
                            isActive
                              ? "text-emerald-600 font-semibold bg-emerald-50"
                              : "text-slate-700 font-normal hover:bg-slate-50"
                          }`}
                        aria-label={item.label}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <Icon
                          className={`text-lg transition-colors duration-200 ${
                            isActive ? "text-emerald-600" : "text-slate-600"
                          }`}
                          aria-hidden="true"
                        />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Content */}
            <section className="flex-1 min-w-0">
              <div className="p-6">
                {active === "profile" && <ProfileSettings />}
                {active === "security" && <SecuritySettings />}
                {active === "visibility" && <VisibilitySettings />}
                {active === "privacy" && <PrivacySettings />}
                {active === "notifications" && <NotificationSettings />}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
