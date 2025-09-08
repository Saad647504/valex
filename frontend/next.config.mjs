/** @type {import('next').NextConfig} */
const API_PROXY_TARGET = process.env.API_PROXY_TARGET || 'http://localhost:5001';

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    // Only proxy when API_BASE is not set on the client
    const useProxy = !process.env.NEXT_PUBLIC_API_BASE;
    return useProxy
      ? [
          {
            source: '/api/:path*',
            destination: `${API_PROXY_TARGET}/api/:path*`,
          },
        ]
      : [];
  },
};

export default nextConfig;
