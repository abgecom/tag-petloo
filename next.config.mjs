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
  // Force complete rebuild by busting webpack cache
  onDemandEntries: {
    maxInactiveAge: 1000,
    pagesBufferLength: 1,
  },
}

export default nextConfig
