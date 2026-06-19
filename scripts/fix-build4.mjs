import fs from "fs";

let feed = fs.readFileSync("C:/forestbond-clone/web/src/hooks/useBondFeed.ts", "utf8");
feed = feed.replace(
  "return () => listenersRef.current.delete(fn);",
  "return () => { listenersRef.current.delete(fn); };"
);
fs.writeFileSync("C:/forestbond-clone/web/src/hooks/useBondFeed.ts", feed);

let map = fs.readFileSync("C:/forestbond-clone/web/src/components/MapPageClient.tsx", "utf8");
map = map.replace(
  `  useEffect(() => {
    return subscribe((event, data) => {`,
  `  useEffect(() => {
    const unsubscribe = subscribe((event, data) => {`
);
map = map.replace(
  `    });
  }, [subscribe, getByCategory]);`,
  `    });
    return () => { unsubscribe(); };
  }, [subscribe, getByCategory]);`
);
fs.writeFileSync("C:/forestbond-clone/web/src/components/MapPageClient.tsx", map);
console.log("fixed subscribe cleanup");
