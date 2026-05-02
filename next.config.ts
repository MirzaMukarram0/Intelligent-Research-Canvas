import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Avoid issues with pdfjs-dist canvas dependency in server bundles
    config.resolve.alias.canvas = false;
    return config;
  },
  experimental: {
    // Allow larger payloads for document text in API routes
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
