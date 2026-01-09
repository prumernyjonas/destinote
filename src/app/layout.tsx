import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "@/styles/globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { ToastProvider } from "@/components/ui/Toast";
import Navbar from "@/components/layout/Navbar";
import { Suspense } from "react";

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
  title: "Destinote",
  description: "Interaktivní mapa světa v Next.js",
  icons: {
    icon: "/logo-sm2.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.className} antialiased`}
      >
        <ToastProvider>
          <AuthProvider>
            <Suspense fallback={null}>
              <Navbar />
            </Suspense>
            <Suspense fallback={null}>{children}</Suspense>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
