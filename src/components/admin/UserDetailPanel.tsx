"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import Image from "next/image";

type UserDetailPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    email: string | null;
    nickname: string;
    role: string;
    created_at: string;
    updated_at: string;
    avatar_url?: string | null;
  };
};

export default function UserDetailPanel({
  isOpen,
  onClose,
  user,
}: UserDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // ESC handler
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Click outside handler
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timeout = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-200"
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
        className={`fixed right-0 top-0 h-full w-full sm:w-[520px] bg-white shadow-xl z-50 transform transition-transform duration-200 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 id="panel-title" className="text-lg font-semibold text-slate-900">
              Detail uživatele
            </h2>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              aria-label="Zavřít"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                {user.avatar_url ? (
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200">
                    <Image
                      src={user.avatar_url}
                      alt={user.nickname}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-semibold text-slate-600">
                    {user.nickname.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {user.nickname}
                  </h3>
                  {user.email && (
                    <p className="text-sm text-slate-500 mt-1">{user.email}</p>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Role
                  </label>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : user.role === "moderator"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Email
                  </label>
                  <p className="mt-1 text-sm text-slate-900">
                    {user.email || "—"}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    ID
                  </label>
                  <p className="mt-1 text-sm text-slate-600 font-mono">
                    {user.id}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Vytvořen
                  </label>
                  <p className="mt-1 text-sm text-slate-900">
                    {new Date(user.created_at).toLocaleDateString("cs-CZ", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Aktualizován
                  </label>
                  <p className="mt-1 text-sm text-slate-900">
                    {new Date(user.updated_at).toLocaleDateString("cs-CZ", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full cursor-pointer"
            >
              Zavřít
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
