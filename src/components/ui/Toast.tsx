"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = generateId();
      setToasts((prev) => [...prev, { id, message, variant }]);
      // Auto-dismiss after 3.5s
      window.setTimeout(() => remove(id), 3500);
    },
    [remove]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (m: string) => push(m, "success"),
      error: (m: string) => push(m, "error"),
      info: (m: string) => push(m, "info"),
    }),
    [push]
  );

  const styles: Record<
    ToastVariant,
    { border: string; icon: string; accent: string }
  > = {
    success: {
      border: "border-green-200",
      icon: "text-green-600",
      accent: "bg-green-500",
    },
    error: {
      border: "border-red-200",
      icon: "text-red-600",
      accent: "bg-red-500",
    },
    info: {
      border: "border-gray-200",
      icon: "text-gray-700",
      accent: "bg-gray-500",
    },
  };

  const Icon = ({ variant }: { variant: ToastVariant }) => {
    const cls = styles[variant].icon;
    if (variant === "success")
      return (
        <svg
          className={`h-4 w-4 ${cls}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16Zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4Z"
            clipRule="evenodd"
          />
        </svg>
      );
    if (variant === "error")
      return (
        <svg
          className={`h-4 w-4 ${cls}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16Zm-1-5a1 1 0 112 0 1 1 0 01-2 0Zm1-8a1 1 0 00-1 1v5a1 1 0 102 0V6a1 1 0 00-1-1Z"
            clipRule="evenodd"
          />
        </svg>
      );
    return (
      <svg
        className={`h-4 w-4 ${cls}`}
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0ZM9 7a1 1 0 112 0 1 1 0 01-2 0Zm2 3a1 1 0 10-2 0v3a1 1 0 102 0v-3Z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted && (
        <div className="pointer-events-none fixed top-20 right-6 z-50 flex flex-col gap-3">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto w-[360px] max-w-[90vw] rounded-xl border ${
                styles[t.variant].border
              } bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md`}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full ${
                    styles[t.variant].accent
                  }`}
                >
                  <Icon variant={t.variant} />
                </div>
                <div className="flex-1 text-sm text-gray-900">{t.message}</div>
                <button
                  onClick={() => remove(t.id)}
                  className="ml-1 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Zavřít oznámení"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
