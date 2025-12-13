import type { NextConfig } from 'next';

// Next.js 16 configuration for KOIKI-(TS)FW
//
// We enable typedRoutes to get compile-time type safety for all route paths.
// Server Actions are now stable in Next.js 16 and no longer require experimental flags.
// When using turbopack in production builds, use `next build --turbo` (see package.json scripts).

const nextConfig: NextConfig = {
  /**
   * Enable typed routes for compile-time safety when using <Link href="..." />
   * and route helpers. This is stable in Next.js 16.
   */
  typedRoutes: true,
};

export default nextConfig;
