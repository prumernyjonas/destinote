"use client";

import { FiMap, FiFileText, FiAward } from "react-icons/fi";

interface ProfileTabsProps {
  activeTab: "map" | "articles" | "badges";
  onTabChange: (tab: "map" | "articles" | "badges") => void;
}

export default function ProfileTabs({
  activeTab,
  onTabChange,
}: ProfileTabsProps) {
  const tabs = [
    { id: "map" as const, label: "Mapa cest", icon: FiMap },
    { id: "articles" as const, label: "Moje články", icon: FiFileText },
    { id: "badges" as const, label: "Odznaky", icon: FiAward },
  ];

  return (
    <div className="sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-3 font-medium text-sm cursor-pointer transition-colors duration-200 flex items-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 ${
                  isActive
                    ? "border-b-2 border-emerald-600 text-emerald-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
                }`}
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={`w-4 h-4 transition-colors duration-200 ${
                    isActive ? "text-emerald-700" : "text-slate-600"
                  }`}
                  aria-hidden="true"
                />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
