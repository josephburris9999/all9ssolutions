import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg', '@prisma/adapter-pg'],
  async redirects() {
    return [
      {
        source: '/development-process',
        destination: '/lifecycle-services',
        permanent: true,
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
