"use client";

import { PageHeader } from "@/components/PageHeader";

export function IntroductionClient() {
  return (
    <>
      <PageHeader
        title="FORESTBOND 소개"
        description="장외채권 시장 정보를 한곳에서 모아 보는 FORESTBOND 클론 터미널입니다."
      />
      <div className="panel-card intro-content">
        <p>
          <strong>FORESTBOND</strong>는 국고채·통안채부터 은행채, 공사채, 회사채까지 장외채권 시장의 호가·체결·발행
          정보를 실시간에 가깝게 제공하는 채권 전문 정보 서비스입니다.
        </p>
        <h2>주요 기능</h2>
        <ul>
          <li>
            <strong>Terminal / Map</strong> — 브로커·딜러 메신저 피드를 카테고리별로 모니터링합니다.
          </li>
          <li>
            <strong>Compass / Scope</strong> — 국고·통안 및 크레딧 채권의 호가·체결 흐름을 추적합니다.
          </li>
          <li>
            <strong>Order Book / Bond Order</strong> — 종목 검색 후 매수·매도 호가 문구를 빠르게 생성합니다.
          </li>
          <li>
            <strong>발행 캘린더</strong> — 은행채·공사채·회사채 등 예정·확정 발행 일정을 확인합니다.
          </li>
          <li>
            <strong>Heatmap</strong> — 만기·등급별 거래량 히트맵으로 시장 온도를 파악합니다.
          </li>
        </ul>
        <h2>이 클론 프로젝트에 대하여</h2>
        <p>
          본 저장소는 학습·UI 복제 목적의 비공식 클론입니다. 데이터는{" "}
          <a href="https://forestbond.co.kr" target="_blank" rel="noreferrer">
            forestbond.co.kr
          </a>
          API 및 WebSocket을 프록시하여 사용합니다. 투자 판단은 반드시 공식 채널과 증권사·브로커 정보를
          확인하시기 바랍니다.
        </p>
      </div>
    </>
  );
}