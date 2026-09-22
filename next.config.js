/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force dynamic rendering for all API routes to prevent build-time database issues
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
