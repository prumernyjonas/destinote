"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

type ArticleReviewDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  article: {
    id: string;
    title: string;
    summary?: string | null;
    content?: string | null;
    main_image_url?: string | null;
    author_id: string;
    created_at: string;
    published_at?: string | null;
    destination?: string | null;
    authorNickname?: string;
    approvedByNickname?: string;
  } | null;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason?: string) => Promise<void>;
  isProcessing?: boolean;
  readOnly?: boolean;
};

export default function ArticleReviewDrawer({
  isOpen,
  onClose,
  article,
  onApprove,
  onReject,
  isProcessing = false,
  readOnly = false,
}: ArticleReviewDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const rejectReasonRef = useRef<HTMLTextAreaElement>(null);

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

  // Focus trap - focus na close button při otevření
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
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Small delay to prevent immediate close on open
    const timeout = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !article) return null;

  const handleApprove = async () => {
    await onApprove(article.id);
    onClose();
  };

  const handleReject = async () => {
    const reason = rejectReasonRef.current?.value || undefined;
    await onReject(article.id, reason);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-200"
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={`fixed right-0 top-0 h-full w-full sm:w-130 bg-white shadow-xl z-50 transform transition-transform duration-200 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2
              id="drawer-title"
              className="text-lg font-semibold text-slate-900"
            >
              {readOnly ? "Detail článku" : "Recenze článku"}
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
              {/* Title */}
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {article.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                  <span>
                    Autor:{" "}
                    {article.authorNickname ||
                      article.author_id.substring(0, 8) + "..."}
                  </span>
                  <span>
                    Vytvořeno:{" "}
                    {new Date(article.created_at).toLocaleDateString("cs-CZ", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  {readOnly && article.published_at && (
                    <span>
                      Publikováno:{" "}
                      {new Date(article.published_at).toLocaleDateString(
                        "cs-CZ",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </span>
                  )}
                  {readOnly && article.approvedByNickname && (
                    <span>Schválil: {article.approvedByNickname}</span>
                  )}
                </div>
              </div>

              {/* Cover Image */}
              {article.main_image_url && (
                <div className="relative w-full h-64 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                  <Image
                    src={article.main_image_url}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="520px"
                  />
                </div>
              )}

              {/* Destination */}
              {article.destination && (
                <div className="text-sm text-slate-600">
                  <span className="font-medium">Destinace:</span>{" "}
                  {article.destination}
                </div>
              )}

              {/* Summary */}
              {article.summary && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">
                    Shrnutí
                  </h4>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {article.summary}
                  </p>
                </div>
              )}

              {/* Content */}
              {article.content && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">
                    Obsah
                  </h4>
                  <div className="text-sm text-slate-600 whitespace-pre-wrap prose prose-sm max-w-none">
                    {article.content}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer with actions */}
          {!readOnly && (
            <div className="p-6 border-t border-slate-200 space-y-4">
              {/* Reject reason textarea */}
              <div>
                <label
                  htmlFor="reject-reason"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Důvod zamítnutí (volitelné)
                </label>
                <textarea
                  ref={rejectReasonRef}
                  id="reject-reason"
                  rows={3}
                  placeholder="Zadejte důvod zamítnutí článku..."
                  className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 placeholder-slate-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  disabled={isProcessing}
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button
                  variant="danger"
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="flex-1 cursor-pointer"
                >
                  {isProcessing ? "Zpracovávám..." : "Zamítnout"}
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="flex-1 cursor-pointer"
                >
                  {isProcessing ? "Zpracovávám..." : "Schválit"}
                </Button>
              </div>
            </div>
          )}

          {readOnly && (
            <div className="p-6 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full cursor-pointer"
              >
                Zavřít
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
