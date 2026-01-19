"use client";

import { useState } from "react";
import { FiBell, FiEye, FiLock, FiShield, FiUser } from "react-icons/fi";
import ProfileSettings from "@/app/nastaveni/components/ProfileSettings";
import SecuritySettings from "@/app/nastaveni/components/Security";
import VisibilitySettings from "@/app/nastaveni/components/VisibilitySettings";
import PrivacySettings from "@/app/nastaveni/components/PrivacySettings";
import NotificationSettings from "@/app/nastaveni/components/NotificationSettings";
import { Card, CardContent } from "@/components/ui/Card";

const menu = [
  { id: "profile", label: "Osobní údaje", icon: FiUser },
  { id: "security", label: "Bezpečnost", icon: FiLock },
  { id: "visibility", label: "Viditelnost", icon: FiEye },
  { id: "privacy", label: "Ochrana dat", icon: FiShield },
  { id: "notifications", label: "Oznámení", icon: FiBell },
];

export default function ProfileSettingsTab() {
  const [active, setActive] = useState("profile");

  return (
    <div className="pb-8">
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
                      onClick={() => setActive(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm cursor-pointer 
                        transition-all duration-200 
                        rounded-lg
                        ${
                          isActive
                            ? "text-emerald-600 font-semibold bg-emerald-50"
                            : "text-slate-700 font-normal hover:bg-slate-50"
                        }`}
                    >
                      <Icon
                        className={`text-lg transition-colors duration-200 ${
                          isActive ? "text-emerald-600" : "text-slate-600"
                        }`}
                        aria-hidden
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
    </div>
  );
}
