import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove static export for now to support dynamic routes
  // output: 'export', // Static export for S3 deployment
  // trailingSlash: true, // Required for S3 static hosting
  images: {
    unoptimized: true, // Required for static export
  },
  env: {
    // API Gateway URL will be injected during build
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api',
  },
  // Optimize for production
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
