import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Предупреждения не блокируют сборку в продакшене
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Игнорируем ошибки типов при сборке
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
