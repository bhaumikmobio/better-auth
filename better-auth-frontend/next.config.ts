import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendOrigin = (
      process.env.BACKEND_URL ?? "http://localhost:3001"
    ).replace(/\/$/, "");

    return [
      {
        source: "/auth/:path*",
        destination: `${backendOrigin}/auth/:path*`,
      },
      {
        source: "/api-proxy/:path*",
        destination: `${backendOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;
