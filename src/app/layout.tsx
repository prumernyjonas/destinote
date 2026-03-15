import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "@/styles/globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { ToastProvider } from "@/components/ui/Toast";
import Navbar from "@/components/layout/Navbar";
import { Suspense } from "react";
import { marble } from "@/lib/fonts";
import { PageLoading } from "@/components/ui/PageLoading";
import { ContentLoadingFallback } from "@/components/ui/ContentLoadingFallback";
import { AuthLoadingGate } from "@/components/layout/AuthLoadingGate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Destinote",
    template: "%s | Destinote",
  },
  description: "Interaktivní mapa světa, cestopisy a průvodce. Sdílejte své cesty a objevte destinace.",
  icons: {
    icon: "/logo-sm2.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
} as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${marble.variable} ${poppins.className} antialiased`}
      >
        <ToastProvider>
          <AuthProvider>
            <AuthLoadingGate>
              <Suspense fallback={<PageLoading />}>
                <Navbar />
              </Suspense>
              <Suspense fallback={<ContentLoadingFallback />}>
                {children}
              </Suspense>
            </AuthLoadingGate>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
