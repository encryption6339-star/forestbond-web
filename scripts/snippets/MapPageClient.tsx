"use client";

import { useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { GridStack } from "gridstack";
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

function CategoryCard({
  category,
  instanceId,
  query,
  onQueryChange,
  onDuplicate,
  onClose,
  getByCategory,
  highlightedIds,
}: {
  category: CategoryId;
  instanceId: string;
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
    <div
      className="bond-map-category-card"
      data-category={category}
      data-instance={instanceId}
      data-include-source="true"
    >
      <div className="card-header">
        <button className="icon-btn duplicate-btn" type="button" title="카드 복제" onClick={onDuplicate}>
          +
        </button>
        <div className="card-title">{CATEGORY_LABELS[category] ?? category}</div>
        <div className="card-actions">
          <button className="icon-btn close-btn" type="button" title="닫기" onClick={onClose}>
            ×
          </button>
        </div>
      </div>
      <div className="card-search">
        <input
          type="search"
          placeholder="채권군 이름 / 유사어 탐색"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
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
                className={[
                  "message-row",
                  hasName ? "has-name" : "",
                  highlightedIds.has(msg.id) ? "highlighted" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={async () => {
                  const text = [msg.trade_name, msg.trade_time, msg.message, msg.trade_company]
                    .filter(Boolean)
                    .join(" ");
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

export function MapPageClient() {
  const { status, getByCategory, subscribe } = useBondFeed();
  const gridRef = useRef<GridStack | null>(null);
  const gridElRef = useRef<HTMLDivElement>(null);
  const cardStateRef = useRef<Map<string, { category: CategoryId; query: string }>>(new Map());
  const rootsRef = useRef<Map<string, Root>>(new Map());
  const highlightedRef = useRef<Set<number>>(new Set());
  const [, forceRender] = useState(0);
  const [tipsOpen, setTipsOpen] = useState(false);

  const refreshAllCards = () => forceRender((n) => n + 1);

  const renderCard = (instanceId: string) => {
    const state = cardStateRef.current.get(instanceId);
    const root = rootsRef.current.get(instanceId);
    if (!state || !root) return;
    root.render(
      <CategoryCard
        category={state.category}
        instanceId={instanceId}
        query={state.query}
        onQueryChange={(value) => {
          cardStateRef.current.set(instanceId, { ...state, query: value });
          renderCard(instanceId);
        }}
        onDuplicate={() => duplicateCard(state.category)}
        onClose={() => removeCard(instanceId)}
        getByCategory={getByCategory}
        highlightedIds={highlightedRef.current}
      />
    );
  };

  const saveLayout = () => {
    if (!gridRef.current) return;
    const saved = gridRef.current.save(false) as Array<{ id?: string; x?: number; y?: number; w?: number; h?: number }>;`n    const layout = saved.map((item) => ({
      id: String(item.id),
      x: item.x ?? 0,
      y: item.y ?? 0,
      w: item.w ?? 4,
      h: item.h ?? 4,
    }));
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  };

  const addCardToGrid = (category: CategoryId, layoutItem?: Partial<GridLayoutItem>) => {
    if (!gridRef.current) return;
    const instanceId = layoutItem?.id ?? `${category}-${Date.now()}`;
    cardStateRef.current.set(instanceId, { category, query: "" });

    const widget = document.createElement("div");
    widget.className = "grid-stack-item";
    widget.setAttribute("gs-id", instanceId);
    widget.innerHTML = '<div class="grid-stack-item-content"></div>';
    const content = widget.querySelector(".grid-stack-item-content") as HTMLElement;
    const root = createRoot(content);
    rootsRef.current.set(instanceId, root);

    gridRef.current.addWidget(widget, {
      id: instanceId,
      w: layoutItem?.w ?? 4,
      h: layoutItem?.h ?? 4,
      x: layoutItem?.x,
      y: layoutItem?.y,
    });
    renderCard(instanceId);
  };

  const duplicateCard = (category: CategoryId) => {
    addCardToGrid(category, { w: 4, h: 4 });
    saveLayout();
  };

  const removeCard = (instanceId: string) => {
    const node = gridElRef.current?.querySelector(`.grid-stack-item[gs-id="${instanceId}"]`);
    if (node && gridRef.current) gridRef.current.removeWidget(node as HTMLElement);
    rootsRef.current.get(instanceId)?.unmount();
    rootsRef.current.delete(instanceId);
    cardStateRef.current.delete(instanceId);
    saveLayout();
  };

  const resetLayout = () => {
    if (!gridRef.current) return;
    if (!confirm("레이아웃을 초기화할까요?")) return;
    localStorage.removeItem(LAYOUT_STORAGE_KEY);
    rootsRef.current.forEach((root) => root.unmount());
    rootsRef.current.clear();
    cardStateRef.current.clear();
    gridRef.current.removeAll(false);
    DEFAULT_LAYOUT.forEach((item) => addCardToGrid(item.id as CategoryId, item));
    saveLayout();
  };

  useEffect(() => {
    if (!gridElRef.current || gridRef.current) return;

    const grid = GridStack.init(
      {
        column: 12,
        cellHeight: 70,
        margin: 8,
        float: true,
        animate: true,
        draggable: { handle: ".card-header" },
        resizable: { handles: "se" },
      },
      gridElRef.current
    );
    gridRef.current = grid;

    loadLayout().forEach((item) => {
      const category = String(item.id).split("-")[0] as CategoryId;
      if (!CATEGORIES.includes(category)) return;
      addCardToGrid(category, item);
    });

    grid.on("change", saveLayout);

    return () => {
      grid.destroy(false);
      rootsRef.current.forEach((root) => root.unmount());
      rootsRef.current.clear();
      gridRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return subscribe((event, data) => {
      if (event === "update" && Array.isArray(data)) {
        (data as BondMessage[]).forEach((m) => highlightedRef.current.add(m.id));
        refreshAllCards();
        setTimeout(() => {
          highlightedRef.current.clear();
          refreshAllCards();
        }, 3000);
      }
      if (event === "snapshot" || event === "update") {
        cardStateRef.current.forEach((_, id) => renderCard(id));
      }
    });
  }, [subscribe, getByCategory]);

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
            <button type="button" className="btn btn-primary">
              로그인
            </button>
          </>
        }
        below={
          <>
            <button type="button" className="tips-toggle" onClick={() => setTipsOpen((v) => !v)}>
              <span>화면 사용 팁</span>
              <ChevronDown size={16} style={{ transform: tipsOpen ? "rotate(180deg)" : undefined }} />
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
      <div className="grid-stack" ref={gridElRef} id="bondGrid" />
      <p className="footer-note">
        포털사이트를 통해 제공되는 정보는 단순 참고용이며 오류·지연이 발생할 수 있습니다. 정보 이용에 따른 책임은
        이용자 본인에게 있습니다.
      </p>
    </>
  );
}

