"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MESSENGER_ROOMS } from "@/lib/dashboard-config";
import { WS_DUAL_URL, WS_MAP_URL } from "@/lib/config";
import type { BondMessage, DualBondRow } from "@/lib/types";
import { mergeBondMessages } from "@/lib/utils";

function normalizeMessages(payload: unknown): BondMessage[] {
  if (!Array.isArray(payload)) return [];
  return payload.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      id: Number(row.id),
      source: String(row.source ?? ""),
      category: String(row.category ?? "etc"),
      match_value: String(row.match_value ?? ""),
      trade_name: String(row.trade_name ?? ""),
      trade_time: String(row.trade_time ?? ""),
      message: String(row.message ?? ""),
      trade_company: row.trade_company ? String(row.trade_company) : null,
      created_at: String(row.created_at ?? new Date().toISOString()),
    };
  });
}

const MOCK_MESSAGES: BondMessage[] = [
  { id: 1, source: "makmu", category: "gov", match_value: "25-5", trade_name: "성윤수", trade_time: "09:22:35", message: "25-5 30억 -1원 사자", trade_company: "KIDB 772-7818", created_at: new Date().toISOString() },
  { id: 2, source: "", category: "mon", match_value: "통", trade_name: "김태연", trade_time: "09:22:45", message: "27.7.2통 민-3원 거래 후 추팔", trade_company: "** 채권 Sales", created_at: new Date().toISOString() },
  { id: 3, source: "makmu", category: "comp", match_value: "SK", trade_name: "정**", trade_time: "09:23:10", message: "SK에너지47-3(30.4.24 민4.400,AA) 팔자", trade_company: "** 채권금융부", created_at: new Date().toISOString() },
];

export function useIntegratedFeed() {
  const [messages, setMessages] = useState<BondMessage[]>([]);
  const [govRows, setGovRows] = useState<DualBondRow[]>([]);
  const [monRows, setMonRows] = useState<DualBondRow[]>([]);
  const [mapConnected, setMapConnected] = useState(false);
  const [dualConnected, setDualConnected] = useState(false);
  const [mapMock, setMapMock] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let mockTimer: ReturnType<typeof setTimeout> | null = null;
    let mock = false;
    let hadRealData = false;

    const applyMessages = (incoming: BondMessage[]) => {
      if (incoming.length === 0) return;
      hadRealData = true;
      mock = false;
      setMapMock(false);
      setMessages((prev) => mergeBondMessages(prev, incoming));
    };

    const startMock = () => {
      if (hadRealData) return;
      mock = true;
      setMapMock(true);
      setMapConnected(true);
      setMessages(MOCK_MESSAGES);
    };

    const connect = () => {
      try {
        ws = new WebSocket(WS_MAP_URL);
      } catch {
        startMock();
        return;
      }

      ws.addEventListener("open", () => {
        mock = false;
        setMapMock(false);
        setMapConnected(true);
      });

      ws.addEventListener("message", (ev) => {
        try {
          const data = JSON.parse(String(ev.data));
          if (Array.isArray(data.payload)) {
            applyMessages(normalizeMessages(data.payload));
          } else if (Array.isArray(data)) {
            applyMessages(normalizeMessages(data));
          }
        } catch {
          /* ignore malformed payloads */
        }
      });

      ws.addEventListener("close", () => {
        setMapConnected(false);
        if (!mock) timer = setTimeout(connect, 3000);
      });

      ws.addEventListener("error", () => {
        if (!hadRealData && !mock) startMock();
      });

      mockTimer = setTimeout(() => {
        if (ws && ws.readyState !== WebSocket.OPEN && !mock && !hadRealData) startMock();
      }, 8000);
    };

    connect();
    return () => {
      if (timer) clearTimeout(timer);
      if (mockTimer) clearTimeout(mockTimer);
      ws?.close();
    };
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const connect = () => {
      ws = new WebSocket(WS_DUAL_URL);
      ws.addEventListener("open", () => setDualConnected(true));
      ws.addEventListener("message", (ev) => {
        try {
          const data = JSON.parse(String(ev.data));
          if (data.event === "gov") setGovRows(Array.isArray(data.payload) ? data.payload : []);
          if (data.event === "mon") setMonRows(Array.isArray(data.payload) ? data.payload : []);
        } catch { /* ignore */ }
      });
      ws.addEventListener("close", () => { setDualConnected(false); timer = setTimeout(connect, 3000); });
    };
    connect();
    return () => { if (timer) clearTimeout(timer); ws?.close(); };
  }, []);

  const getRoomMessages = useCallback((roomId: string) => {
    const room = MESSENGER_ROOMS.find((r) => r.id === roomId);
    if (!room) return [];
    return messages.filter((m) => room.categories.includes(String(m.category)));
  }, [messages]);

  const status = useMemo(() => ({
    map: { connected: mapConnected, mock: mapMock },
    dual: { connected: dualConnected, mock: false as const },
  }), [mapConnected, mapMock, dualConnected]);

  return { messages, govRows, monRows, getRoomMessages, status };
};
