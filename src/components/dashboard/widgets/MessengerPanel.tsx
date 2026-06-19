"use client";

import { useMemo, useState } from "react";
import type { BondMessage } from "@/lib/types";
import { copyText, getMessengerRowStyle, matchesSearch } from "@/lib/utils";

export function MessengerPanel({ title, messages }: { title: string; messages: BondMessage[] }) {
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const filtered = useMemo(() => messages.filter((m) => matchesSearch(m, query)).slice(0, 300), [messages, query]);

  return (
    <div className="terminal-widget messenger-panel">
      <div className="terminal-widget-header">{title}</div>
      <div className="messenger-toolbar">
        <input type="search" placeholder="검색..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <span className="messenger-count">{filtered.length}건</span>
      </div>
      <div className="messenger-feed">
        {filtered.length === 0 ? (
          <div className="empty-state">수신된 메시지가 없습니다</div>
        ) : (
          filtered.map((msg) => {
            const style = getMessengerRowStyle(msg);
            return (
              <div
                key={msg.id}
                className="messenger-row"
                style={{ backgroundColor: style.bg, color: style.fg }}
                onClick={async () => {
                  const text = [msg.trade_name, msg.trade_time, msg.message, msg.trade_company ?? ""].filter(Boolean).join(" ");
                  await copyText(text);
                  setCopiedId(msg.id);
                  setTimeout(() => setCopiedId(null), 1200);
                }}
              >
                <span className="messenger-meta">{msg.trade_name} ({msg.trade_time})</span>
                {" : "}
                <strong>{msg.message}</strong>
                {msg.trade_company ? <span className="messenger-company"> ({msg.trade_company})</span> : null}
                {copiedId === msg.id ? <span className="copied-tag"> Copied!</span> : null}
              </div>
            );
          })
        )}
      </div>
      <div className="messenger-status">최종 수신 {messages[0]?.trade_time ?? "--:--:--"}</div>
    </div>
  );
}
