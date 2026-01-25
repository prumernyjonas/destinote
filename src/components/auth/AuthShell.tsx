"use client";

import Link from "next/link";
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
    <div className="min-h-screen relative flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            "linear-gradient(135deg, rgb(15, 30, 75) 0%, rgb(28, 57, 142) 50%, rgb(20, 40, 100) 100%)",
        }}
      />

      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-400/10 rounded-full blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          <div className="text-sm text-white/80">{subtitle}</div>
        </div>

        <div className="bg-white/95 backdrop-blur border border-white/15 shadow-xl py-8 px-4 sm:rounded-2xl sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
