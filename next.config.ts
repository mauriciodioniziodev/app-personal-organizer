/** @type {import('next').NextConfig} */

const nextConfig = {
  env: {
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ijlrpyhldrrbetcskdvm.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/assets/**',
      },
    ],
  },
};

module.exports = nextConfig;
