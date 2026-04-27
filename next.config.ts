import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 独立输出模式，便于部署到自己的服务器
  output: "standalone",

  // 生产环境压缩
  compress: true,

  // 图片优化配置
  images: {
    formats: ["image/avif", "image/webp"],
    // 如需允许外部图片域名，在此添加
    // domains: ["example.com"],
  },

  // 安全响应头
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
