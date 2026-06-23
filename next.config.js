/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The functions/ dir is a separate Cloud Functions package — never bundle it.
  outputFileTracingExcludes: {
    "*": ["functions/**"],
  },
};

module.exports = nextConfig;
