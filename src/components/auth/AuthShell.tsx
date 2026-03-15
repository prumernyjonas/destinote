"use client";

import { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
};

export default function AuthShell({
  title,
  subtitle,
  children,
}: AuthShellProps) {
  return (
    <div className="min-h-screen relative flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 25% 15%, rgb(8, 42, 110) 0%, rgb(5, 16, 50) 50%, rgb(2, 8, 28) 100%)",
        }}
      />

      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[8%] left-[3%] w-[550px] h-[550px] bg-travel-400/20 rounded-full blur-[140px] animate-[auth-glow_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[5%] right-[8%] w-[420px] h-[420px] bg-green-400/10 rounded-full blur-[120px] animate-[auth-glow_11s_ease-in-out_infinite_3s]" />
        <div className="absolute top-[55%] left-[55%] w-[280px] h-[280px] bg-travel-300/7 rounded-full blur-[90px] animate-[auth-glow_14s_ease-in-out_infinite_6s]" />
      </div>

      <div
        className="fixed inset-0 -z-10 opacity-[0.015]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md md:max-w-lg relative z-10 animate-[auth-fade-in_0.5s_ease-out]">
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-travel-300 to-green-500 flex items-center justify-center shadow-lg shadow-travel-400/30 ring-1 ring-white/10">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
              />
            </svg>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            {title}
          </h1>
          <div className="text-sm text-travel-50/60">{subtitle}</div>
        </div>

        <div className="relative">
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/15 via-transparent to-white/5" />
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/8 shadow-2xl shadow-black/30 py-6 px-4 sm:py-8 sm:rounded-2xl sm:px-8 md:px-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
