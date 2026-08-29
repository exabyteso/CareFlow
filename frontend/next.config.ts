import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Keep file tracing inside this app (repo also has scripts/pdf).
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
