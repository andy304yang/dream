import type { NextConfig } from "next";

// 后端地址：本地开发用 localhost:8000，Docker 内用服务名 backend:8000
// 这是服务端变量，运行时生效，不需要 NEXT_PUBLIC 前缀，也不需要重新构建
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  output: "standalone",

  // 把所有 /api/* 请求代理转发到 FastAPI 后端
  // 前端只需用相对路径 /api/xxx，无需 NEXT_PUBLIC_API_URL
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },

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
