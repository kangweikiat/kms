import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["@kms/ui", "@kms/database"],
  output: "standalone",
};

export default nextConfig;
