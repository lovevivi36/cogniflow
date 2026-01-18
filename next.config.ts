import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Electron 模式：不使用静态导出，保持 API routes 功能
  // Web 部署：使用 Vercel 的 serverless functions
  images: {
    unoptimized: false,
  },
  // 添加manifest.json支持
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
