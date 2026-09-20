/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force dynamic rendering for API routes
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
