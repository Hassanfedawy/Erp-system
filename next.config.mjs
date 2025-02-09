/** @type {import('next').NextConfig} */
import { createRequire } from 'module';

// Create a require function to use CommonJS modules
const require = createRequire(import.meta.url);

// Import Webpack from Next.js's compiled version
import webpack from 'next/dist/compiled/webpack/webpack-lib.js';

const nextConfig = {
  basePath: process.env.BASEPATH,
  redirects: async () => [
    {
      source: '/',
      destination: '/en/dashboards/crm',
      permanent: true,
      locale: false
    },
    {
      source: '/:lang(en|fr|ar)',
      destination: '/:lang/dashboards/crm',
      permanent: true,
      locale: false
    },
    {
      source: '/((?!(?:en|fr|ar|front-pages|favicon.ico)\\b)):path',
      destination: '/en/:path',
      permanent: true,
      locale: false
    }
  ],
  eslint: {
    ignoreDuringBuilds: true, // Disable ESLint during production builds
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        assert: require.resolve('assert'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify/browser'),
        url: require.resolve('url')
      };

      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer']
        })
      );
    }
    return config;
  }
};

export default nextConfig;
