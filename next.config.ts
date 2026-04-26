import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "onnxruntime-node", "@xenova/transformers"],
  outputFileTracingIncludes: {
    "/*": ["./node_modules/**/*.wasm", "./node_modules/**/*.so"],
  },
};

export default nextConfig;
