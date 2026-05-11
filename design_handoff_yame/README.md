# Handoff: 야메(YAME) — 야구 메이트 앱 리디자인

## Overview
야메는 KBO 직관러를 위한 동행 매칭 + 승부예측 + 응원 토크 + 치킨 추첨 앱입니다.
이 핸드오프는 기존 Claude Code로 만든 화면들을 **야구장 흙(dirt) + 라인 텍스처 + 화이트/레드 스티치 + 모노스페이스 스코어보드 숫자**라는 일관된 야구 미감으로 리디자인한 결과물입니다.

## About the Design Files
번들 안의 HTML/JSX/CSS는 **디자인 레퍼런스(프로토타입)** 입니다. 그대로 배포하려는 코드가 아니라, 의도된 비주얼·인터랙션을 보여주는 모킹입니다.

작업의 목표는 이 디자인을 **현재 프로젝트의 환경(React Native / Next.js / SwiftUI / 등)** 에 맞춰 재구현하는 것입니다. 기존 코드베이스의 컴포넌트, 디자인 토큰, 라우팅 패턴을 따르세요. 환경이 아직 정해지지 않았다면 React + Vite + TypeScript + CSS Modules(또는 Tailwind)를 권장합니다.

## Fidelity
**High-fidelity (hifi)**. 색상, 타이포, 스페이싱, 인터랙션이 모두 최종 의도값입니다. 픽셀 단위로 맞춰주세요. 단, HTML 프로토타입에서 쓰인 React 코드는 **참조용**이고 실제 구현은 프로젝트 패턴을 따릅니다.

---

## Screens / Views

### 1. 오늘의 경기 (Home)
- **Purpose**: 날짜별 KBO 경기 목록 + 치킨 추첨 배너
- **Layout** (위→아래):
  1. 스코어보드 헤더 (height ~52px, 다크 그라운드 그린 + 빨간 스티치 라인)
  2. 탭 내비게이션 (오늘의 경기 / 추첨 / 쪽지함 / 프로필)
  3. 날짜 스트립 카드 (좌우 화살표, 화/수/목/금/토/일/월, 현재 날짜는 빨간 배경)
  4. 치킨 추첨 배너 (점선 빨간 보더, 응모권 카운트)
  5. 경기 카드 리스트 (vertical gap 10px)
- **Game Card 구조**:
  - 상단: 상태 배지 (LIVE 빨강 펄스 / 예정 베이지 / 취소 회색) + 경기장 이름
  - 가운데: 원정팀 로고/이름/선발투수 — VS 또는 점수보드 — 홈팀 로고/이름/선발투수
  - LIVE 경기는 가운데가 다크 그린 스코어보드 패널로 노란 모노 숫자 점수 표시

### 2. 경기 상세 — 승부예측
- **Layout**:
  1. 상단: ← 오늘의 경기 (back link)
  2. 히어로 매치 카드: 양 팀 로고/이름/홈원정 + VS + 시간 + 예정 배지 + 경기장
  3. (내 응원팀 경기가 아닐 때) "내 응원팀 경기는 아니지만, 승부예측은 할 수 있어요!" 안내 박스
  4. 더그아웃 탭 (검정 배경, 빨강 active): 승부예측 / 직관매칭 / 응원토크
  5. 콘텐츠 패널
- **승부예측 패널**: 3개 옵션 (원정승 / 무승부 / 홈승) + 한 줄 이유 input + 빨간 스티치 [예측 제출] 버튼
- **제출 후**: ⚾ + "예측 완료!" + "응모권 1장이 추가되었어요" + [다시 예측] 버튼

### 3. 경기 상세 — 직관매칭
- 빨간 점선 보더 [+ 직관 동행 구하기] 풀폭 버튼
- 매칭 카드: 닉네임 + 별점(빨강) + 모집중 배지 + 좌석/음주/인원 칩 + 한 줄 메모

### 4. 경기 상세 — 응원토크
- 카드 내부 채팅: 좌측 빨간 세로 라인 + 닉네임(빨강) + 팀 배지 + 시간 + 메시지
- 하단 input + 빨간 send 버튼

### 5. 치킨 추첨
- 헤더: 🎟️ 아이콘 + "치킨 추첨" 타이틀
- 메인 티켓 카드:
  - 상단: 다크 그린 그라운드 패널, "ROUND 01 · 진행중" + 노란 모노 "치킨 1마리" + 기간/추첨인원
  - 가운데: 점선 천공선 + 양 끝 동그란 컷아웃 (티켓 효과)
  - 하단: 흰 바탕에 빨간 거대 모노 숫자 응모권 카운트
- 응모권 얻는 방법: 1/2/3 빨간 동그라미 번호 + 안내 텍스트
- 무료 안내 박스

### 6. 쪽지함
- 타이틀 + 대화 수
- 쪽지 카드 리스트: 닉네임 + 안 읽은 수(빨간 배지) + 시간 + 경기 정보 + 마지막 메시지

### 7. 쪽지 (1:1 채팅)
- 다크 헤더 (← 닉네임 + 경기 정보 + Wi-Fi 아이콘)
- 메시지 영역: 내 메시지(빨강 + 흰 점선 outline, 우측), 상대 메시지(흰 카드, 좌측)
- 하단 input + 빨간 send

### 8. 프로필
- 플레이어 카드 히어로: 다크 그린 동그란 아바타 + 닉네임 + 응원팀 + 별점 + MVP 배지
- SEASON STATS 그리드 (5열): 총예측/적중/적중률/직관/승률 — 모노 숫자
- 치킨 추첨 미니 카드 (응모권/당첨 정보 + 보기 버튼)
- 더그아웃 탭: 예측 기록 / 직관 기록
- 예측 기록 카드: 날짜 + 경기 + 경기장 + 적중/아쉽 배지 + 픽
- 직관 기록: 5열 통계 + [+ 직관 기록 추가] 점선 버튼 + 펼치기 가능한 직관 카드 (사진/메모/삭제)

