import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack does not walk up into the home
  // directory looking for a lockfile.
  turbopack: {
    root: __dirname,
  },
  experimental: {
    // Keep heavy server-only packages out of the client bundle graph.
    serverActions: {
      bodySizeLimit: "1mb",
    },
  },
  // The floating dev badge only ever renders under `next dev`; hiding it is
  // purely a local preference. Compile and runtime errors are still surfaced.
  devIndicators: false,

  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
