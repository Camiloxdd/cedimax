import type { NextConfig } from "next";

const lanHost = (process.env.LAN_HOST || "").replace(/^https?:\/\//, "").replace(/:\d+$/, "");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", ...(lanHost ? [`${lanHost}:3000`, lanHost] : [])],
};

export default nextConfig;
