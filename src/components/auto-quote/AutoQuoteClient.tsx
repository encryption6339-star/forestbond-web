"use client";

import { useIntegratedFeed } from "@/hooks/useIntegratedFeed";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { KbondQuoteConsole } from "@/components/dashboard/KbondQuoteConsole";

export function AutoQuoteClient() {
  const feed = useIntegratedFeed();

  return (
    <div className="auto-quote-page">
      <div className="auto-quote-topbar">
        <div className="auto-quote-topbar-copy">
          <span className="auto-quote-kicker">Market · K-Bond Bridge</span>
          <h1 className="auto-quote-title">Auto Quote Console</h1>
          <p className="auto-quote-desc">
            Check Expert 시세와 메신저 호가를 연동해 자동/수동 재호가를 한 화면에서 확인합니다.
          </p>
        </div>
        <div className="auto-quote-badges">
          <ConnectionBadge status={feed.status.map} prefix="Map" />
          <ConnectionBadge status={feed.status.dual} prefix="Compass" />
        </div>
      </div>

      <div className="auto-quote-console-wrap">
        <KbondQuoteConsole
          messages={feed.messages}
          govRows={feed.govRows}
          monRows={feed.monRows}
          mapConnected={feed.status.map.connected}
          dualConnected={feed.status.dual.connected}
          fullPage
        />
      </div>
    </div>
  );
}
