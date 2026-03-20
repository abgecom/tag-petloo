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
  onDemandEntries: {
    maxInactiveAge: 1000,
    pagesBufferLength: 1,
  },
  webpack: (config) => {
    config.cache = false
    config.name = `build-${Date.now()}`
    return config
  },
}

export default nextConfig
