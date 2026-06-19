import fs from "fs";
const js=fs.readFileSync("C:/forestbond-clone/analysis/pages/3b29ca4936619ef3.js","utf8");
const i=js.indexOf("issue-gov-data");
console.log(js.slice(i, i+1200));
