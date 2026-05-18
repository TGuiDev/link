import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.10.254:3000", "link.guidev.site"],
  turbopack: {
    root: process.cwd()
  }
};

export default nextConfig;
