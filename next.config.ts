import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  // Configuration pour le domaine
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Autoriser CORS pour l'IP locale et le domaine custom
          {
            key: 'Access-Control-Allow-Origin',
            value: 'http://192.168.1.150,https://home.regispailler.fr'
          }
        ]
      }
    ];
  },
  // Configuration des domaines autorisés
  images: {
    domains: ['home.regispailler.fr', '192.168.1.150']
  },
  // Optionnel : rewrites pour supporter l'accès par IP ou domaine
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: 'http://192.168.1.150:3000/:path*'
      },
      {
        source: '/:path*',
        destination: 'https://home.regispailler.fr/:path*'
      }
    ];
  }
};

export default nextConfig;