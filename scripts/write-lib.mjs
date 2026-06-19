import fs from "fs";
import path from "path";
const root = "C:/forestbond-clone/web";
function write(rel, content) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
  console.log("wrote", rel);
}

write("src/lib/config.ts", fs.readFileSync(new URL("./snippets/config.ts", import.meta.url), "utf8"));
write("src/lib/types.ts", fs.readFileSync(new URL("./snippets/types.ts", import.meta.url), "utf8"));
write("src/lib/utils.ts", fs.readFileSync(new URL("./snippets/utils.ts", import.meta.url), "utf8"));
