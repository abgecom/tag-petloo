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
  // Force rebuild with cache busting
  onDemandEntries: {
    maxInactiveAge: 1 * 1000, // 1 second
    pagesBufferLength: 1,
  },
}

export default nextConfig
