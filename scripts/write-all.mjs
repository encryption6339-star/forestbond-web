import fs from "fs";
import path from "path";

const root = "C:/forestbond-clone/web";
const snippets = path.join(root, "scripts/snippets");

function copy(rel, snippet) {
  const src = path.join(snippets, snippet);
  const dest = path.join(root, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log("copied", rel);
}

copy("src/app/globals.css", "globals.css");
copy("src/app/layout.tsx", "layout.tsx");
copy("src/app/page.tsx", "page.tsx");
copy("src/lib/config.ts", "config.ts");
copy("src/lib/types.ts", "types.ts");
copy("src/lib/utils.ts", "utils.ts");
copy("src/hooks/useBondFeed.ts", "useBondFeed.ts");
copy("src/hooks/useDualSocket.ts", "useDualSocket.ts");
copy("src/components/AppShell.tsx", "AppShell.tsx");
copy("src/components/PageHeader.tsx", "PageHeader.tsx");
copy("src/components/ConnectionBadge.tsx", "ConnectionBadge.tsx");
copy("src/components/PlaceholderPage.tsx", "PlaceholderPage.tsx");
copy("src/components/DualBondTable.tsx", "DualBondTable.tsx");
copy("src/components/MapPageClient.tsx", "MapPageClient.tsx");
copy("src/components/CompassPageClient.tsx", "CompassPageClient.tsx");
copy("src/components/OrderBookClient.tsx", "OrderBookClient.tsx");
copy("src/components/HeatmapClient.tsx", "HeatmapClient.tsx");
copy("src/app/(dashboard)/layout.tsx", "dashboard-layout.tsx");
copy("src/app/(dashboard)/map/page.tsx", "map-page.tsx");
copy("src/app/(dashboard)/compass/page.tsx", "compass-page.tsx");
copy("src/app/(dashboard)/order-book/page.tsx", "order-book-page.tsx");
copy("src/app/(dashboard)/heatmap/page.tsx", "heatmap-page.tsx");
copy("src/app/(dashboard)/bank-issue/page.tsx", "bank-issue-page.tsx");
copy("src/app/(dashboard)/public-issue/page.tsx", "public-issue-page.tsx");
copy("src/app/(dashboard)/bond-issue/page.tsx", "bond-issue-page.tsx");
copy("src/app/(dashboard)/introduction/page.tsx", "introduction-page.tsx");
copy("src/app/(dashboard)/guide/trade/page.tsx", "trade-guide-page.tsx");
