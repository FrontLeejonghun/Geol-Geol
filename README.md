# 껄껄 (Geol-Geol)

> 그때 샀으면 얼마가 됐을까? — 한 / 미 주식 가정 손익을 SNS 공유용 이미지로 만들어주는 자조적 밈 서비스

[Next.js 15 (App Router)](https://nextjs.org) · TypeScript strict · Tailwind v4 · shadcn/ui · next-intl · lightweight-charts · yahoo-finance2

---

## 핵심 기능

- **가정 손익 계산** — 종목, 매수일, (옵션) 가상 매수금액을 입력하면 현재가 기준 P&L 계산
- **밈 카피 자동 선택** — 손익 구간(catastrophe / loss / flat / gain / jackpot)에 맞는 한국어/영어 밈 문구를 무작위로 노출
- **공유 이미지 생성** — Canvas로 1080×1350 (Instagram 4:5) / 1200×630 (OG) PNG 생성. 저장 / 클립보드 복사 / Web Share API
- **체감 단위 비교** — `치킨 1,234마리` `iPhone 5대` 같은 일상 가격으로 환산해서 보여줌
- **인기 종목 칩** — Yahoo trending + KR 큐레이션 fallback. 한 번 클릭으로 자동 입력
- **한글 종목 검색** — Yahoo가 한글 쿼리를 거부하므로 Daum Finance + 인기 미국주 한글 별명 매핑(`테슬라 → TSLA`)으로 보강
- **i18n** — `/ko` `/en` URL 라우팅, Accept-Language 자동 감지 + 쿠키 저장
- **로고 / 한글 회사명 / 한글 산업분류** — Naver public stock API 활용

## 화면 구성

```
/[locale]              검색·날짜·금액 입력 + 인기 종목 칩
/[locale]/result       결과 카드 (헤더·밈·% 배지·차트·P&L·체감 단위·액션바)
/api/search            종목 검색 (Yahoo + Daum + alias)
/api/quote             P&L 계산 (Yahoo)
/api/trending          인기 종목 (Yahoo + KR fallback)
/api/og                OG 이미지 (1200×630, edge runtime)
/api/share-image/instagram  Instagram 이미지 (1080×1350, edge runtime)
```

## 데이터 소스

| 항목 | 소스 |
| --- | --- |
| 시세·과거가·검색(영문) | yahoo-finance2 v3 (`unstable_cache` TTL 1h) |
| 한글 종목 검색 / 한글 회사명 (KR) | Daum Finance public API |
| 한글 회사명 / 한글 산업분류 / 로고 (US) | Naver Stock public API |
| 한글 회사명 / 로고 (KR) | Naver `imgstock` CDN, Daum |
| 인기 미국주 한글 별명 (테슬라 → TSLA 등) | `src/lib/foreign-stock-aliases.ts` |
| 인기 종목 KR fallback (삼성전자 / 하이닉스 / NAVER / 카카오 등) | `src/app/api/trending/route.ts` |

## 시작하기

```bash
pnpm install
pnpm dev
# http://localhost:3000 → /ko 자동 리다이렉트
```

```bash
pnpm build         # 프로덕션 빌드
pnpm start         # 빌드 결과 실행
pnpm test          # vitest (293 tests)
pnpm lint          # oxlint
pnpm analyze       # @next/bundle-analyzer
```

요구 환경: Node.js 20+, pnpm 9+

## 폴더 구조 (요약)

```
src/
├─ app/
│  ├─ [locale]/
│  │  ├─ page.tsx                홈 폼 + 인기 종목 칩
│  │  └─ result/                  결과 페이지 (CSR + 동적 차트)
│  ├─ api/
│  │  ├─ search/                  종목 검색
│  │  ├─ quote/                   P&L 계산
│  │  ├─ trending/                인기 종목
│  │  ├─ og/                      OG 이미지 (edge)
│  │  └─ share-image/instagram/   Instagram 이미지 (edge)
│  ├─ globals.css                 Tailwind + shadcn 토큰
│  └─ layout.tsx                  루트 레이아웃 (Pretendard preload)
├─ components/
│  ├─ ui/                         shadcn primitives
│  ├─ result-visualization-container.tsx  단색 결과 카드
│  ├─ result-actions.tsx          저장 / 복사 / 공유 (3-button)
│  ├─ pnl-summary-panel.tsx       P&L 요약
│  ├─ comparables-panel.tsx       치킨 N마리 비교
│  ├─ stock-autocomplete.tsx      검색 + 드롭다운(로고/이름/티커/현재가)
│  ├─ trending-chips.tsx          인기 종목 칩
│  ├─ price-history-chart.tsx     lightweight-charts wrapper
│  ├─ date-picker.tsx             native date input + presets
│  └─ error-display.tsx           재시도 친화 에러 UI
├─ lib/
│  ├─ yahoo-finance.ts            서버 전용, unstable_cache 래퍼
│  ├─ korean-stock-resolver.ts    Daum/Naver 브리지 (server-only)
│  ├─ foreign-stock-aliases.ts    한글 별명 ↔ US 티커
│  ├─ industry-i18n.ts            영문 산업명 → 한글
│  ├─ meme-copy.ts                밈 카피 풀 (edge-safe)
│  ├─ calculation.ts              P&L 로직
│  ├─ comparables.ts              체감 단위 환산
│  ├─ format.ts                   Intl.NumberFormat 헬퍼
│  ├─ share-image/                Canvas 렌더러 + FontFace
│  └─ og-image/                   @vercel/og 헬퍼
├─ hooks/
│  └─ use-share-image.ts          이미지 생성 / 다운로드 / 복사 / 공유
├─ i18n/                          next-intl 설정
└─ types/                         Stock / OutcomeTier / etc
messages/{ko,en}.json             typed-intl 메시지
```

## 설계 메모

### Edge runtime 분리
`/api/og`, `/api/share-image/instagram`은 Vercel edge에서 동작해야 합니다.
yahoo-finance2 v3는 `@deno/shim-deno` 경유로 `tty` / `child_process`를 가져오는데
edge에선 번들이 안 됩니다. 그래서 밈 카피 풀을 `lib/meme-copy.ts`로 분리해서
edge 라우트는 거기서만 import 하도록 했습니다.

### Yahoo의 한글 거부 문제
`yahooFinance.search('삼성전자')` → HTTP 400 BadRequestError. 시드는 yahoo-finance2 단독을
권장했지만 한글 검색은 구조적으로 불가능해서 Daum Finance public API + 인기 종목 alias 매핑을
보조 리졸버로 추가했습니다. **시세/과거가/계산은 여전히 Yahoo만 사용합니다.**

### 이미지 생성 race 회피
`useShareImage` 훅은 다운로드/복사/공유 함수가 옵셔널 `target?: ShareImageResult` 인자를
받습니다. 호출 측이 방금 생성한 이미지를 직접 넘겨줘서 React state 전파를 기다리지
않도록 했습니다 (첫 클릭 실패 race 회피).

### Layout shift 방지
- 차트 컨테이너에 `minHeight: chartHeight + 8` 으로 자리 예약
- ResultActions / ResultSkeleton이 최종 카드 구조와 1:1 매치되는 placeholder 유지

### 단색 팔레트
결과 카드는 `bg-card / border-border / text-foreground / text-muted-foreground`만 사용.
손익 방향(빨강/초록)은 % 숫자에만 노출됩니다. 그라디언트, tier별 배경/border 컬러는 모두 제거.

### 다크모드 비활성화
Tailwind v4 `dark:` variant를 globals.css에서 `@custom-variant dark (&:where(.never-match-dark));`
로 차단해서 어떤 dark 유틸리티도 매칭되지 않습니다.

## 테스트

```bash
pnpm test
# Test Files  9 passed (9)
#       Tests  293 passed (293)
```

다루는 영역: 포맷터, 손익 tier, 거래일 매핑, 밈 카피 풀, 에러 재시도, 접근성,
i18n 타입, Instagram 이미지 렌더, Web Share API, Clipboard API, blob URL 다운로드.

## 알려진 트레이드오프

- 시드 v1 범위에서 환율(USD↔KRW) 토글은 제외했습니다.
- 다크모드는 시드의 m2 종료조건에 있었지만 구현 품질 이슈로 제거했습니다.
- 한글 검색은 Daum public API에 의존합니다. Daum API 응답 스키마가 바뀌면 영향이 있습니다.

## 라이선스

개인 프로젝트.
