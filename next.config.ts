import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  serverExternalPackages: ["pdf-parse", "tesseract.js"],
  allowedDevOrigins: ["192.168.1.2"],
};

export default nextConfig;
