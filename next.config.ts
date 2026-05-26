import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Leaflet requires these to be transpiled for Next.js
  transpilePackages: ["leaflet", "react-leaflet"],
};

export default nextConfig;
