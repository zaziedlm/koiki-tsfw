import type { NextConfig } from 'next';

// Next.js 15 configuration for KOIKI-(TS)FW
//
// We enable typedRoutes to get compile-time type safety for all route paths.
// Server Actions remain enabled via the experimental flag. See the Next.js 15
// release notes for details on these settings. When using turbopack in
// production builds, use `next build --turbo` (see package.json scripts).

const nextConfig: NextConfig = {
  /**
   * Enable typed routes for compile-time safety when using <Link href="..." />
   * and route helpers. This requires Next.js 15.5 or later.
   */
  typedRoutes: true,
  experimental: {
    /**
     * Opt into React Server Actions. This remains stable in Next.js 15.
     */
    serverActions: {},
  },
};

export default nextConfig;
