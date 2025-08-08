/** @type {import('next').NextConfig} */

const nextConfig = {
  experimental: {
    // This is required to allow the Next.js dev server to be proxied by the App Prototyper.
    allowedDevOrigins: [
      '6000-firebase-studio-1753738825005.cluster-m7tpz3bmgjgoqrktlvd4ykrc2m.cloudworkstations.dev',
    ],
  },
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
