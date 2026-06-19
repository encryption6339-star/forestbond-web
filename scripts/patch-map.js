const fs = require("fs");
const path = "C:/forestbond-clone/web/src/components/MapPageClient.tsx";
let f = fs.readFileSync(path, "utf8");
f = f.replace('import { GridStack } from "gridstack";', 'import { GridStack, type GridItemHTMLElement } from "gridstack";');
f = f.replace('useRef<Map<string, HTMLDivElement>>', 'useRef<Map<string, GridItemHTMLElement>>');
if (!f.includes("mountedRef")) {
  f = f.replace(
    "  const itemRefs = useRef<Map<string, GridItemHTMLElement>>(new Map());\n  const highlightedRef",
    "  const itemRefs = useRef<Map<string, GridItemHTMLElement>>(new Map());\n  const mountedRef = useRef(true);\n  const highlightedRef"
  );
}
f = f.replace(
  "    if (el && gridRef.current) {\n      gridRef.current.removeWidget(el, false);\n    }",
  "    const grid = gridRef.current;\n    if (!el || !grid || !mountedRef.current) return;\n    if (el.gridstackNode) {\n      grid.removeWidget(el, false, false);\n    }"
);
f = f.replace("gridRef.current.removeAll(false);", "gridRef.current.removeAll(false, false);");
f = f.replace(
  '          animate: true,\n          draggable: { handle: ".card-header" },',
  '          animate: true,\n          auto: false,\n          draggable: { handle: ".card-header", appendTo: "parent" },'
);
f = f.replace(
  "  useEffect(() => {\n    return () => {\n      if (gridRef.current) {\n        gridRef.current.off(\"change\");\n        gridRef.current.destroy(false);",
  "  useEffect(() => {\n    mountedRef.current = true;\n    return () => {\n      mountedRef.current = false;\n      if (gridRef.current) {\n        gridRef.current.off(\"change\");\n        gridRef.current.removeAll(false, false);\n        gridRef.current.destroy(false);"
);
f = f.replace(
  "    if (!gridElRef.current) return;",
  "    if (!gridElRef.current || !mountedRef.current) return;"
);
f = f.replace(
  "    if (!gridRef.current) return;",
  "    if (!gridRef.current || !mountedRef.current) return;"
);
fs.writeFileSync(path, f, "utf8");
console.log("patched", f.includes("GridItemHTMLElement"), f.includes("mountedRef"));
