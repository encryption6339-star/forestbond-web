const fs=require("fs");
const js=fs.readFileSync("C:/forestbond-clone/analysis/pages/27e38b1179e9fe11.js","utf8");
const matches=[...js.matchAll(/news-feed[^`]{0,200}/gi)];
matches.slice(0,10).forEach(m=>console.log(m[0]));
