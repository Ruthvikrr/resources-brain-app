import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "onnxruntime-node", "@xenova/transformers"],
};

export default nextConfig;
