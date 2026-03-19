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
    // Force complete rebuild with timestamp
    config.name = `build-${Date.now()}`
    return config
  },
  // Disable build caching
  cacheHandler: null,
  cacheMaxMemorySize: 0,
}

export default nextConfig
