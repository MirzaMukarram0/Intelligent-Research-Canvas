import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Empty config silences the warning; Turbopack handles pdfjs-dist's optional
    // `canvas` dependency automatically in client bundles.
  },
  webpack: (config) => {
    // Fallback for non-Turbopack builds.
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
