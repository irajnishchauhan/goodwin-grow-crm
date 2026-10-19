function cleanDatabaseUrl(raw) {
  if (!raw) return undefined;
  let url = String(raw).trim();
  const p1 = url.indexOf("postgresql://");
  const p2 = url.indexOf("postgres://");
  let idx = -1;
  if (p1 !== -1 && p2 !== -1) idx = Math.min(p1, p2);
  else if (p1 !== -1) idx = p1;
  else if (p2 !== -1) idx = p2;

  if (idx !== -1) {
    url = url.substring(idx);
  }
  while (url.endsWith('"') || url.endsWith("'") || url.endsWith(";")) {
    url = url.slice(0, -1).trim();
  }
  return url;
}

const rawDbUrl =
  process.env.DATABASE_URL ||
  process.env.STORAGE_DATABASE_URL ||
  process.env.STORAGE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

const activeDbUrl = cleanDatabaseUrl(rawDbUrl);
if (activeDbUrl) {
  process.env.DATABASE_URL = activeDbUrl;
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
