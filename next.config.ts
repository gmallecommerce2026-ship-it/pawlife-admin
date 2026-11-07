import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const repo = "TEN-REPO"; // đổi thành tên repo GitHub của bạn

const nextConfig: NextConfig = {
  // Chỉ bật khi build cho GitHub Pages
  ...(isGithubPages && {
    output: "export" as const,
    basePath: `/${repo}`,
    assetPrefix: `/${repo}/`,
    trailingSlash: true,
  }),

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    dangerouslyAllowSVG: true,
    // Pages không có server tối ưu ảnh
    ...(isGithubPages && { unoptimized: true }),
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },

  // Rewrites không dùng được với output: "export" -> chỉ bật ngoài GitHub Pages
  ...(!isGithubPages && {
    async rewrites() {
      return [
        {
          source: "/api/v1/:path*",
          destination: `${process.env.NESTJS_BACKEND_URL || "http://localhost:3001"}/:path*`,
        },
      ];
    },
  }),

  webpack(config) {
    // ... giữ nguyên phần SVGR của bạn
    return config;
  },
};

export default nextConfig;