---

## Interactions & Behavior
- 모든 화면 전환은 즉시 (transition 없음, state-driven)
- LIVE 배지 빨간 점은 1s infinite pulse (opacity 1↔0.3)
- 빨간 스티치 버튼: active 시 transform translateY(2px) + shadow 축소 (0.08s)
- 채팅: Enter로 전송, 빈 메시지 비활성화
- 쪽지: 내가 보낸 후 800ms 후 자동 응답 (프로토타입 한정 — 실제 구현 시 제거)
- 직관 기록 카드: 클릭 시 펼침/접힘
- 예측 옵션 버튼: 선택 시 검정 배경 + 흰 텍스트
- 날짜 스트립: 화살표 클릭으로 주 단위 이동, 일요일 빨강 / 토요일 그린 / 평일 검정
- 응원토크: 내 응원팀 경기일 때만 활성화 (다른 팀 경기는 비활성)

## State Management
- `currentTeam` (string): 응원팀 ID
- `currentScreen` + `screenParam`: 라우팅 (실제 코드베이스에서는 react-router 등 사용)
- `predictions[]`, `visits[]`, `inboxThreads[]`, `gameMessages[gameId]`, `threadMessages[threadId]`: 백엔드 연동
- `drawTickets`: 응모권 수 (승부예측 제출 시 +1)

## Design Tokens

### Colors
```css
--ball-white: #fafaf6;     /* 카드 배경 */
--ball-cream: #f1ece1;     /* 앱 배경 */
--stitch-red: #c8202b;     /* 메인 액센트 */
--stitch-red-deep: #9c1820;/* 버튼 그림자 */
--grass-deep: #1f4d2c;     /* 헤더, 푸터 */
--grass-mid: #2e6b3d;      /* 승리 배지 */
--dirt-warm: #b08862;
--dirt-light: #d4b896;
--ink: #14110d;            /* 본문 텍스트 */
--ink-soft: #3a352d;
--ink-muted: #7a7165;
--line-soft: #e6dfce;
--line: #d6cdb8;
```

### Team Colors (data.jsx 참조)
한화 #ff6b00 / LG #c30452 / 두산 #131230 / SSG #ce0e2d / NC #315288 / 삼성 #074ca1 / KIA #ea0029 / KT #000 / 롯데 #041e42 / 키움 #820024

### Typography
- **본문/UI**: Pretendard (CDN: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css`)
- **숫자만**: JetBrains Mono 700/800 (Google Fonts) — class `.num`, `.score`, `.stat-num`
- 스케일: 헤더 22px·800 / 카드 타이틀 14px·800 / 본문 13px / 캡션 11px·600 / 배지 10–11px·800

### Spacing
- 카드 padding: 14–16px
- 카드 gap: 8–12px
- 페이지 padding: 14px
- border-radius: 카드 14px / 버튼 10px / 배지 4px / 칩 999px

### Shadows
```css
/* 카드 */ 0 1px 0 rgba(0,0,0,0.04), 0 4px 16px -8px rgba(20,17,13,0.12)
/* 빨간 스티치 버튼 */ 0 2px 0 #9c1820, 0 4px 10px -4px rgba(200,32,43,0.5)
/* 스코어보드 */ inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.2)
```

### Background texture (앱 전체)
`styles.css`의 `.app-bg` 참조 — 흙 그라데이션 + 흰 파울라인 2개 (45°/135°) + 옅은 핑크 스티치 아크 2개

## Assets
- 이미지 자산 없음 (모든 비주얼 요소는 CSS/SVG)
- 팀 로고는 모노그램 텍스트 + 컬러 링으로 placeholder 처리 — 실제 구현 시 KBO 공식 로고로 교체
- 아이콘은 인라인 SVG (data.jsx의 `Icon` 객체 참조). 코드베이스에 lucide-react 등이 있으면 그쪽을 사용

## Files
- `yame.html` — 진입점 (Design Canvas + 라이브 프로토타입 둘 다 보여줌)
- `styles.css` — 모든 디자인 토큰 + 컴포넌트 클래스
- `data.jsx` — 팀/경기/예측/직관 더미 데이터 + Icon 컴포넌트 + TeamLogo
- `screens.jsx` — 8개 화면 + 공통 헤더/탭
- `ios-frame.jsx`, `android-frame.jsx`, `design-canvas.jsx` — 프리뷰용 (실제 앱에 불필요)

## Suggested Prompt for Claude Code

```
이 폴더(design_handoff_yame/)의 README.md와 yame.html / styles.css / screens.jsx / data.jsx를 모두 읽어줘.
이건 야메(YAME) 야구 메이트 앱의 hi-fi 디자인 레퍼런스야.

목표: 이 디자인을 우리 프로젝트의 [React Native / Next.js / 기존 스택]에 맞춰
픽셀 단위로 재구현해줘.

1. styles.css의 모든 디자인 토큰을 우리 디자인 시스템 변수로 옮기고
2. screens.jsx의 8개 화면을 우리 라우팅 구조에 맞춰 컴포넌트로 분리
3. Pretendard + JetBrains Mono 폰트 로드
4. 더미 데이터(data.jsx) 자리에는 실제 API 연동 — 우선 Mock으로 대체
5. 인터랙션은 README의 "Interactions & Behavior" 섹션 그대로 따라줘

먼저 디자인 토큰 + 공통 컴포넌트(GameCard, BallCard, ChalkPill, DugoutTabs)부터 만들고
화면은 1번(홈) → 2-4번(경기 상세) → 나머지 순서로 진행해줘.
```
