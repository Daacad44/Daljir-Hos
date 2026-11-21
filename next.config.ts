import type { NextConfig } from "next";

// Every page in this app reads the signed-in user's session (cookies),
// so pages render per request. Cache Components is left off on purpose.
const nextConfig: NextConfig = {
  experimental: {
    // Photo uploads go through Server Actions (Vercel caps request bodies at 4.5MB)
    serverActions: { bodySizeLimit: "4mb" },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
