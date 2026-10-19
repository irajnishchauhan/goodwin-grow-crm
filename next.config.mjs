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
