import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Note: typedRoutes is disabled due to compatibility issues with next-intl routing
  // typedRoutes: true,

  // =============================================================================
  // Performance Optimizations
  // =============================================================================

  // Enable experimental features for better performance
  experimental: {
    // Optimize package imports to reduce bundle size
    optimizePackageImports: ["lightweight-charts"],
  },

  // Configure headers for better caching
  async headers() {
    return [
      {
        // Cache static assets for 1 year
        source: "/:all*(svg|jpg|jpeg|png|gif|ico|webp|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache JS/CSS chunks for 1 year (they have content hashes)
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Compress responses
  compress: true,
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
