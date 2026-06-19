"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { GridStack, type GridItemHTMLElement } from "gridstack";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  DEFAULT_LAYOUT,
  LAYOUT_STORAGE_KEY,
  type CategoryId,
} from "@/lib/config";
import type { BondMessage, GridLayoutItem } from "@/lib/types";
import { copyText, formatRow, matchesSearch } from "@/lib/utils";
import { useBondFeed } from "@/hooks/useBondFeed";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { PageHeader } from "@/components/PageHeader";
import { ChevronDown } from "lucide-react";

type CardState = {
  id: string;
  category: CategoryId;
  query: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

function CategoryCard({
  category,
  query,
  onQueryChange,
  onDuplicate,
  onClose,
  getByCategory,
  highlightedIds,
}: {
  category: CategoryId;
  query: string;
  onQueryChange: (value: string) => void;
  onDuplicate: () => void;
  onClose: () => void;
  getByCategory: (category: string) => BondMessage[];
  highlightedIds: Set<number>;
}) {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const list = getByCategory(category).filter((m) => matchesSearch(m, query));

  return (
    <div className="bond-map-category-card" data-category={category} data-include-source="true">
      <div className="card-header">
        <button className="icon-btn duplicate-btn" type="button" title="카드 복제" onClick={onDuplicate}>+</button>
        <div className="card-title">{CATEGORY_LABELS[category] ?? category}</div>
        <div className="card-actions">
          <button className="icon-btn close-btn" type="button" title="닫기" onClick={onClose}>×</button>
        </div>
      </div>
      <div className="card-search">
        <input type="search" placeholder="채권군 이름 / 유사어 탐색" value={query} onChange={(e) => onQueryChange(e.target.value)} />
      </div>
      <div className="card-body">
        {list.length === 0 ? (
          <div className="empty-state">표시할 항목이 없습니다</div>
        ) : (
          list.slice(0, 200).map((msg) => {
            const { prefix, company, hasName } = formatRow(msg, true);
            return (
              <div
                key={msg.id}
                className={["message-row", hasName ? "has-name" : "", highlightedIds.has(msg.id) ? "highlighted" : ""].filter(Boolean).join(" ")}
                onClick={async () => {
                  const text = [msg.trade_name, msg.trade_time, msg.message, msg.trade_company].filter(Boolean).join(" ");
                  if (await copyText(text)) {
                    setCopiedId(msg.id);
                    setTimeout(() => setCopiedId(null), 1200);
                  }
                }}
              >
                {prefix} : <strong>{msg.message}</strong>
                {company ? <span>{company}</span> : null}
                {copiedId === msg.id ? <span className="copied">Copied!</span> : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function loadLayout(): GridLayoutItem[] {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT.map((item) => ({ ...item }));
    const parsed = JSON.parse(raw) as GridLayoutItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("empty");
    return parsed;
  } catch {
    return DEFAULT_LAYOUT.map((item) => ({ ...item }));
  }
}

function layoutToCards(layout: GridLayoutItem[]): CardState[] {
  return layout
    .map((item) => {
      const category = String(item.id).split("-")[0] as CategoryId;
      if (!CATEGORIES.includes(category)) return null;
      return {
        id: String(item.id),
        category,
        query: "",
        x: item.x ?? 0,
        y: item.y ?? 0,
        w: item.w ?? 4,
        h: item.h ?? 4,
      };
    })
    .filter((item): item is CardState => item != null);
}

function defaultCards(): CardState[] {
  return layoutToCards(DEFAULT_LAYOUT.map((item) => ({ ...item })));
}

export function MapPageClient() {
  const { status, getByCategory, subscribe } = useBondFeed();
  const gridRef = useRef<GridStack | null>(null);
  const gridElRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, GridItemHTMLElement>>(new Map());
  const mountedRef = useRef(true);
  const highlightedRef = useRef<Set<number>>(new Set());
  const [cards, setCards] = useState<CardState[]>(() => layoutToCards(loadLayout()));
  const [feedVersion, setFeedVersion] = useState(0);
  const [tipsOpen, setTipsOpen] = useState(false);

  const saveLayout = useCallback(() => {
    if (!gridRef.current || !mountedRef.current) return;
    const saved = gridRef.current.save(false) as Array<{ id?: string; x?: number; y?: number; w?: number; h?: number }>;
    localStorage.setItem(
      LAYOUT_STORAGE_KEY,
      JSON.stringify(saved.map((item) => ({ id: String(item.id), x: item.x ?? 0, y: item.y ?? 0, w: item.w ?? 4, h: item.h ?? 4 })))
    );
  }, []);

  const detachWidget = useCallback((id: string) => {
    const el = itemRefs.current.get(id);
    const grid = gridRef.current;
    if (!el || !grid || !mountedRef.current) return;
    if (el.gridstackNode) {
      grid.removeWidget(el, false, false);
    }
  }, []);

  const addCard = useCallback((category: CategoryId) => {
    setCards((prev) => [
      ...prev,
      {
        id: category + "-" + String(Date.now()),
        category,
        query: "",
        x: 0,
        y: 0,
        w: 4,
        h: 4,
      },
    ]);
  }, []);

  const removeCard = useCallback(
    (id: string) => {
      detachWidget(id);
      itemRefs.current.delete(id);
      setCards((prev) => prev.filter((c) => c.id !== id));
      requestAnimationFrame(() => saveLayout());
    },
    [detachWidget, saveLayout]
  );

  const resetLayout = useCallback(() => {
    if (!confirm("레이아웃을 초기화할까요?")) return;
    localStorage.removeItem(LAYOUT_STORAGE_KEY);
    if (gridRef.current) {
      gridRef.current.removeAll(false, false);
    }
    itemRefs.current.clear();
    setCards(defaultCards());
    requestAnimationFrame(() => saveLayout());
  }, [saveLayout]);

  useLayoutEffect(() => {
    if (!gridElRef.current || !mountedRef.current) return;

    if (!gridRef.current) {
      const grid = GridStack.init(
        {
          column: 12,
          cellHeight: 70,
          margin: 8,
          float: true,
          animate: true,
          auto: false,
          draggable: { handle: ".card-header", appendTo: "parent" },
          resizable: { handles: "se" },
        },
        gridElRef.current
      );
      gridRef.current = grid;
      grid.on("change", saveLayout);
    }

    cards.forEach((card) => {
      const el = itemRefs.current.get(card.id);
      if (el && !el.gridstackNode) {
        gridRef.current?.makeWidget(el);
      }
    });
  }, [cards, saveLayout]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (gridRef.current) {
        gridRef.current.off("change");
        gridRef.current.removeAll(false, false);
        gridRef.current.destroy(false);
        gridRef.current = null;
      }
      itemRefs.current.clear();
    };
  }, []);

  useEffect(() => {
    return subscribe((event, data) => {
      if (event === "update" && Array.isArray(data)) {
        (data as BondMessage[]).forEach((m) => highlightedRef.current.add(m.id));
        setFeedVersion((n) => n + 1);
        setTimeout(() => {
          highlightedRef.current.clear();
          setFeedVersion((n) => n + 1);
        }, 3000);
      }
      if (event === "snapshot" || event === "update") {
        setFeedVersion((n) => n + 1);
      }
    });
  }, [subscribe]);

  const tipsChevronStyle = tipsOpen ? { transform: "rotate(180deg)" } : undefined;

  return (
    <>
      <PageHeader
        title="실시간 장외채권 호가 맵"
        description="메신저의 실시간 메시지를 채권군 카테고리별로 탐색합니다. 행을 클릭하면 내용이 클립보드에 복사됩니다."
        actions={
          <>
            <ConnectionBadge status={status} />
            <button type="button" className="btn" onClick={resetLayout}>
              레이아웃 초기화
            </button>
          </>
        }
        below={
          <>
            <button type="button" className="tips-toggle" onClick={() => setTipsOpen((v) => !v)}>
              <span>화면 사용 팁</span>
              <ChevronDown size={16} style={tipsChevronStyle} />
            </button>
            {tipsOpen ? (
              <div className="tips-panel">
                <ul>
                  <li>헤더 왼쪽 + 를 누르면 해당 카드가 복제됩니다.</li>
                  <li>헤더를 잡고 드래그하면 순서와 배치를 바꿀 수 있습니다.</li>
                  <li>오른쪽 하단 모서리를 드래그하면 카드 크기를 조절할 수 있습니다.</li>
                  <li>채권군 이름 검색창에서 유사어 탐색이 가능합니다.</li>
                </ul>
              </div>
            ) : null}
          </>
        }
      />
      <div className="grid-stack" ref={gridElRef} id="bondGrid" data-feed-version={feedVersion}>
        {cards.map((card) => (
          <div
            key={card.id}
            ref={(el) => {
              if (el) itemRefs.current.set(card.id, el);
              else itemRefs.current.delete(card.id);
            }}
            className="grid-stack-item"
            gs-id={card.id}
            gs-x={card.x}
            gs-y={card.y}
            gs-w={card.w}
            gs-h={card.h}
          >
            <div className="grid-stack-item-content">
              <CategoryCard
                category={card.category}
                query={card.query}
                onQueryChange={(value) =>
                  setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, query: value } : c)))
                }
                onDuplicate={() => addCard(card.category)}
                onClose={() => removeCard(card.id)}
                getByCategory={getByCategory}
                highlightedIds={highlightedRef.current}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="footer-note">
        포털사이트를 통해 제공되는 정보는 단순 참고용이며 오류·지연이 발생할 수 있습니다. 정보 이용에 따른 책임은
        이용자 본인에게 있습니다.
      </p>
    </>
  );
}
