import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The live site calls this page Info. Old links keep working.
  async redirects() {
    return [{ source: "/info", destination: "/about", permanent: true }];
  },
};

export default nextConfig;
