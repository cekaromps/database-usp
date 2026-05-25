import type { NextConfig } from "next";

/** type {import('next').NextConfig} */
const nextConfig: NextConfig = {
    allowedDevOrigins: ['192.168.1.15', '192.168.1.10'],
};

export default nextConfig;
