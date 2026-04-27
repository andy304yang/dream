#!/bin/bash
# 自托管服务器部署脚本
# 用法: ./deploy.sh

set -e

echo ">>> 构建生产版本..."
npm run build

echo ">>> 构建完成，standalone 产物在 .next/standalone/"
echo ""
echo "=== 部署到服务器的步骤 ==="
echo "1. 将以下文件/目录上传到服务器："
echo "   - .next/standalone/   (主程序)"
echo "   - .next/static/       -> 复制到 .next/standalone/.next/static/"
echo "   - public/             -> 复制到 .next/standalone/public/"
echo ""
echo "2. 在服务器上运行:"
echo "   PORT=3000 node server.js"
echo ""
echo "3. 建议使用 PM2 管理进程:"
echo "   pm2 start server.js --name '你的应用名' --env production"
echo ""
echo "4. 配置 Nginx 反向代理到 localhost:3000"
