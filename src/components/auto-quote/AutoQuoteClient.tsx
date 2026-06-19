"use client";

import { useIntegratedFeed } from "@/hooks/useIntegratedFeed";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { KbondQuoteConsole } from "@/components/dashboard/KbondQuoteConsole";

export function AutoQuoteClient() {
  const feed = useIntegratedFeed();

  return (
    <div className="auto-quote-page">
      <div className="auto-quote-toolbar">
        <ConnectionBadge status={feed.status.map} prefix="Map" />
        <ConnectionBadge status={feed.status.dual} prefix="Compass" />
      </div>
      <KbondQuoteConsole
        messages={feed.messages}
        govRows={feed.govRows}
        monRows={feed.monRows}
        mapConnected={feed.status.map.connected}
        dualConnected={feed.status.dual.connected}
        fullPage
      />
    </div>
  );
}
