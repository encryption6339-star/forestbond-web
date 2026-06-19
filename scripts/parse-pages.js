const fs=require("fs");
const dir="C:/forestbond-clone/analysis/pages";
for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith(".js")) continue;
  const js=fs.readFileSync(dir+"/"+file,"utf8");
  const korean=[...new Set([...js.matchAll(/[\uAC00-\uD7A3]{2,}/g)].map(m=>m[0]))].slice(0,15);
  const apis=[...new Set([...js.matchAll(/\/api\/[a-zA-Z0-9_/-]+|\/searchapi\/[a-zA-Z0-9_/-]+|\/heatmapapi\/[a-zA-Z0-9_/-]+|wss?:\/\/[^"'`\s]+/g)].map(m=>m[0]))];
  const fetchUrls=[...new Set([...js.matchAll(/fetch\s*\(\s*["'`]([^"'`]+)["'`]/g)].map(m=>m[1]))];
  console.log("\n===", file, "len", js.length, "===");
  console.log("API:", apis.join(" | ") || "(none)");
  console.log("fetch:", fetchUrls.join(" | ") || "(none)");
  console.log("KO:", korean.join(" | "));
}
