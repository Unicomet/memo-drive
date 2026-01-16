/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: [
    "@opentelemetry/instrumentation",
    "import-in-the-middle",
    "zlib",
  ],
  async rewrites() {
    //Set a reverse proxy for postHog analytics
    return [
      {
        //Setting it for API calls
        source: "/drive-clone-ph/static/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        //Setting it for API calls
        source: "/drive-clone-ph/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default config;
