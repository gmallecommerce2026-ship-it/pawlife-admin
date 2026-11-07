import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();
const nextConfig: NextConfig = {
  // Bỏ qua lỗi TS khi build để deploy Vercel mượt hơn
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // eslint: { ignoreDuringBuilds: true }, // Uncomment nếu bị lỗi ESLint chặn deploy
  
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: 'https', hostname: '**' }, // Cho phép tất cả domain HTTPS
      { protocol: 'http', hostname: '**' },  // Cho phép tất cả domain HTTP
    ],
  },

  // TÍCH HỢP PROXY CHO NESTJS BACKEND Ở ĐÂY
  async rewrites() {
    return [
      {
        // Khi Web gọi các route bắt đầu bằng /api/v1/...
        source: '/api/v1/:path*',
        // Sẽ được Next.js ngầm chuyển tiếp (proxy) sang URL của NestJS Backend
        destination: `${process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'}/:path*`, 
      },
    ];
  },
  
  webpack(config) {
    // 1. Tìm rule mặc định của Next.js đang xử lý file SVG
    const fileLoaderRule = config.module.rules.find((rule: any) =>
      rule.test?.test?.(".svg")
    );

    if (fileLoaderRule) {
      config.module.rules.push(
        // Rule 1: Nếu import file có đuôi ?url (VD: import icon from './icon.svg?url')
        {
          ...fileLoaderRule,
          test: /\.svg$/i,
          resourceQuery: /url/, 
        },

        // Rule 2: Các trường hợp còn lại (import icon from './icon.svg')
        {
          test: /\.svg$/i,
          issuer: fileLoaderRule.issuer,
          resourceQuery: { 
            not: [...(fileLoaderRule.resourceQuery?.not || []), /url/] 
          },
          use: ["@svgr/webpack"],
        }
      );

      // 3. Loại bỏ SVG khỏi rule mặc định ban đầu để tránh xử lý trùng lặp
      fileLoaderRule.exclude = /\.svg$/i;
    }

    return config;
  },
};

export default nextConfig;