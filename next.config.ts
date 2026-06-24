import type { NextConfig } from "next";

/** type {import('next').NextConfig} */
const nextConfig: NextConfig = {
    allowedDevOrigins: ['192.168.1.15', '192.168.1.14', '192.168.1.9', 'utamapasogit.com'],
    typescript: { ignoreBuildErrors: true,}
};

export default nextConfig;
