/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Aggressive cache busting to force rebuild from correct directory
  onDemandEntries: {
    maxInactiveAge: 1000,
    pagesBufferLength: 1,
  },
  // Disable webpack cache completely
  webpack: (config) => {
    config.cache = false
    return config
  },
}

export default nextConfig
