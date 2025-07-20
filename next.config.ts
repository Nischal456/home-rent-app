/** @type {import('next').NextConfig} */
const nextConfig = {
  // any other configurations you have might be here

  eslint: {
    // This tells Vercel to allow the build even with errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;