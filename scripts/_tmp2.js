const fs=require("fs");
const js=fs.readFileSync("C:/forestbond-clone/analysis/pages/680f6650db54d52e.js","utf8");
const i=js.indexOf("issue_public_data");
console.log(js.slice(i, i+800));
