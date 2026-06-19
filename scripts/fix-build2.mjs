import fs from "fs";
const mapPath = "C:/forestbond-clone/web/src/components/MapPageClient.tsx";
let map = fs.readFileSync(mapPath, "utf8");
map = map.replace(
  `    gridRef.current.addWidget(widget, {
      id: instanceId,
      w: layoutItem?.w ?? 4,
      h: layoutItem?.h ?? 4,
      x: layoutItem?.x,
      y: layoutItem?.y,
    });`,
  `    gridRef.current.addWidget({
      id: instanceId,
      w: layoutItem?.w ?? 4,
      h: layoutItem?.h ?? 4,
      x: layoutItem?.x,
      y: layoutItem?.y,
      el: widget,
    });`
);
fs.writeFileSync(mapPath, map);

let dual = fs.readFileSync("C:/forestbond-clone/web/src/components/DualBondTable.tsx", "utf8");
dual = dual.replace('import { actionLabel, copyText } from "@/lib/utils";', 'import { actionLabel } from "@/lib/utils";');
fs.writeFileSync("C:/forestbond-clone/web/src/components/DualBondTable.tsx", dual);

let heatmap = fs.readFileSync("C:/forestbond-clone/web/src/components/HeatmapClient.tsx", "utf8");
heatmap = heatmap.replace('  parseYmd,\n', '');
fs.writeFileSync("C:/forestbond-clone/web/src/components/HeatmapClient.tsx", heatmap);
console.log("patched");
