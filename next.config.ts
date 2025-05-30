
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // For Google User Avatars
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.freepik.com', // Added for the new image
        port: '',
        pathname: '/**',
      }
    ],
  },
  webpack: (config, { isServer }) => {
    // For server-side code, Genkit might try to optionally load Jaeger.
    // We mark it as external to prevent Webpack from trying to bundle it
    // if it's not explicitly installed as a dependency for tracing.
    // This helps resolve "Module not found" warnings during the build.
    if (isServer) {
        config.externals = [
            ...(config.externals || []),
            { '@opentelemetry/exporter-jaeger': 'commonjs @opentelemetry/exporter-jaeger' },
        ];
    }

    // Attempt to ignore Handlebars warnings about require.extensions
    // These warnings are often benign but can be noisy or interfere with some build systems.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      (warning) => {
        return (
          warning.module &&
          warning.module.resource &&
          typeof warning.module.resource === 'string' &&
          warning.module.resource.includes('node_modules/handlebars/lib/index.js') &&
          typeof warning.message === 'string' &&
          warning.message.includes('require.extensions is not supported by webpack')
        );
      },
    ];

    return config;
  },
};

export default nextConfig;
