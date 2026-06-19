import fs from "fs";
const mapPath = "C:/forestbond-clone/web/src/components/MapPageClient.tsx";
let map = fs.readFileSync(mapPath, "utf8");
map = map.replace(
  `    gridRef.current.addWidget({
      id: instanceId,
      w: layoutItem?.w ?? 4,
      h: layoutItem?.h ?? 4,
      x: layoutItem?.x,
      y: layoutItem?.y,
      el: widget,
    });`,
  `    gridElRef.current?.appendChild(widget);
    gridRef.current.makeWidget(widget, {
      id: instanceId,
      w: layoutItem?.w ?? 4,
      h: layoutItem?.h ?? 4,
      x: layoutItem?.x,
      y: layoutItem?.y,
    });`
);
fs.writeFileSync(mapPath, map);
console.log("patched makeWidget");
