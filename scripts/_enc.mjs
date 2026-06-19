import fs from "fs";
const files=["src/components/IntroductionClient.tsx","src/components/BankIssueClient.tsx","src/components/TradeGuideClient.tsx"];
for (const f of files) {
  const s=fs.readFileSync(f,"utf8");
  const ok=s.includes("\uC18C\uAC1C") || s.includes("FORESTBOND");
  console.log(f, "has intro ko", s.includes("\uC18C\uAC1C"), "sample", s.split("\n")[8]?.slice(0,60));
}
