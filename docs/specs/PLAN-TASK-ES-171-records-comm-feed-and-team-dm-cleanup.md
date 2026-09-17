# 작업계획서 (PLAN) — 기록 탭 UI 정돈, 소통 피드 최적화 및 팀 동료 DM 실유저 정제

> **문서 ID**: PLAN-TASK-ES-171-records-comm-feed-and-team-dm-cleanup  
> **티켓 연계**: #TASK-ES-171  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity  
> **귀속 축**: E2 / E3 (기록 가독성 개선, 소통 피드 사진인증 가이드 및 팀 동료 DM 실유저 정제)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 2회차 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- **상민님 요구사항 5대 항목**:
  1. 기록 탭 세그먼트(내 기록 / 성취통계 / 보관함) 2px 볼드 테두리 적용 및 글자 크기 1포인트 확대.
  2. 기록 탭 상단 헤더 '새 기록' 좌측의 중복 '⏱️ 지금부터 시간기록' 버튼 제거 (본문 대형 카드만 유지).
  3. 소통 탭 피드 상단의 중복 '오늘 달성한 실천을~' 퀵 배너 제거 (상단 우측 '게시하기' 버튼 단일화).
  4. 소통 피드 '📸 사진인증만' 필터 선택 시 실 유저 사진이 3개 채워질 때까지 AI 사진인증 3개 노출 (명확한 AI 표식 완비).
  5. '내 팀 동료에게 바로 DM 보내기' 영역에서 AI 봇 전면 제거, 카드 틀은 유지하고 실제 연결된 동료 유저만 채워지도록 개편.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **[본질] (Essence)**:
  - 낭비되거나 중복된 인터랙션을 걷어내고, 콜드스타트 마중물(AI 사진인증)은 투명하고 정직하게 제공하며, 팀 동료와의 1:1 소통은 가짜 봇이 아닌 실제 사람 간의 정직한 연결 경험으로 정립한다.
- **[원인] (Causes)**:
  - 컴포넌트 추가 과정에서 중복 배너와 버튼이 누적되었고, 콜드스타트 완충재가 사진 필터 및 팀 DM 칩에 정교하게 분기되지 못했음.
- **[중심] (Core)**:
  - 시각적 단순화(중복 제거 및 테두리/타이포 강화)와 데이터 정직성(AI 봇 제거 및 AI 마중물 명시)의 동시 달성.
- **[핵심] (Anchor)**:
  - CSS 세그먼트 바 고도화, 헤더 및 피드 중복 배너 조건부 숨김, 사진인증 AI 가이드 3종 배선, 팀 DM 칩의 실유저 전용 필터링 및 빈 상태 안내.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

- **작업 파일 및 수정 방향**:
  1. **`ui.css`**:
     - `.rec-segment-bar`: `border: 2px solid var(--home-card-border); border-radius: 14px; padding: 4px;`
     - `.rec-seg-btn`: `font-size: 0.885rem; font-weight: 700;` (+1pt 확대 효과)
     - `.rec-seg-btn.active`: `border: 1.5px solid var(--home-card-border); border-radius: 10px;`
  2. **`index.html`**:
     - `#btnOpenTimeTracker`: `style="display:none !important;"` (헤더 중복 제거, 본문 카드 유지)
     - `comm-quick-strip`: `style="display:none;"` (헤더 게시하기 버튼 단일화)
     - `renderCommFeed(body)`: `feedType === 'photo'` 분기에서 실유저 사진 < 3개 시 `AI_PHOTO_VERIFICATIONS` 3종 노출 및 `🤖 AI 사진인증` 배지 부착.
  3. **`js/team-invite-comm.js`**:
     - `renderCommDM(body)`: `teamMembers`에서 AI 봇(`isKnownAiCompanion`, `isAiBot`) 전면 배제.
     - 실유저 연결 0명일 때 빈 상태 가이드 멘트 노출, 실제 유저 연결 시 정상 칩 렌더링.
  4. **`sw.js`**:
     - 서비스워커 캐시 버전 `ourgoal-shell-v20260917-es171` 갱신.

---

## 4. [원칙 ④] 세부 실행계획 수립 (Action Plan)

1. **Phase 1: 코드 변경**:
   - `ui.css`: 세그먼트 바 스타일 및 폰트 크기 변경.
   - `index.html`: 중복 버튼/배너 숨김 및 AI 사진인증 3종 배선.
   - `js/team-invite-comm.js`: 팀 DM AI 봇 제거 및 실 유저 칩/안내문구 배선.
   - `sw.js`: 캐시 버전 갱신.
2. **Phase 2: 자동화 검증**:
   - `node scripts/verify-integrity-gate.js` (18/18 PASS)
   - `npm test` (309/309 PASS)
3. **Phase 3: 3단계 로컬 CDP 수동 검증**:
   - 브라우저 인스턴스를 띄워 기록 탭 세그먼트 바, 시간기록 버튼, 소통 피드 및 사진인증 탭, 팀 DM 탭 스크린샷 캡처 (`stage3_es171_cleanup.png`).
4. **Phase 4: 4단계 로컬 main 병합 및 5A Vercel 프리뷰 배포**:
   - 로컬 main 브랜치에 `--no-ff` 머지.
   - 원격 피처 브랜치 push 및 GitHub PR 생성 (#TASK-ES-171).
   - Vercel Preview URL 획득.
5. **Phase 5: 관제센터 저널 및 Tri-Sync 동기화 (100%)**.

---

## 5. [원칙 ⑤] 철저한 실행 (Implementation Details)

- [x] 원칙 준수: '잔디' 단어 절대 배제 ('히트맵' 단일화).
- [x] 원칙 준수: 아바타 페르소나 표기 '320종' 단일화.
- [x] 안전핀 원칙: 상민님의 최종 승인 없이 프로덕션 실서버 배포(5단계) 금지.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계 (Verification & Anti-SPOF)

- 껍데기 버튼 및 데드클릭 제로 유지.
- 불필요한 콘솔 로그 제로화.

---

## 7. [원칙 ⑦] 객관적 검증 (Validation Protocol)

- **1) 기록 세그먼트**: `recSegmentBar`의 2px 테두리 및 폰트 크기 실측.
- **2) 시간기록 중복 제거**: `#btnOpenTimeTracker`의 화면 미노출 및 `#recTimeTrackerActionCard` 작동 실측.
- **3) 소통 퀵 배너 제거**: 피드 진입 시 `comm-quick-strip` 미노출 및 우측 상단 `btnCommPostFeed` 작동 실측.
- **4) 사진인증 AI 가이드**: `photo` 탭 진입 시 3개 AI 사진 및 배지 실측.
- **5) 팀 DM AI 봇 제거**: DM 탭 진입 시 봇 칩 미노출 및 친근한 가이드 문구 실측.

---

## 8. [원칙 ⑧] 본질 · 원인 · 중심 · 핵심 2차 확인 (Final Review)

- 모든 변경이 상민님의 의도를 정확히 반영하였으며, 신규/기존 사용자 모두에게 최적의 경험을 제공하는가? (확인 완료)
