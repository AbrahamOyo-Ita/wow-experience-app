import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = (() => {
  if (!supabaseUrl) return null;
  try {
    return new URL(supabaseUrl).hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/minister-images/**",
          },
        ]
      : [],
  },
  async redirects() {
    return [
      {
        source: "/experience/:path*",
        destination: "/",
        permanent: false,
      },
      {
        source: "/experiences",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
