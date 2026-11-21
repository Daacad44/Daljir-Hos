import type { NextConfig } from "next";

// Every page in this app reads the signed-in user's session (cookies),
// so pages render per request. Cache Components is left off on purpose.
const nextConfig: NextConfig = {
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
