"use client";

interface StatusBadgeProps {
  status: "approved" | "pending" | "rejected" | "draft";
  className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const statusConfig = {
    approved: {
      label: "Schváleno",
      className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    },
    pending: {
      label: "Čeká na schválení",
      className: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    },
    rejected: {
      label: "Zamítnuto",
      className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    },
    draft: {
      label: "Koncept",
      className: "bg-slate-50 text-slate-600 ring-1 ring-slate-200",
    },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span
      className={`text-xs px-3 py-1 rounded-full font-medium ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}
