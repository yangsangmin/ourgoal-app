# 엔지니어링 작업계획서 (PLAN) — 상황별 다이나믹 아바타 생성 및 VIP 수익화 모델 (세부할일·마일스톤·기록회차별 아바타 리액션 도감)

> **문서 ID**: PLAN-TASK-ES-249-DYNAMIC-AVATAR-REACTION-ALBUM  
> **요구사항 연계**: [REQ-TASK-ES-249-DYNAMIC-AVATAR-REACTION-ALBUM](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-249-DYNAMIC-AVATAR-REACTION-ALBUM.md)  
> **티켓 연계**: #TASK-ES-249  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  상민님 지시를 완벽히 구현하여, 당일 체크인 회차(1회차 일상 맞이, 2회차 오후 몰입, 3회차 야간 안식), 세부할일 완료, 마일스톤 돌파 등 5대 상황별 다이나믹 아바타 리액션 프리셋(`DYNAMIC_SITUATIONS`)을 정의하고, 이를 한눈에 모아보고 장착할 수 있는 반응형 도감 모달(`OurgoalAvatar.openDynamicAlbumModal`) 및 고마진 VIP 패스/추가 생성권 비즈니스 모델을 배선한다.
- **영향 받는 파일 목록 전수**:
  - `docs/rules/TICKETS.md`: #TASK-ES-249 티켓 등록 (완료)
  - `docs/specs/REQ-TASK-ES-249-DYNAMIC-AVATAR-REACTION-ALBUM.md`: 정본 요구사항 정의서 (완료)
  - `docs/specs/PLAN-TASK-ES-249-DYNAMIC-AVATAR-REACTION-ALBUM.md`: 본 엔지니어링 작업계획서
  - `js/avatar-system.js`: `DYNAMIC_SITUATIONS` 상수, `getDynamicAvatarSvg()`, `getDynamicAlbum()`, `saveDynamicAlbum()`, `openDynamicAlbumModal()`, `getVipPassInfo()`, `claimFreeVipPass()` 구현
  - `index.html`: 홈 화면 당일 체크인 횟수에 따른 다이나믹 아바타 말풍선 렌더링, 설정 탭 프로필 카드 내 `[📖 아바타 도감]` 버튼 (`#btnOpenDynamicAlbum`) 배선, 사진 안전 가이드 모달 배선
  - `ui.css`: `.dynamic-avatar-album-modal`, `.dynamic-avatar-grid`, `.dynamic-avatar-card`, VIP 골드 배지 및 4대 테마 고대비 스타일 선언
  - `reports/TASK-ES-249/claims.json`: Court CI 법정 검증 청구서
  - `scripts/smoke-test.js`: #TASK-ES-249 기능 검증 단언문 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 기술적 본질은 유저의 행동 트리거(체크인 카운트, 세부할일 완료, 마일스톤 달성)를 수신하여 기존 아바타 원형의 시각적 일관성을 유지하면서 상황별 표정·소품·말풍선이 결합된 SVG를 실시간 생성하고, 이를 영속화된 도감 원장에 기록하며 VIP 생성권 BM과 연동하는 **"상황별 다이나믹 아바타 리액션 및 도감 엔진(E1/E2/BM Axis)"**이다.
- **[원인] (Technical Causes)**:
  1. 기존 아바타 시스템은 단일 정적 프로필 아바타 생성(`composite3DeformedAvatar`)에 국한되어 다양한 맥락별 시각적 보상이 결핍됨.
  2. 사용자의 일일 실천 회차와 마일스톤 돌파를 기념하는 아바타 컬렉션 스토리지 및 UI 모달 부재.
  3. VIP 과금 유저를 위한 차별화된 다이나믹 포즈/추가 생성권 수익화 파이프라인 미비.
- **[중심 배선] (Core Wire & State)**:
  - `DYNAMIC_SITUATIONS`:
    ```javascript
    const DYNAMIC_SITUATIONS = {
      checkin_1: { id: 'checkin_1', title: '일상 맞이', icon: '🌅', greeting: '돌아왔구나! 오늘은 어떤 하루야?', badge: '1회차' },
      checkin_2: { id: 'checkin_2', title: '오후 몰입', icon: '☕', greeting: '열심히 달리는 중! 커피 한 잔의 여유 ☕', badge: '2회차' },
      checkin_3: { id: 'checkin_3', title: '야간 안식', icon: '🌙', greeting: '오늘 하루도 정말 고생 많았어! 🌙', badge: '3회차' },
      todo_done: { id: 'todo_done', title: '할일 완료', icon: '💪', greeting: '해냈다! 하나씩 클리어하는 맛! 💪', badge: '실천왕' },
      milestone_break: { id: 'milestone_break', title: '마일스톤 돌파', icon: '🏆', greeting: '대박! 마일스톤 정복을 축하해! 🏆', badge: '달성' }
    };
    ```
  - `getDynamicAvatarSvg(situationKey, baseAvatar)`:
    - 상황별 모자/소품(트로피, 커피잔, 달빛 별무리, 덤벨, 환영 하트) 및 동적 말풍선 결합.
  - `openDynamicAlbumModal()`:
    - 도감 카드 5종 그리드 표출, 상황별 아바타 장착 기능, 무료 2회 생성권 충전 및 VIP 패스 안내.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - Zero Data Loss: `state.profile.avatar`, `state.profile.dynamicAlbum`, `localStorage` 3중 안전 동기화.
  - Zero Dead-Click: `#btnOpenDynamicAlbum`, `#btnClaimFreeVipPass`, `.btn-equip-dynamic-avatar` 등 모든 인터랙션 요소 100% 핸들러 바인딩.
  - 4대 테마(다크, 블랙, 화이트, 도심) 전수 4.5:1 이상 대비 유지.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `js/avatar-system.js` | 5대 상황 프리셋, SVG 합성, 도감 모달, VIP 패스 엔진 | +180줄 | 0줄 | +180줄 | 핵심 로직 |
