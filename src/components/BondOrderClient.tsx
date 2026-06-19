"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
  GOV_QUICK_PHRASES,
  ISSUER_CATEGORIES,
  KTB_BONDS,
  MON_QUICK_PHRASES,
  MSB_BONDS,
} from "@/lib/bond-order-data";
import { copyText } from "@/lib/utils";

export function BondOrderClient() {
  const [categoryId, setCategoryId] = useState(ISSUER_CATEGORIES[0]?.id ?? "card");
  const [issuer, setIssuer] = useState("");
  const [phrase, setPhrase] = useState("");
  const [copied, setCopied] = useState(false);

  const category = useMemo(
    () => ISSUER_CATEGORIES.find((c) => c.id === categoryId) ?? ISSUER_CATEGORIES[0],
    [categoryId]
  );

  const copy = async (text: string) => {
    setPhrase(text);
    if (await copyText(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  return (
    <>
      <PageHeader
        title="Bond Order"
        description="국고·통안 빠른 문구와 발행사 카테고리 브라우저. 상세 호가 생성은 Order Book을 이용하세요."
        actions={
          <Link href="/order-book" className="btn btn-primary">
            Order Book
          </Link>
        }
      />

      <section className="bond-order grid gap-4 lg:grid-cols-2">
        <div className="panel-card">
          <h2 className="text-sm font-semibold mb-3">국고채 (KTB)</h2>
          <div className="bond-order-bond-list">
            {KTB_BONDS.map((b) => (
              <div key={b.code} className="bond-order-bond-row">
                <span>{b.name}</span>
                <code className="text-xs text-[color:var(--card-muted)]">{b.code}</code>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {GOV_QUICK_PHRASES.map((p) => (
              <button key={p.label} type="button" className="btn" onClick={() => void copy(p.text)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-card">
          <h2 className="text-sm font-semibold mb-3">통안채 (MSB)</h2>
          <div className="bond-order-bond-list">
            {MSB_BONDS.map((b) => (
              <div key={b.code} className="bond-order-bond-row">
                <span>{b.name}</span>
                <code className="text-xs text-[color:var(--card-muted)]">{b.code}</code>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {MON_QUICK_PHRASES.map((p) => (
              <button key={p.label} type="button" className="btn" onClick={() => void copy(p.text)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel-card mt-4">
        <h2 className="text-sm font-semibold mb-3">발행사 카테고리</h2>
        <div className="public-issue-tabs mb-3">
          {ISSUER_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={categoryId === c.id ? "active" : undefined}
              onClick={() => {
                setCategoryId(c.id);
                setIssuer("");
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {category.issuers.map((name) => (
            <button
              key={name}
              type="button"
              className={`btn${issuer === name ? " btn-primary" : ""}`}
              onClick={() => setIssuer(name)}
            >
              {name}
            </button>
          ))}
        </div>
        {issuer ? (
          <p className="mt-3 text-sm text-[color:var(--card-muted)]">
            선택: <strong className="text-[color:var(--foreground)]">{issuer}</strong> — Order Book에서 만기와 함께
            검색하세요.
          </p>
        ) : null}
      </section>

      {phrase ? (
        <div className="ob-generated-row flex flex-col sm:flex-row mt-4">
          <p className="ob-generated-text min-w-0 flex-1">{phrase}</p>
          <span className="text-xs text-[color:var(--color-brand)]">{copied ? "복사됨" : ""}</span>
        </div>
      ) : null}
    </>
  );
}