import type { NextConfig } from "next";

const frontendRoot = process.cwd();

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  outputFileTracingRoot: frontendRoot,
  turbopack: {
    root: frontendRoot,
  },
};

export default nextConfig;
