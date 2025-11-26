```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore canvas module on server side (konva only needs it on client)
      config.externals = config.externals || [];
      config.externals.push('canvas');
    }
    return config;
  },
};

export default nextConfig;
