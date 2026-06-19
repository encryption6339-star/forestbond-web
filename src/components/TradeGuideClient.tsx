"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";

type Section = { id: string; title: string; body: string[] };

const SECTIONS: Section[] = [
  {
    id: "structure",
    title: "장외채권 시장 거래 구조",
    body: [
      "장외채권(OTC) 시장은 거래소 중앙집중 호가와 달리, 브로커·딜러·기관 간 양자 협상으로 가격이 형성됩니다.",
      "국고채·통안채는 유동성이 높아 Compass/Scope 화면에서 실시간 호가가 빠르게 갱신되며, 크레딧 채권은 종목·등급별로 유동성 편차가 큽니다.",
      "호가 문구는 만기, 발행사, KR코드, YTM/BP 조건, 매수·매도 의사를 짧은 텍스트로 표현하는 것이 관례입니다.",
    ],
  },
  {
    id: "broker",
    title: "브로커(Broker) 역할",
    body: [
      "브로커는 매수·매도 의사가 있는 기관을 연결하고 호가를 중개합니다. 한국자금중개, 서울외국환중개, KIDB자금중개 등이 대표적입니다.",
      "브로커 채널의 메시지는 Map/Terminal 피드에 실시간으로 노출되며, 동일 종목에 대한 복수 호가를 비교할 수 있습니다.",
      "브로커 수수료는 통상 bp 단위로 협의되며, 거래 규모·관계·종목 유동성에 따라 달라집니다.",
    ],
  },
  {
    id: "dealer",
    title: "딜러(Dealer) 역할",
    body: [
      "딜러는 자기 재고를 바탕으로 양방향 호가를 제시하거나, 고객 주문을 받아 시장에 배분합니다.",
      "국고·통안은 딜러 간 경쟁 호가가 활발하고, 크레딧은 발행사·만기·등급별로 담당 딜러가 분화되는 경우가 많습니다.",
      "딜러 호가는 민평(민간평가) 대비 BP/원 단위 조정 표현이 자주 사용됩니다.",
    ],
  },
  {
    id: "fee",
    title: "수수료",
    body: [
      "장외채권 거래 수수료는 기관 간 합의·브로커 약정에 따르며, 표준화된 거래소 수수료표와 다릅니다.",
      "국고채는 거래량 대비 수수료율이 낮은 편이나, 회사채·CP 등은 종목별 스프레ad와 함께 협의됩니다.",
      "Order Book 도구로 생성한 호가 문구에 BP/원 조건을 명시하면 협상 비용을 줄이는 데 도움이 됩니다.",
    ],
  },
  {
    id: "ytm",
    title: "YTM 특수성",
    body: [
      "장외 호가에서 YTM(만기수익률)은 세전·세후, 단순/복리, 잔존만기 계산 기준이 협의마다 다를 수 있습니다.",
      "국고·통안은 민평 YTM을 기준으로 ±BP/원 조정하는 표현이 일반적입니다.",
      "크레딧 채권은 신용등급·옵션(콜·풋)·잔존기간에 따라 동일 YTM 숫자라도 실제 경제적 수익이 달라질 수 있어 KR코드 확인이 중요합니다.",
    ],
  },
];

export function TradeGuideClient() {
  const [openId, setOpenId] = useState<string>(SECTIONS[0]?.id ?? "");

  return (
    <>
      <PageHeader title="장외채권 거래 가이드" description="시장 구조, 참여자, 수수료, YTM 표현을 정리했습니다." />
      <div className="guide-accordion">
        {SECTIONS.map((section) => {
          const open = openId === section.id;
          return (
            <div key={section.id} className="guide-accordion-item">
              <button
                type="button"
                className="guide-accordion-trigger"
                aria-expanded={open}
                onClick={() => setOpenId(open ? "" : section.id)}
              >
                <span>{section.title}</span>
                <ChevronDown size={18} className={cn("guide-accordion-chevron", open && "open")} />
              </button>
              {open ? (
                <div className="guide-accordion-panel">
                  {section.body.map((p) => (
                    <p key={p.slice(0, 24)}>{p}</p>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}