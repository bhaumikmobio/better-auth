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
        source: "/standup/:path*",
        destination: `${backendOrigin}/standup/:path*`,
      },
      {
        source: "/admin/:path*",
        destination: `${backendOrigin}/admin/:path*`,
      },
      {
        source: "/chatbot/:path*",
        destination: `${backendOrigin}/chatbot/:path*`,
      },
    ];
  },
};

export default nextConfig;
