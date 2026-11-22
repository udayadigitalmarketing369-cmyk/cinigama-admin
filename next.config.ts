import type { NextConfig } from "next";

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/proxy-api/v1/:path*",
        destination: `${apiBase}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;