| `index.html` | 홈 화면 체크인 회차 아바타 렌더링, 설정 탭 도감 버튼 배선 | +40줄 | -5줄 | +35줄 | UI 마크업 |
| `ui.css` | 도감 모달, 그리드 카드, VIP 골드 뱃지, 테마별 고대비 스타일 | +100줄 | 0줄 | +100줄 | 스타일링 |
| `reports/TASK-ES-249/claims.json` | Court CI 법정 검증 청구서 5종 | +70줄 | 0줄 | +70줄 | 검증 청구서 |
| `scripts/smoke-test.js` | #TASK-ES-249 통합 검증 단언문 추가 | +25줄 | 0줄 | +25줄 | 테스트 |
| `docs/specs/PLAN-TASK-ES-249-DYNAMIC-AVATAR-REACTION-ALBUM.md` | 정본 PLAN | +150줄 | 0줄 | +150줄 | 정본 스펙 |

---

## 4. [원칙 ④] 회귀 방지 및 엣지 케이스 안전 대책

- **체크인 회차 0회 유저**:
  - 기본 프로필 아바타 및 기본 인사말을 렌더링하여 공백 또는 에러 발생을 원천 방지.
- **체크인 3회 초과 유저**:
  - `checkin_3` (야간 안식 포즈)로 자연스럽게 수렴.
- **아바타 커스텀 데이터 미설정 유저**:
  - `OurgoalAvatar.defaultFeatures` 폴백 엔진이 안전하게 기본 아바타를 생성.
- **Zero Dead-Click 보장**:
  - 모달 내 생성되는 모든 버튼에 대해 정적 린터 및 런타임 이벤트 위임 검증 100% 통과.

---

## 5. [원칙 ⑤] 실행 절차 및 4대 뷰 동시 전파

1. `js/avatar-system.js`에 `DYNAMIC_SITUATIONS` 및 아바타 생성/도감 엔진 구현.
2. `index.html` 내 홈 화면 아바타 카드 및 설정 탭 프로필 카드에 배선 연결.
3. `ui.css`에 반응형 도감 모달 및 카드 스타일링 추가.
4. `reports/TASK-ES-249/claims.json` 생성.
5. `scripts/smoke-test.js`에 #TASK-ES-249 검증 로직 추가.
6. `npm test` 실행하여 38개 헌법 게이트, Zero Dead-Click, 365개 이상 테스트 All Pass 확인.
7. 스크린샷 캡처 및 시각적 검증 수행.
8. 커밋, 푸시, PR 생성 및 자동 머지.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **단일 실패점 (SPOF) 점검**:
  - `OurgoalAvatar.openDynamicAlbumModal()` 호출 시 modal DOM이 없으면 동적으로 `#dynamicAvatarAlbumModal`을 생성하여 body에 부착하므로 렌더링 누락 가능성 원천 차단.
- **가정의 타당성 검증**:
  - SVG 문자열 합성 방식으로 외부 이미지 에셋 네트워크 요청 없이 100% 로컬 오프라인에서도 즉시 렌더링됨.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)

- `DYNAMIC_SITUATIONS` 5대 상황 프리셋 정상 등록 및 `getDynamicAvatarSvg()` 동작 확인.
- 도감 모달 오픈 및 아바타 장착 시 홈 아바타 및 프로필 아바타 정상 반응.
- `npm test` 365개 이상 테스트 100% ALL PASS (0 failure).
- 38개 헌법 게이트 100% PASS.
- Zero Dead-Click 린터 100% PASS.

---

## 8. [원칙 ⑧] 본질 승인 티켓 연계 (Ticket Alignment)

- 티켓: #TASK-ES-249
- 노션 DB `3d8598db-9096-80be-a954-ce067f84cf66` ("상민 직접입력 핵심 기능") KF-16 항목 완료 기준 100% 일치.
