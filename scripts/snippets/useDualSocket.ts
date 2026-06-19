"use client";

import { useEffect, useState } from "react";
import { WS_DUAL_URL } from "@/lib/config";
import type { DualBondRow } from "@/lib/types";

export function useDualSocket() {
  const [govRows, setGovRows] = useState<DualBondRow[]>([]);
  const [monRows, setMonRows] = useState<DualBondRow[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const connect = () => {
      ws = new WebSocket(WS_DUAL_URL);
      ws.addEventListener("open", () => {
        setConnected(true);
        setLoading(false);
      });
      ws.addEventListener("message", (ev) => {
        try {
          const data = JSON.parse(String(ev.data)) as { event?: string; payload?: DualBondRow[] };
          if (data.event === "gov" && Array.isArray(data.payload)) setGovRows(data.payload);
          if (data.event === "mon" && Array.isArray(data.payload)) setMonRows(data.payload);
        } catch {
          /* ignore */
        }
      });
      ws.addEventListener("close", () => {
        setConnected(false);
        if (!closed) reconnectTimer = setTimeout(connect, 3000);
      });
      ws.addEventListener("error", () => setConnected(false));
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  return { govRows, monRows, connected, loading };
}
