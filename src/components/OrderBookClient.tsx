"use client";

import { useMemo, useState } from "react";
import type { BondInfo } from "@/lib/types";
import { copyText, formatAmount, formatYmdDisplay, generateQuoteText } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";

async function searchIssuer(issuer: string, maturity: string) {
  const res = await fetch(`/searchapi/issuer/${encodeURIComponent(issuer)}/${encodeURIComponent(maturity)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "검색에 실패했습니다.");
  return data.bonds as BondInfo[];
}

async function searchBond(code: string) {
  const res = await fetch(`/searchapi/bond/${encodeURIComponent(code)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "채권 정보를 찾을 수 없습니다.");
  return data as BondInfo;
}

export function OrderBookClient() {
  const [mode, setMode] = useState<"issuer" | "code">("issuer");
  const [issuer, setIssuer] = useState("");
  const [maturity, setMaturity] = useState("");
  const [bondCode, setBondCode] = useState("");
  const [results, setResults] = useState<BondInfo[]>([]);
  const [selected, setSelected] = useState<BondInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState("");
  const [copied, setCopied] = useState(false);
  const [opts, setOpts] = useState({
    custom: "",
    bp: "",
    won: "",
    ytm: "",
    includeCredit: true,
    nameMode: "issuer" as "issuer" | "bondName",
  });

  const runSearch = async () => {
    setError("");
    setGenerated("");
    setSelected(null);
    setLoading(true);
    try {
      if (mode === "issuer") {
        if (!issuer.trim() || !maturity.trim()) {
          throw new Error("발행사명과 만기일을 모두 입력해주세요.");
        }
        const bonds = await searchIssuer(issuer.trim(), maturity.trim());
        setResults(bonds);
        if (bonds.length === 1) setSelected(bonds[0]);
      } else {
        if (!bondCode.trim()) throw new Error("채권 코드를 입력해주세요.");
        const bond = await searchBond(bondCode.trim());
        setResults([bond]);
        setSelected(bond);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const generate = (action: "사자" | "팔자") => {
    if (!selected) {
      setError("채권을 먼저 선택해주세요.");
      return;
    }
    setGenerated(generateQuoteText(selected, action, opts));
    setError("");
  };

  const copyGenerated = async () => {
    if (!generated) return;
    if (await copyText(generated)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  const infoRows = useMemo(() => {
    if (!selected) return [] as Array<[string, string]>;
    return [
      ["발행사", selected.issuer],
      ["채권명", selected.bondName],
      ["KR 코드", selected.krCode],
      ["만기일", formatYmdDisplay(selected.maturityDate)],
      ["발행금액", formatAmount(selected.additionalInfo?.issueAmount)],
      ["채권유형", selected.additionalInfo?.bondType ?? "-"],
    ];
  }, [selected]);

  return (
    <>
      <PageHeader
        title="Order Book"
        description="발행사+만기 또는 채권 코드로 종목을 조회하고 사자/팔자 호가 문구를 생성합니다."
      />

      <div className="panel-card mb-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <button type="button" className={`btn${mode === "issuer" ? " btn-primary" : ""}`} onClick={() => setMode("issuer")}>
            발행사+만기로 찾기
          </button>
          <button type="button" className={`btn${mode === "code" ? " btn-primary" : ""}`} onClick={() => setMode("code")}>
            코드로 찾기
          </button>
        </div>

        <div className="form-grid md:grid-cols-2">
          {mode === "issuer" ? (
            <>
              <div>
                <label htmlFor="issuer">발행사명 또는 별칭</label>
                <input id="issuer" value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="예: SK한화" />
              </div>
              <div>
                <label htmlFor="maturity">만기일 (YYYYMMDD)</label>
                <input id="maturity" value={maturity} onChange={(e) => setMaturity(e.target.value)} placeholder="20260424" />
              </div>
            </>
          ) : (
            <div className="md:col-span-2">
              <label htmlFor="bondCode">채권 코드 (KR 코드)</label>
              <input id="bondCode" value={bondCode} onChange={(e) => setBondCode(e.target.value)} placeholder="KR..." />
            </div>
          )}
        </div>

        <div className="mt-4">
          <button type="button" className="btn btn-primary" onClick={runSearch} disabled={loading}>
            {loading ? "조회 중..." : "검색"}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      </div>

      {results.length > 0 ? (
        <div className="panel-card mb-4">
          <h2 className="text-sm font-semibold mb-3">검색 결과</h2>
          <div className="space-y-2">
            {results.map((bond) => (
              <button
                key={bond.krCode}
                type="button"
                className={`btn w-full text-left${selected?.krCode === bond.krCode ? " btn-primary" : ""}`}
                onClick={() => setSelected(bond)}
              >
                {bond.bondName} · {bond.issuer} · {bond.krCode}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {selected ? (
        <div className="panel-card mb-4">
          <h2 className="text-sm font-semibold mb-3">선택된 채권 정보</h2>
          <div className="grid gap-2 md:grid-cols-2 text-sm">
            {infoRows.map(([k, v]) => (
              <div key={k}>
                <span className="text-[color:var(--card-muted)]">{k}: </span>
                {v}
              </div>
            ))}
          </div>

          <div className="form-grid md:grid-cols-4 mt-4">
            <div>
              <label>추가 텍스트</label>
              <input value={opts.custom} onChange={(e) => setOpts({ ...opts, custom: e.target.value })} />
            </div>
            <div>
              <label>BP</label>
              <input value={opts.bp} onChange={(e) => setOpts({ ...opts, bp: e.target.value })} />
            </div>
            <div>
              <label>원</label>
              <input value={opts.won} onChange={(e) => setOpts({ ...opts, won: e.target.value })} />
            </div>
            <div>
              <label>YTM %</label>
              <input value={opts.ytm} onChange={(e) => setOpts({ ...opts, ytm: e.target.value })} />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            <button type="button" className="ob-trade-buy px-6 py-2 text-sm" onClick={() => generate("사자")}>
              사자
            </button>
            <button type="button" className="ob-trade-sell px-6 py-2 text-sm" onClick={() => generate("팔자")}>
              팔자
            </button>
          </div>

          {generated ? (
            <div className="ob-generated-row flex flex-col sm:flex-row">
              <p className="ob-generated-text min-w-0 flex-1">{generated}</p>
              <button type="button" className="btn shrink-0" onClick={copyGenerated}>
                {copied ? "복사됨" : "복사"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
