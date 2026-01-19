"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";
import { FiPlus } from "react-icons/fi";
import Link from "next/link";

type Props = {
  countryName: string;
  currentPath: string;
};

export default function AddArticleButton({ countryName, currentPath }: Props) {
  const [mounted, setMounted] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Počkat na mount, aby se předešlo hydration mismatch
  if (!mounted || authLoading) {
    return (
      <Link href={`/clanek/novy?country=${encodeURIComponent(countryName)}`} className="w-full sm:w-auto lg:w-full">
        <button className="inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed border border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500 px-4 py-2 text-sm w-full cursor-pointer">
          <FiPlus className="w-4 h-4 mr-2" />
          Přidat článek
        </button>
      </Link>
    );
  }

  // Pokud není přihlášený, zobrazit tlačítko s toast zprávou místo odkazu
  if (!user) {
    return (
      <button
        onClick={() => {
          toast.info("Tato funkce vyžaduje přihlášení. Přihlaste se prosím.");
        }}
        className="w-full sm:w-auto lg:w-full inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed border border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500 px-4 py-2 text-sm cursor-pointer"
      >
        <FiPlus className="w-4 h-4 mr-2" />
        Přidat článek
      </button>
    );
  }

  return (
    <Link href={`/clanek/novy?country=${encodeURIComponent(countryName)}`} className="w-full sm:w-auto lg:w-full">
      <button className="inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed border border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500 px-4 py-2 text-sm w-full cursor-pointer">
        <FiPlus className="w-4 h-4 mr-2" />
        Přidat článek
      </button>
    </Link>
  );
}
