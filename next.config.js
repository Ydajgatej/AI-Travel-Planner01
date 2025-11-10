/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  // 确保 Dockerfile 的 .next/standalone 结构存在
  output: 'standalone'
};

module.exports = nextConfig;


