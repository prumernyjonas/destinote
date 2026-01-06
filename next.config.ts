import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    // Allow Docker builds to complete even if ESLint finds errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip type errors during production builds (optional)
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
    ],
  },
  // Fix pro špatně odvozený kořen projektu při Turbopacku
  // (zabraňuje HMR chybám s global-error.js)
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
