import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for slim Cloud Run / container deploys.
  output: "standalone",
  turbopack: {
    // Empty config silences the Next 16 warning. Turbopack handles
    // pdfjs-dist's optional `canvas` dependency automatically in client bundles.
  },
  webpack: (config) => {
    // Fallback for non-Turbopack builds.
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
