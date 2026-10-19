// Auto-map Vercel Storage / Neon database environment variables to DATABASE_URL
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.STORAGE_DATABASE_URL ||
    process.env.STORAGE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["lucide-react"],
  async redirects() {
    return [
      { source: "/marketing", destination: "/app/social-media", permanent: false },
      { source: "/marketing/:path*", destination: "/app/social-media", permanent: false },
      { source: "/operations", destination: "/app/projects", permanent: false },
      { source: "/operations/:path*", destination: "/app/projects", permanent: false },
      { source: "/finance", destination: "/app/invoices", permanent: false },
      { source: "/finance/:path*", destination: "/app/invoices", permanent: false },
      { source: "/admin", destination: "/app/settings", permanent: false },
    ];
  },
};

export default nextConfig;
