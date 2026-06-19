"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import {
  BookOpen,
  Building2,
  ClipboardList,
  Compass,
  Crosshair,
  FileText,
  Grid3X3,
  Info,
  Landmark,
  Activity,
  LayoutDashboard,
  Map,
  Menu,
  BookMarked,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/config";
import { cn } from "@/lib/utils";
import { NewsFeedPanel, NewsFeedToggle } from "@/components/NewsFeedPanel";

const iconMap = {
  compass: Compass,
  map: Map,
  book: BookMarked,
  building: Building2,
  landmark: Landmark,
  file: FileText,
  grid: Grid3X3,
  info: Info,
  "book-open": BookOpen,
  dashboard: LayoutDashboard,
  live: Activity,
  scope: Crosshair,
  "bond-order": ClipboardList,
} as const;

export function AppShell({
  actions,
  children,
}: {
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);

  const current = NAV_ITEMS.find((item) => item.href === pathname || pathname.startsWith(`${item.href}/`));
  const title = current?.label ?? "FORESTBOND";

  const sections = useMemo(() => {
    const grouped: Record<string, typeof NAV_ITEMS> = {};
    NAV_ITEMS.forEach((item) => {
      const key = item.section ?? "Other";
      grouped[key] = grouped[key] ?? [];
      grouped[key].push(item);
    });
    return grouped;
  }, []);

  return (
    <div className="app-shell">
      <aside className={cn("sidebar", collapsed && "collapsed", mobileOpen && "open")}>
        <div className="sidebar-header">
          <div className="brand-logo">FB</div>
          <span className="brand-name">FORESTBOND</span>
          <button
            type="button"
            className="sidebar-toggle"
            aria-label="사이드바 접기"
            onClick={() => setCollapsed((v) => !v)}
          >
            <Menu size={14} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {Object.entries(sections).map(([section, items]) => (
            <div key={section}>
              <div className="nav-section-title">{section}</div>
              {items.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Map;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn("nav-link", active && "active")}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="nav-icon">
                      <Icon size={16} />
                    </span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
      <div className="main-area">
        <header className="top-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              className="btn mobile-menu-btn"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="모바일 메뉴"
            >
              <Menu size={16} />
            </button>
            <strong>{title}</strong>
          </div>
          <div className="top-bar-actions">
            <NewsFeedToggle active={newsOpen} onClick={() => setNewsOpen((v) => !v)} />
            {actions}
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
      <NewsFeedPanel open={newsOpen} onClose={() => setNewsOpen(false)} />
    </div>
  );
}