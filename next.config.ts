import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
});

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Soft-nav client cache for dynamic tabs (default dynamic=0 forces a full RSC refetch).
  // Mutations already revalidatePath / router.refresh so progress stays correct after writes.
  experimental: {
    optimizePackageImports: ["lucide-react"],
    staleTimes: {
      dynamic: 20,
      static: 180,
    },
  },
  allowedDevOrigins: ["127.0.0.1", "localhost", "*.trycloudflare.com"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default withPWA(nextConfig);
