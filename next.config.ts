import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/bankapi/:path*",
        destination: "https://forestbond.co.kr/bankapi/:path*",
      },
      {
        source: "/api/:path*",
        destination: "https://forestbond.co.kr/api/:path*",
      },
      {
        source: "/searchapi/:path*",
        destination: "https://forestbond.co.kr/searchapi/:path*",
      },
      {
        source: "/heatmapapi/:path*",
        destination: "https://forestbond.co.kr/heatmapapi/:path*",
      },
    ];
  },
};

export default nextConfig;