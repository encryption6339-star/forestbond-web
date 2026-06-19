import fs from "fs";

const tsconfigPath = "C:/forestbond-clone/web/tsconfig.json";
const raw = fs.readFileSync(tsconfigPath, "utf8").replace(/^\uFEFF/, "");
const ts = JSON.parse(raw);
ts.exclude = ["node_modules", "scripts"];
fs.writeFileSync(tsconfigPath, JSON.stringify(ts, null, 2) + "\n");

const mapPath = "C:/forestbond-clone/web/src/components/MapPageClient.tsx";
let map = fs.readFileSync(mapPath, "utf8");
map = map.replace(";`n    const layout = saved.map", ";\n    const layout = saved.map");
if (map.includes("gridRef.current.save(false).map")) {
  map = map.replace(
    "const layout = gridRef.current.save(false).map((item) => ({",
    "const saved = gridRef.current.save(false) as Array<{ id?: string; x?: number; y?: number; w?: number; h?: number }>;\n    const layout = saved.map((item) => ({"
  );
}
fs.writeFileSync(mapPath, map);
console.log("fixed tsconfig BOM and MapPageClient");
