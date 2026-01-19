"use client";

interface ProfileStatItemProps {
  value: number | string;
  label: string;
  onClick?: () => void;
  isClickable?: boolean;
  highlight?: boolean;
}

export default function ProfileStatItem({
  value,
  label,
  onClick,
  isClickable = false,
  highlight = false,
}: ProfileStatItemProps) {
  const baseClasses = "px-3 py-2 rounded-xl transition-all duration-200";
  const clickableClasses = isClickable
    ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 hover:bg-slate-50 hover:ring-1 hover:ring-slate-200"
    : "";

  const content = (
    <>
      <div
        className={`text-base font-semibold transition-colors duration-200 ${
          highlight ? "text-emerald-600" : "text-slate-900"
        } ${isClickable ? "group-hover:text-slate-900" : ""}`}
      >
        {value}
      </div>
      <div className="text-xs text-slate-500 transition-colors duration-200">
        {label}
      </div>
    </>
  );

  if (isClickable && onClick) {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} ${clickableClasses} group`}
        aria-label={`${label}: ${value}`}
      >
        {content}
      </button>
    );
  }

  return <div className={baseClasses}>{content}</div>;
}
