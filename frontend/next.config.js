/** @type {import('next').NextConfig} */
const backendUrl =
  process.env.NODE_ENV === 'production'
    ? process.env.BACKEND_URL || 'https://freepet.onrender.com'
    : 'http://localhost:8000';

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      },
    ],
  },
  async rewrites() {
    // В проде Vercel проксирует /api и /uploads на бэкенд — без CORS и без build-переменных
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
