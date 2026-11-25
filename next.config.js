/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  ...(process.platform === 'win32' ? {} : { output: 'standalone' }),

  serverExternalPackages: ['ffmpeg-static', 'ffprobe-static'],

  experimental: {
    serverActions: {
      bodySizeLimit: '30mb',
    },
  },
};

module.exports = nextConfig;
