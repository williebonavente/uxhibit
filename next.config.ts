import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sbsxkbapdmlnyhvjvsei.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "https",
        hostname: "s3.us-west-2.amazonaws.com",
        pathname: "/figma-alpha-api/**",
      },
      {
        protocol: "https",
        hostname: "figma-alpha-api.s3.us-west-2.amazonaws.com",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      }
    ],
    // domains: [
    //   "i.pravatar.cc",
    //   "sbsxkbapdmlnyhvjvsei.supabase.co",
    //   "www.figma.com"
    // ],
    unoptimized: true
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  experimental: {
    proxyClientMaxBodySize: '50mb',
  }

};

export default nextConfig;

