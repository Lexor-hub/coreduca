import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', '@supabase/supabase-js'],
  },
};

export default nextConfig;
