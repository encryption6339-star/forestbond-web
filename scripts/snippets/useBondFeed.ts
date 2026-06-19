"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WS_MAP_URL } from "@/lib/config";
import type { BondMessage, ConnectionStatus } from "@/lib/types";

type Listener = (event: string, data?: unknown) => void;

function normalizePayload(payload: unknown): BondMessage[] {
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

export function useBondFeed() {
  const [messages, setMessages] = useState<BondMessage[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>({ connected: false, mock: false });
  const listenersRef = useRef<Set<Listener>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mockRef = useRef(false);

  const emit = useCallback((event: string, data?: unknown) => {
    listenersRef.current.forEach((fn) => fn(event, data));
  }, []);

  const getByCategory = useCallback(
    (category: string) => messages.filter((m) => m.category === category),
    [messages]
  );

  const subscribe = useCallback((fn: Listener) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  }, []);

  const startMock = useCallback(() => {
    mockRef.current = true;
    setStatus({ connected: true, mock: true });
    const samples: BondMessage[] = [
      {
        id: 1,
        source: "",
        category: "gov",
        match_value: "25-5",
        trade_name: "김**",
        trade_time: "11:30:12",
        message: "25-5 20억 사자",
        trade_company: "** FICC 709-****",
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        source: "",
        category: "mon",
        match_value: "통",
        trade_name: "이**",
        trade_time: "11:29:45",
        message: "27.7.2통 민-3원 거래 후 추팔",
        trade_company: "** 채권 Sales 768-****",
        created_at: new Date().toISOString(),
      },
    ];
    setMessages(samples);
    emit("snapshot", samples);
  }, [emit]);

  const connect = useCallback(() => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        /* ignore */
      }
    }
    setStatus({ connected: false, mock: mockRef.current });

    let ws: WebSocket;
    try {
      ws = new WebSocket(WS_MAP_URL);
    } catch {
      startMock();
      return;
    }

    wsRef.current = ws;

    ws.addEventListener("open", () => {
      mockRef.current = false;
      setStatus({ connected: true, mock: false });
    });

    ws.addEventListener("message", (ev) => {
      try {
        const data = JSON.parse(String(ev.data));
        if (data.event === "map" && Array.isArray(data.payload)) {
          const list = normalizePayload(data.payload);
          setMessages(list);
          emit("snapshot", list);
        } else if (Array.isArray(data.payload)) {
          const list = normalizePayload(data.payload);
          setMessages((prev) => {
            const next = [...prev];
            list.forEach((msg) => {
              const idx = next.findIndex((m) => m.id === msg.id);
              if (idx >= 0) next[idx] = msg;
              else next.unshift(msg);
            });
            return next.slice(0, 5000);
          });
          emit("update", list);
        } else if (Array.isArray(data)) {
          const list = normalizePayload(data);
          setMessages(list);
          emit("snapshot", list);
        }
      } catch {
        /* ignore malformed payloads */
      }
    });

    ws.addEventListener("close", () => {
      setStatus({ connected: false, mock: mockRef.current });
      if (!mockRef.current) {
        if (reconnectRef.current) clearTimeout(reconnectRef.current);
        reconnectRef.current = setTimeout(connect, 3000);
      }
    });

    ws.addEventListener("error", () => {
      if (!mockRef.current) startMock();
    });

    setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN && !mockRef.current) startMock();
    }, 5000);
  }, [emit, startMock]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { messages, status, getByCategory, subscribe };
}

