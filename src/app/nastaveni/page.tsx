"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FiBell, FiEye, FiLock, FiShield, FiUser } from "react-icons/fi";
import ProfileSettings from "./components/ProfileSettings";
import SecuritySettings from "./components/Security";
import VisibilitySettings from "./components/VisibilitySettings";
import PrivacySettings from "./components/PrivacySettings";
import NotificationSettings from "./components/NotificationSettings";

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
      ? pathname.split("/").filter(Boolean)[2] ?? ""
      : pathname?.split("/").filter(Boolean)[1] ?? "";

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
    <main className="min-h-screen bg-[#e6ecef] px-4 py-10">
      <div className="max-w-7xl mx-auto flex gap-8">
        {/* Uzsi leva cast s menu */}
        <aside className="bg-white rounded-[32px] p-8 flex-shrink-0 w-[300px]">
          <h2 className="text-2xl font-semibold text-slate-900 mb-7">
            Nastavení
          </h2>

          <nav className="space-y-3.5">
            {menu.map((item) => {
              const isActive = active === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleChange(item.id)}
                  className={`w-full flex items-center gap-3 px-1 py-2 text-left text-[17px] cursor-pointer 
                    transition-colors duration-200 
                    rounded-md
                    ${
                      isActive
                        ? "text-[#1aa7e8] font-semibold"
                        : "text-slate-900 font-normal"
                    }`}
                  style={{
                    transitionProperty: "color, font-weight",
                  }}
                >
                  <item.icon
                    className={`text-[22px] transition-colors duration-200 ${
                      isActive ? "text-[#1aa7e8]" : "text-slate-900"
                    }`}
                    aria-hidden
                  />
                  <span
                    className={`transition-all duration-200 ${
                      isActive ? "font-semibold" : "font-normal"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Siroky blok vpravo s informacemi */}
        <section className="flex-1 bg-white rounded-3xl p-10 min-w-0">
          {active === "profile" && <ProfileSettings />}
          {active === "security" && <SecuritySettings />}
          {active === "visibility" && <VisibilitySettings />}
          {active === "privacy" && <PrivacySettings />}
          {active === "notifications" && <NotificationSettings />}
        </section>
      </div>
    </main>
  );
}
