"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FiBell, FiEye, FiLock, FiShield, FiUser } from "react-icons/fi";
import ProfileSettings from "@/app/nastaveni/components/ProfileSettings";
import SecuritySettings from "@/app/nastaveni/components/Security";
import VisibilitySettings from "@/app/nastaveni/components/VisibilitySettings";
import PrivacySettings from "@/app/nastaveni/components/PrivacySettings";
import NotificationSettings from "@/app/nastaveni/components/NotificationSettings";
import { Card, CardContent } from "@/components/ui/Card";
import ProfileHero from "@/components/profile/ProfileHero";

const menu = [
  { id: "profile", label: "Osobní údaje", icon: FiUser },
  { id: "security", label: "Bezpečnost", icon: FiLock },
  { id: "visibility", label: "Viditelnost", icon: FiEye },
  { id: "privacy", label: "Ochrana dat", icon: FiShield },
  { id: "notifications", label: "Oznámení", icon: FiBell },
];

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();

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

  const currentSlug = pathname?.split("/").filter(Boolean)[1] === "settings"
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
    const next = slug ? `/settings/${slug}` : "/settings";
    router.push(next);
  };

  return (
    <div className="min-h-screen relative">
      {/* Hero sekce jako pozadí za celou stránkou */}
      <ProfileHero />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Menu */}
          <aside className="lg:w-64 flex-shrink-0">
            <Card className="rounded-2xl border border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-6">
                  Nastavení
                </h2>

                <nav className="space-y-2">
                  {menu.map((item) => {
                    const isActive = active === item.id;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleChange(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm cursor-pointer 
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
              </CardContent>
            </Card>
          </aside>

          {/* Content */}
          <section className="flex-1 min-w-0">
            <Card className="rounded-2xl border border-slate-200 shadow-sm">
              <CardContent className="p-6 lg:p-8">
                {active === "profile" && <ProfileSettings />}
                {active === "security" && <SecuritySettings />}
                {active === "visibility" && <VisibilitySettings />}
                {active === "privacy" && <PrivacySettings />}
                {active === "notifications" && <NotificationSettings />}
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
