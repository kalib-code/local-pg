/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable linting during build (we'll handle it separately)
    ignoreDuringBuilds: true
  },
  typescript: {
    // Disable TypeScript checking during build (we'll handle it separately)
    ignoreBuildErrors: true
  }
};

export default nextConfig;