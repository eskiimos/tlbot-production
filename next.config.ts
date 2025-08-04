import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Игнорируем ESLint ошибки при сборке в продакшене
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Игнорируем ошибки типов при сборке в продакшене
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
