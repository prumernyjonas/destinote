import localFont from "next/font/local";

export const marble = localFont({
  src: "../fonts/Marble-Regular.woff2",
  variable: "--font-marble",
  display: "swap",
  weight: "400",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});
