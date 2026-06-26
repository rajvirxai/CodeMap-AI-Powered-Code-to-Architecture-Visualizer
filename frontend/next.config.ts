import type { NextConfig } from "next";

const nextConfig = {
  // Turbopack is disabled by default via --no-turbo in package.json.
  // If enabled, we omit the root override configuration to let it auto-resolve 
  // the workspace root correctly and avoid React Client Manifest path mismatches.
} as NextConfig;

export default nextConfig;
