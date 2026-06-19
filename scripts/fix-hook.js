const fs = require("fs");
let f = fs.readFileSync("C:/forestbond-clone/web/src/hooks/useLiveCharts.ts", "utf8");
f = f.replace(
  "import { useEffect, useMemo, useRef, useState } from \"react\";",
  "import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from \"react\";"
);
f = f.replace(
  "React.Dispatch<React.SetStateAction<SeriesState>>",
  "Dispatch<SetStateAction<SeriesState>>"
);
fs.writeFileSync("C:/forestbond-clone/web/src/hooks/useLiveCharts.ts", f);
console.log("ok");
