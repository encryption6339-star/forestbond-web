import fs from "fs";
import path from "path";

const root = path.resolve("C:/forestbond-clone/web");

function write(rel, content) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
  console.log("wrote", rel);
}

write("next.config.ts", `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
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
`);
