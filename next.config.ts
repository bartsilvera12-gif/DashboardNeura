import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Carpeta de salida del build (equivalente a `dist` en Vite). `next start` la usa automáticamente. */
  distDir: "dist",
  async headers() {
    return [
      {
        source: "/api/public/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, x-api-key",
          },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Vary", value: "Origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
