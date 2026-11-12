/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    }
    return config
  },
}

module.exports = (phase) => ({
  ...nextConfig,
  // Keep a running local preview independent from production build output.
  distDir: phase === 'phase-development-server' ? '.next-dev' : '.next',
})
