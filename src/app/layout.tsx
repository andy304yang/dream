import type { Metadata, Viewport } from "next";
import "./globals.css";

// 网站基本信息 - 修改为你的实际信息
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
const SITE_NAME = "Excel 智能处理";
const SITE_DESCRIPTION = "上传 Excel 文件，用自然语言描述修改需求，AI 自动处理并返回结果文件，支持 xlsx、xls、csv 格式";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: ["Excel处理", "Excel修改", "AI表格处理", "在线Excel工具"],

  // Open Graph（微信分享卡片）
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },

  // 百度、360、搜狗等国内搜索引擎
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },

  // 百度站点验证（在百度搜索资源平台获取）
  // verification: {
  //   other: {
  //     "baidu-site-verification": "你的百度验证码",
  //   },
  // },

  // 规范链接
  alternates: {
    canonical: SITE_URL,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // lang="zh-CN" 告知搜索引擎这是简体中文页面
    <html lang="zh-CN" className="h-full">
      <head>
        {/* 百度统计（替换为你的统计代码）*/}
        {/* <script src="https://hm.baidu.com/hm.js?xxx" async /> */}
      </head>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
