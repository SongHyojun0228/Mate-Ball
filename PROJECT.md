# 야메(YAME) 프로젝트 기능 명세서

> **야구 메이트** — 야구는 같이 봐야 제맛
> 최종 업데이트: 2026.05.07

---

## 목차

1. [서비스 개요](#1-서비스-개요)
2. [기술 스택](#2-기술-스택)
3. [프로젝트 구조](#3-프로젝트-구조)
4. [라우팅 & 페이지](#4-라우팅--페이지)
5. [인증 시스템](#5-인증-시스템)
6. [경기 일정 & 홈 화면](#6-경기-일정--홈-화면)
7. [경기방 (GameRoom)](#7-경기방-gameroom)
8. [승부예측](#8-승부예측)
9. [직관매칭](#9-직관매칭)
10. [응원토크 (실시간 채팅)](#10-응원토크-실시간-채팅)
11. [1:1 쪽지 (DM)](#11-11-쪽지-dm)
12. [직관 매너 평점](#12-직관-매너-평점)
13. [직관 기록](#13-직관-기록)
14. [치킨 추첨](#14-치킨-추첨)
15. [데이터베이스 스키마](#15-데이터베이스-스키마)
16. [RLS 정책](#16-rls-정책)
17. [트리거 & 자동화](#17-트리거--자동화)
18. [Supabase Storage](#18-supabase-storage)
19. [Realtime 구독](#19-realtime-구독)
20. [스케줄링 (pg_cron)](#20-스케줄링-pg_cron)
21. [디자인 시스템](#21-디자인-시스템)
22. [컴포넌트 목록](#22-컴포넌트-목록)
23. [비즈니스 규칙 요약](#23-비즈니스-규칙-요약)
24. [미구현 기능](#24-미구현-기능)

---

## 1. 서비스 개요

| 항목 | 내용 |
|---|---|
| 서비스명 | 야메 (YAME) |
| 풀네임 | 야구 메이트 |
| 슬로건 | 야구는 같이 봐야 제맛 |
| 타겟 | KBO 프로야구 팬 (10~30대) |
| 핵심 가치 | AI가 대체할 수 없는 사람 간의 교류 |
| 플랫폼 | 웹 서비스 (모바일 반응형 우선) |
| 운영 상태 | 공익 기간(~2027/12/04) 전체 무료 운영 |

---

## 2. 기술 스택

### 프론트엔드
- **React** 19.x (Vite 8)
- **Tailwind CSS v4** — CSS-first 설정 (`@tailwindcss/vite`)
- **Zustand** 5.x — 상태 관리
- **React Router** 7.x — 라우팅
- **Lucide React** — 아이콘
- **Supabase JS** 2.x — 클라이언트 SDK

### 백엔드
- **Supabase** — Auth, PostgreSQL, Realtime, Storage, Edge Functions
- **pg_cron** — 정기 스케줄링
- SQL Triggers & Functions — 자동화

### 배포
- **Vercel** — 프론트엔드
- **Supabase** — 백엔드

---

## 3. 프로젝트 구조

```
src/
├── App.jsx                  # 라우터 정의
├── index.css                # 디자인 시스템 (Tailwind v4 + 커스텀 CSS)
├── main.jsx                 # 앱 진입점
├── components/
│   ├── Layout.jsx           # 앱 쉘 (스코어보드 헤더 + 탭 네비)
│   ├── ProtectedRoute.jsx   # 인증 가드
│   ├── GameCard.jsx         # 홈 화면 경기 카드
│   ├── TeamLogo.jsx         # 팀 로고 + 폴백
│   ├── RaffleBanner.jsx     # 추첨 배너 (홈 화면)
│   ├── PredictionTab.jsx    # 승부예측 탭
│   ├── MatchTab.jsx         # 직관매칭 탭
│   ├── TalkTab.jsx          # 응원토크 탭
│   ├── MatchChat.jsx        # 1:1 쪽지 (전체화면 모달)
│   ├── RatingModal.jsx      # 매너 평점 모달
│   ├── AttendanceHistory.jsx # 직관 기록 리스트
│   ├── AttendanceCard.jsx   # 개별 직관 기록 카드
│   └── PhotoUpload.jsx      # 사진 업로드 위젯
├── pages/
│   ├── Home.jsx             # 홈 (경기 일정)
│   ├── Login.jsx            # 로그인
│   ├── Signup.jsx           # 회원가입
│   ├── TeamSelect.jsx       # 응원팀 선택
│   ├── GameRoom.jsx         # 경기 상세 (3탭)
│   ├── Raffle.jsx           # 치킨 추첨
│   ├── Messages.jsx         # 쪽지함 목록
│   ├── MyPage.jsx           # 마이페이지
│   └── NotFound.jsx         # 404
├── stores/
│   └── authStore.js         # Zustand 인증 상태
└── lib/
    ├── supabase.js          # Supabase 클라이언트 초기화
    └── teamColors.js        # 팀별 브랜드 컬러 매핑

supabase/
├── migration.sql            # DB 스키마 + 시드 + 트리거 + RLS
└── functions/
    └── fetch-kbo-games/     # Edge Function (KBO 데이터 수집)
        └── index.ts
```

---

## 4. 라우팅 & 페이지

| 경로 | 페이지 | 인증 필요 | 탭 네비 표시 | 설명 |
|---|---|---|---|---|
| `/` | Home | X | O | 주간 경기 일정, 날짜별 필터 |
| `/login` | Login | X | X | 이메일/비밀번호 로그인 |
| `/signup` | Signup | X | X | 회원가입 (닉네임+이메일+비밀번호) |
| `/team-select` | TeamSelect | O | X | 응원팀 선택 (10개 팀) |
| `/games/:gameId` | GameRoom | O | X | 경기 상세 + 3개 탭 |
| `/raffle` | Raffle | O | O | 치킨 추첨 현황 |
| `/messages` | Messages | O | O | 매칭 쪽지함 목록 |
| `/mypage` | MyPage | O | O | 프로필 + 기록 |
| `*` | NotFound | X | - | 404 페이지 |

---

## 5. 인증 시스템

### 흐름

```
회원가입 (/signup)
  → 이메일 + 비밀번호 + 닉네임 입력
  → auth.users 생성
  → 트리거: profiles 테이블에 자동 row 생성
  → /team-select로 리다이렉트

로그인 (/login)
  → 이메일 + 비밀번호
  → 세션 생성
  → /로 리다이렉트

앱 초기화 (App.jsx)
  → supabase.auth.getSession() 호출
  → onAuthStateChange 리스너 등록
  → 세션 존재 시 profile fetch (teams 조인 포함)

로그아웃
  → supabase.auth.signOut()
  → Zustand store 초기화
  → /login으로 이동
```

### Zustand authStore

```javascript
// State
user            // Supabase auth user 객체
profile         // profiles 테이블 row (teams 조인 포함)
loading         // 초기 로딩 여부

// Methods
initialize()          // 앱 마운트 시 세션 복원
fetchProfile(userId)  // profile + teams 조인 fetch
signUp(email, password, nickname)
signIn(email, password)
signOut()
updateFavoriteTeam(teamId)  // 응원팀 변경
```

### 보호된 라우트

- `ProtectedRoute` 컴포넌트로 인증 필요 페이지 감싸기
- 미인증 시 `/login`으로 리다이렉트
- 인증 후 응원팀 미선택 시 `/team-select`로 자동 이동

---

## 6. 경기 일정 & 홈 화면

### 기능
- **주간 날짜 스트립**: 좌우 화살표로 주 단위 탐색
- **날짜 선택**: 클릭 시 해당 날짜 경기만 표시
- **게임 카드**: 원정팀 — VS/스코어 — 홈팀 그리드 레이아웃
- **상태 뱃지**: 시간(예정) / LIVE(진행중, 펄스 애니메이션) / 종료 / 취소
- **MY GAME 뱃지**: 내 응원팀이 포함된 경기 표시
- **추첨 배너**: 활성 라운드 있을 때 내 응모권 수 표시

### 날짜 스트립 규칙
- 일요일: 빨간색 텍스트
- 토요일: 초록색 텍스트
- 과거 날짜: 회색 배경
- 선택된 날짜: 빨간 배경 + 점선 아웃라인

### 데이터 흐름
```
Home → supabase.from('games')
       .select('*, home_team:teams!...(*), away_team:teams!...(*)')
       .eq('date', selectedDate)
       .order('time')
```

---

## 7. 경기방 (GameRoom)

### 구조

```
[뒤로가기 버튼]
[히어로 매치 카드]        ← 빨간 탑 바 + 팀 로고 + VS/스코어 + 구장
[다른 팀 경기 안내]       ← 내 팀 아닌 경우에만
[직관 갔어요 버튼]        ← 내 팀 경기 + live/finished 일 때만
[덕아웃 탭 (3개)]        ← 승부예측 / 직관매칭 / 응원토크
[탭 콘텐츠]
```

### 히어로 매치 카드
- `ball-card` + 빨간 상단 바 (3px)
- 원정팀 — VS/스코어보드 — 홈팀 그리드
- LIVE/종료 시: 다크 그린 스코어보드 패널 + 노란 모노 숫자
- 예정 시: 빨간 "VS" + 시간
- 상태 뱃지 + 구장 정보

### 덕아웃 탭
- 다크 배경 (`--color-ink`)에 3개 버튼
- 활성 탭: 빨간 배경 + 흰 텍스트
- 응원토크: 내 팀 경기 아니면 비활성 (disabled)

### 직관 갔어요 버튼
- 표시 조건: `isMyGame && (status === 'live' || status === 'finished')`
- 미기록: `btn-stitch` 스타일 버튼
- 기록 완료: 초록 배경 + 체크 아이콘

---

## 8. 승부예측

### 사용자 흐름

```
경기 예정 (scheduled)
  → 홈팀 승 / 무승부 / 원정팀 승 중 택 1 (btn-ghost 버튼)
  → 한 줄 예측 이유 입력 (선택, 100자)
  → "예측 제출" (btn-stitch)
  → 응모권 +1 토스트 표시

경기 종료 (finished)
  → 자동 판정 (트리거)
  → 적중/아쉽 뱃지 표시
  → 적중 시 응모권 자동 지급
```

### 예측 현황
- 홈 승 / 무승부 / 원정 승 투표 수를 `stat-tile`로 표시
- 팬들의 예측 이유 목록 (닉네임 + 팀 뱃지 + 이유)

### 제약사항
- 경기당 1인 1예측 (`UNIQUE(user_id, game_id)`)
- `game.status === 'scheduled'`일 때만 제출 가능
- 제출 후 수정 불가

### DB
```sql
predictions (id, user_id, game_id, prediction, reason, is_correct, created_at)
-- prediction: 'home' | 'away' | 'draw'
-- is_correct: NULL(대기) | true(적중) | false(아쉽)
```

---

## 9. 직관매칭

### 사용자 흐름

```
[글 작성] (내 팀 경기에서만)
  → 좌석 구역: 1루 / 3루 / 외야 / 미정
  → 선호 성별: 무관 / 동성만
  → 모집 인원: 1:1 / 단체
  → 한 줄 소개 (100자)
  → "직관 가자!" 제출

[신청] (내 팀 경기에서만)
  → "같이 가자!" 클릭
  → 한마디 메시지 입력 (선택, 100자)
  → "신청 보내기" 제출

[수락/거절]
  → 글 작성자가 신청 목록 확인
  → 체크(수락) / X(거절) 버튼
  → 수락 시: 매칭 성공 배너 + "대화하기" 버튼 표시

[1:1 쪽지]
  → 수락된 매칭만 쪽지 가능
  → MatchChat 모달 오픈
```

### 제약사항
- **내 응원팀 경기에서만** 글 작성 + 신청 가능 (`isMyGame` prop)
- 중복 신청 불가 (`UNIQUE(post_id, requester_id)` — 중복 시 "이미 신청했어요!" 알림)
- 작성자 본인은 신청 불가

### 글 목록 표시
- 닉네임 + 매너 평점(별) + 모집 상태 뱃지
- 좌석/성별/인원 chalk pill 뱃지
- 한 줄 소개

### DB
```sql
match_posts (id, user_id, game_id, seat_area, gender_pref, group_size, description, status, created_at)
-- status: 'open' | 'closed' | 'matched'

match_requests (id, post_id, requester_id, status, message, created_at)
-- status: 'pending' | 'accepted' | 'rejected'
```

---

## 10. 응원토크 (실시간 채팅)

### 기능
- 경기방 내 **공개 채팅** (같은 경기 관심 팬끼리)
- 내 팀 경기에서만 접근 가능 (다른 팀 경기 시 탭 비활성)
- **Supabase Realtime** — postgres_changes 이벤트 구독
- 메시지당 200자 제한, 최근 50개 메시지 로드

### 메시지 표시
- 왼쪽 세로 선으로 팀 구분 (홈팀=빨강, 원정팀=초록)
- 내 메시지: 빨간 닉네임
- 팀 이름 chalk pill 뱃지
- 타임스탬프 우측 정렬

### 경기 종료 시
- 입력 폼 대신 "경기가 종료되어 채팅이 마감되었어요" 메시지

### 프로필 캐시
- `profileCacheRef` (Map)로 중복 프로필 조회 방지
- 새 메시지의 유저 프로필 없으면 1회 fetch → 캐시

### DB
```sql
chat_messages (id, game_id, user_id, content, created_at)
-- content: 1~200자
```

---

## 11. 1:1 쪽지 (DM)

### 접근 경로
- 직관매칭 탭 → 매칭 수락 후 "대화하기" 버튼
- 쪽지함 페이지 → 기존 대화 목록에서 선택

### MatchChat 컴포넌트 (전체화면 모달)
- **스코어보드 헤더**: 다크 그린 배경, 상대방 닉네임, Wi-Fi 상태 아이콘
- **메시지**: bubble-me (빨간, 우측) / bubble-them (흰색, 좌측)
- **입력**: field-input + 빨간 전송 버튼

### 기술 구현
- **Supabase Broadcast** 채널: `match_dm:{requestId}`
- **Optimistic UI**: 전송 즉시 화면에 표시 (반투명) → DB 저장 성공 시 확정
- 상대방에게 Broadcast로 즉시 전달 (DB 폴링 없이)
- 스크롤 하단 감지: 새 메시지 시 자동 스크롤 (상단 보는 중이면 유지)

### 메시지 제한
- 500자/메시지
- 100개 히스토리 로드

### 경기 종료 후 평점 배너
- `game.status === 'finished'` && 아직 미평가 시
- "경기가 끝났어요! 매너 평점을 남겨봐요" 배너 표시
- "평점" 버튼 → RatingModal 오픈

### 쪽지함 (Messages 페이지)
- 수락된 매칭 기준 대화 목록 (내가 신청자 or 글작성자)
- 마지막 메시지 미리보기 + 시간
- 경기 정보 표시 (팀명, 날짜)
- 경기 종료된 대화: 평점 남기기 버튼

### DB
```sql
match_messages (id, request_id, sender_id, content, created_at)
-- content: 1~500자
-- request_id FK → match_requests (CASCADE 삭제)
```

---

## 12. 직관 매너 평점

### 조건
- 수락된 매칭(`match_requests.status = 'accepted'`)이 있어야 함
- 해당 경기가 종료(`game.status = 'finished'`)되어야 함
- 1인 1매칭당 1평점 (`UNIQUE(rater_id, match_request_id)`)

### RatingModal
- 1~5 별점 선택 (호버 시 미리보기)
- 별점별 라벨: 아쉬워요 / 그저 그래요 / 괜찮아요 / 좋아요! / 최고의 직관 메이트!
- 한 줄 후기 (선택, 100자)
- 이미 평가한 경우: 기존 평점 표시

### 뱃지 시스템
- 평균 4.5 이상: **MVP** 뱃지 (검정 배경)
- 평균 3.5~4.4: **올스타** 뱃지 (빨간 배경)
- 매칭 글 목록에서 작성자의 평점 별 표시

### 자동 계산
- `on_rating_insert` 트리거 → `profiles.rating_avg` 자동 업데이트
- `AVG(score)::NUMERIC(3,2)` 반올림 계산

### DB
```sql
ratings (id, rater_id, rated_id, match_request_id, score, comment, created_at)
-- score: 1~5
-- comment: max 100자
```

---

## 13. 직관 기록

### 기록 생성 방법

**자동 생성 (매칭)**
- `match_requests.status = 'accepted'`인 매칭의 경기가 종료되면
- 트리거 `auto_create_attendance()`가 양쪽 유저에게 자동 INSERT
- `source = 'match'`, `ON CONFLICT DO NOTHING`

**수동 생성 (직접)**
- GameRoom의 "직관 갔어요!" 버튼 클릭
- MyPage → 직관 기록 탭 → "직관 기록 추가" → 종료된 내 팀 경기 선택
- `source = 'manual'`

### AttendanceHistory (통계 + 리스트)
- **통계 그리드** (stat-tile, 5열): 직관 / 승 / 패 / 무 / 승률%
- **기록 추가 버튼**: 점선 테두리 btn-ghost
- **기록 리스트**: AttendanceCard 목록

### AttendanceCard (개별 기록)
- **접힌 상태**: 날짜, 결과 뱃지(승/패/무), 출처 뱃지(매칭/직접), 팀 로고 + 스코어
- **펼친 상태** (터치/클릭):
  - 사진 업로드/관리 (PhotoUpload)
  - 메모 편집 (200자)
  - 기록 삭제

### 승률 계산
- `profile.favorite_team_id` 기준
- 홈/원정 판별 → 내 팀 스코어 vs 상대 스코어

### PhotoUpload
- `<input type="file" accept="image/*" multiple>`
- 프론트 검증: 5MB, jpeg/png/webp
- 경기당 최대 5장 (DB 트리거로 제한)
- 업로드 경로: `{user_id}/{attendance_id}/{timestamp}.{ext}`
- Supabase Storage `attendance-photos` 버킷
- 삭제: Storage + DB 동시 삭제

### DB
```sql
attendance_records (id, user_id, game_id, source, match_request_id, memo, created_at)
-- source: 'match' | 'manual'
-- UNIQUE(user_id, game_id)

attendance_photos (id, attendance_id, photo_url, storage_path, created_at)
-- attendance_id FK CASCADE
-- max 5 per attendance (트리거)
```

---

## 14. 치킨 추첨

### 개요
- 매주 10명에게 치킨 1마리 (운영자 사비, 공익 기간)
- 무료 유저도 참여 가능 (사행성 이슈 최소화)

### 응모권 획득
1. 경기방에서 승부예측 참여 → 예측당 1장 자동 지급
2. 적중 여부 무관, 참여만으로 지급

### 추첨 UI (Raffle 페이지)
- **빅 티켓 카드**: 다크 그린 스코어보드 헤더 + 퍼포레이션(절취선) 효과 + 응모권 카운트
- **ROUND 번호**, **상품**, **기간**, **추첨 인원**
- **내 응모권**: 큰 모노 숫자
- **응모권 얻는 방법**: 1-2-3 넘버링 리스트
- **지난 당첨자**: 라운드별 당첨자 닉네임 뱃지

### 라운드 관리
- 한 번에 1개 활성 라운드만 가능
- 추첨은 앱 외부에서 수동 진행
- 완료된 라운드: `status = 'completed'`

### 홈 화면 배너 (RaffleBanner)
- 활성 라운드 존재 시 표시
- 오렌지 그라데이션 배경 + 빨간 점선 테두리
- 라운드 정보 + 내 응모권 수

### DB
```sql
raffle_rounds (id, round_number, start_date, end_date, prize, winner_count, status, created_at)
-- status: 'active' | 'completed'

raffle_tickets (id, user_id, round_id, source, prediction_id, created_at)
-- source: 'prediction' | 'bonus'
-- UNIQUE(user_id, prediction_id)

raffle_winners (id, round_id, user_id, created_at)
-- UNIQUE(round_id, user_id)
```

---

## 15. 데이터베이스 스키마

### 테이블 전체 목록 (14개)

| 테이블 | 행 수 (시드) | 설명 |
|---|---|---|
| teams | 10 | KBO 10개 팀 (고정) |
| profiles | - | 유저 프로필 (auth.users 확장) |
| games | 5 (시드) | 경기 일정/결과 |
| predictions | - | 승부예측 투표 |
| match_posts | - | 직관매칭 글 |
| match_requests | - | 매칭 신청 |
| match_messages | - | 1:1 쪽지 |
| ratings | - | 매너 평점 |
| chat_messages | - | 응원토크 메시지 |
| attendance_records | - | 직관 기록 |
| attendance_photos | - | 직관 사진 |
| raffle_rounds | 1 (시드) | 추첨 라운드 |
| raffle_tickets | - | 응모권 |
| raffle_winners | - | 당첨자 |

### 경기 상태 전이

```
scheduled ──→ live ──→ finished
    │                      │
    └──→ cancelled         ├─ predictions 자동 판정
                           ├─ raffle_tickets 자동 발급
                           ├─ attendance_records 자동 생성 (매칭분)
                           └─ 응원토크 채팅 마감
```

---

## 16. RLS 정책

| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| teams | 전체 | X | X | X |
| profiles | 전체 | 본인 | 본인 | X |
| games | 전체 | X | X | X |
| predictions | 전체 | 본인 | 본인 | X |
| match_posts | 전체 | 본인 | 본인 | X |
| match_requests | 본인/글작성자 | 본인 | 글작성자 | X |
| match_messages | 매칭 쌍만 | 매칭 쌍 | X | X |
| ratings | 전체 | 본인(종료 후) | X | X |
| chat_messages | 인증 유저 | 본인 | X | X |
| attendance_records | 전체 | 본인 | 본인 | 본인 |
| attendance_photos | 본인만 | 본인 | X | 본인 |
| raffle_rounds | 전체 | X | X | X |
| raffle_tickets | 본인 | 본인 | X | X |
| raffle_winners | 전체 | X | X | X |
| storage.objects (attendance-photos) | 본인 폴더 | 본인 폴더 | X | 본인 폴더 |

---

## 17. 트리거 & 자동화

| 트리거 | 테이블 | 이벤트 | 동작 |
|---|---|---|---|
| `on_auth_user_created` | auth.users | INSERT | profiles 테이블에 자동 row 생성 |
| `judge_predictions()` | games | UPDATE (status→finished) | 예측 결과 판정 + 응모권 발급 |
| `on_rating_insert` | ratings | INSERT | profiles.rating_avg 재계산 |
| `auto_create_attendance()` | games | UPDATE (status→finished) | 수락된 매칭의 양쪽 유저에게 직관 기록 자동 생성 |
| `check_attendance_photo_limit()` | attendance_photos | BEFORE INSERT | 5장 초과 시 RAISE EXCEPTION |

### judge_predictions 상세 로직
```
경기 종료 시 (status = 'finished'):
1. 해당 경기의 모든 predictions 조회
2. home_score vs away_score → 실제 결과 결정
3. 각 prediction의 is_correct 업데이트
4. 활성 라운드 확인
5. 참여한 모든 유저에게 raffle_ticket 자동 INSERT
6. ON CONFLICT DO NOTHING (중복 방지)
```

---

## 18. Supabase Storage

### attendance-photos 버킷
- **접근 제어**: public 버킷 + RLS 정책
- **업로드 경로**: `{user_id}/{attendance_id}/{timestamp}.{extension}`
- **파일 제한**: 5MB, MIME: image/jpeg, image/png, image/webp
- **사진 수 제한**: 경기당 5장 (DB 트리거)

### Storage RLS 정책
```sql
-- INSERT: 본인 폴더만
(bucket_id = 'attendance-photos') AND ((storage.foldername(name))[1] = auth.uid()::text)

-- SELECT: 본인 폴더만
동일 조건

-- DELETE: 본인 폴더만
동일 조건
```

---

## 19. Realtime 구독

| 대상 | 채널 | 이벤트 | 사용처 |
|---|---|---|---|
| chat_messages | `chat:{gameId}` | postgres_changes INSERT | TalkTab (응원토크) |
| match_messages | `match_dm:{requestId}` | broadcast `message` | MatchChat (1:1 쪽지) |

### 응원토크 Realtime
- `postgres_changes` 이벤트로 새 메시지 감지
- 프로필 캐시로 중복 조회 방지
- 스크롤 위치 감지: 하단 80px 이내면 자동 스크롤

### 1:1 쪽지 Broadcast
- DB 트리거 대신 **Supabase Broadcast** 사용 (더 빠름)
- 전송자: DB INSERT → Broadcast로 상대방에게 전달
- 수신자: Broadcast 이벤트 리스너로 즉시 수신
- 중복 방지: 내가 보낸 건 Broadcast에서 무시

---

## 20. 스케줄링 (pg_cron)

| 작업명 | 스케줄 (UTC) | KST | 동작 |
|---|---|---|---|
| `fetch-kbo-games-hourly` | `0 1-14 * * *` | 10:00~23:00 매시 정각 | KBO 경기 데이터 fetch (±3일) |
| `fetch-kbo-games-frequent` | `*/15 12-13 * * *` | 21:00~22:00 15분 간격 | 경기 종료 시간대 빈번한 폴링 |

### Edge Function: fetch-kbo-games
- koreabaseball.com에서 경기 일정/결과 스크래핑
- Cheerio HTML 파서 사용
- 경기 상태 매핑: `취소` → cancelled, 진행중 → live, 종료 → finished
- Supabase upsert: `(home_team_id, away_team_id, date)` 기준
- 투수 정보 파싱

---

## 21. 디자인 시스템

### 컬러 팔레트 (야구공 테마)

| 변수 | 값 | 용도 |
|---|---|---|
| `--color-ball-white` | #fafaf6 | 카드 배경 |
| `--color-ball-cream` | #f1ece1 | 앱 배경 |
| `--color-stitch-red` | #c8202b | CTA, 강조 (야구공 실밥) |
| `--color-stitch-deep` | #9c1820 | 버튼 그림자 |
| `--color-grass-deep` | #1f4d2c | 헤더 배경 |
| `--color-grass-mid` | #2e6b3d | 성공, 원정팀 |
| `--color-dirt-warm` | #b08862 | 보조 뱃지 |
| `--color-ink` | #14110d | 본문 텍스트 |
| `--color-ink-muted` | #7a7165 | 보조 텍스트 |
| `--color-line` | #d6cdb8 | 구분선 |
| `--color-score-yellow` | #ffd76b | 스코어보드 숫자 |

### 타이포그래피
- 한국어: Pretendard
- 영문/숫자(모노): JetBrains Mono — 스코어보드 숫자 느낌
- `.num` 클래스: 모노스페이스 + tabular-nums

### CSS 컴포넌트 클래스

| 클래스 | 용도 |
|---|---|
| `.ball-card` | 카드 컨테이너 (흰 배경, 둥근 모서리, 그림자) |
| `.ball-card.stitched` | 점선 테두리 카드 |
| `.scoreboard` | 다크 그린 스코어보드 패널 |
| `.scoreboard .value` | 노란 모노 숫자 |
| `.btn-stitch` | 빨간 CTA 버튼 (실밥 스타일 아웃라인) |
| `.btn-ghost` | 흰 테두리 버튼 (선택 시 검정 반전) |
| `.dugout-tabs` | 다크 탭 네비게이션 |
| `.scorecard-tabnav` | 상단 흰 탭 네비게이션 |
| `.scoreboard-header` | 다크 그린 그라데이션 헤더 |
| `.badge` / `.badge-live` 등 | 상태 뱃지 (6종) |
| `.stat-tile` | 통계 숫자 타일 |
| `.bubble-me` / `.bubble-them` | 채팅 말풍선 |
| `.field-input` | 입력 필드 |
| `.field-divider` | 점선 구분선 |
| `.app-bg` | 앱 배경 텍스처 (파울라인 + 스티치 아크) |

---

## 22. 컴포넌트 목록

### 레이아웃

| 컴포넌트 | 파일 | 역할 |
|---|---|---|
| Layout | `components/Layout.jsx` | 스코어보드 헤더 + 탭 네비 + 앱 배경 |
| ProtectedRoute | `components/ProtectedRoute.jsx` | 인증 가드 (미인증 → /login) |

### 홈 화면

| 컴포넌트 | 파일 | 역할 |
|---|---|---|
| GameCard | `components/GameCard.jsx` | 경기 요약 카드 (홈 리스트) |
| TeamLogo | `components/TeamLogo.jsx` | 팀 로고 이미지 + 에러 폴백 (컬러 원) |
| RaffleBanner | `components/RaffleBanner.jsx` | 치킨 추첨 배너 |

### 경기방

| 컴포넌트 | 파일 | 역할 |
|---|---|---|
| PredictionTab | `components/PredictionTab.jsx` | 승부예측 투표 + 현황 + 팬 예측 |
| MatchTab | `components/MatchTab.jsx` | 직관매칭 글 작성/목록/신청/수락 |
| TalkTab | `components/TalkTab.jsx` | 실시간 응원토크 채팅 |

### 메시징 & 평점

| 컴포넌트 | 파일 | 역할 |
|---|---|---|
| MatchChat | `components/MatchChat.jsx` | 1:1 쪽지 전체화면 모달 |
| RatingModal | `components/RatingModal.jsx` | 5점 별점 + 코멘트 모달 |

### 직관 기록

| 컴포넌트 | 파일 | 역할 |
|---|---|---|
| AttendanceHistory | `components/AttendanceHistory.jsx` | 직관 통계 + 리스트 + 추가 모달 |
| AttendanceCard | `components/AttendanceCard.jsx` | 개별 기록 (펼치기/접기) |
| PhotoUpload | `components/PhotoUpload.jsx` | 사진 업로드/삭제 위젯 |

---

## 23. 비즈니스 규칙 요약

| 규칙 | 제한 | 적용 방식 |
|---|---|---|
| 응원팀 변경 | 시즌당 1회 | 프론트 안내 |
| 경기당 예측 | 1인 1회 | DB UNIQUE 제약 |
| 예측 제출 시점 | 경기 시작 전만 | 프론트 검증 (`status === 'scheduled'`) |
| 매칭 글 작성 | 내 팀 경기에서만 | 프론트 `isMyGame` 검증 |
| 매칭 신청 | 내 팀 경기에서만, 중복 불가 | 프론트 + DB UNIQUE |
| 쪽지 접근 | 수락된 매칭만 | RLS |
| 평점 남기기 | 경기 종료 후, 매칭당 1회 | DB UNIQUE + 프론트 검증 |
| 직관 기록 | 경기당 1개 | DB UNIQUE |
| 직관 사진 | 경기당 최대 5장, 5MB/장 | DB 트리거 + 프론트 검증 |
| 응모권 | 예측 참여 시 자동 1장 | DB 트리거 |
| 응원토크 | 내 팀 경기만, 200자/메시지 | 프론트 검증 |
| 1:1 쪽지 | 500자/메시지 | 프론트 검증 |

---

## 24. 미구현 기능

CLAUDE.md 기획 문서에 명시되어 있으나 아직 코드에 구현되지 않은 기능:

| 기능 | 우선순위 | 상태 |
|---|---|---|
| 직관 내기 (Bet) | 3순위 | 미구현 |
| 직관 크루 (Crew) | 3순위 | 미구현 |
| 구독 결제 (토스페이먼츠) | 4순위 | 미구현 (공익 기간) |
| 시즌 누적 통계 | 3순위 | 부분 구현 (MyPage 기본 통계) |
| 예측 적중률 랭킹 | 2순위 | 미구현 |
| 소셜 로그인 (OAuth) | - | 미구현 (이메일만) |

---

*기획: 송효준 | 개발: Claude Code*
