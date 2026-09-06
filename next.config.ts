import type { NextConfig } from "next";
import { getServerEnv } from "./lib/env";

getServerEnv();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  outputFileTracingRoot: process.cwd(),
  experimental: { optimizePackageImports: ["lucide-react"] },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "same-origin" },
      { key: "Cache-Control", value: "private, no-store, max-age=0" },
    ] }];
  },
};
export default nextConfig;
