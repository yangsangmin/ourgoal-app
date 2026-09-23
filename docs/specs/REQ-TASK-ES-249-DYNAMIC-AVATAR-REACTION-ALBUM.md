# 요구사항 정의서 (REQ) — 상황별 다이나믹 아바타 리액션 도감 100% 무료 기능 및 아바타 생성횟수(최초 3회) 문구 정상화

> **문서 ID**: REQ-TASK-ES-249-DYNAMIC-AVATAR-REACTION-ALBUM  
> **티켓 연계**: #TASK-ES-249  
> **작성 일시**: 2026-09-24  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- **상민님 지시 원문**:
  > *"결함 해결하고, 443 pr 유료 기능 삭제하면서 다시 작업해. 상황별 아바타 리액션 도감 무료기능으로."*
  > *(참조: "아바타 생성횟수는 최초 3회로 설정했을텐데?")*
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. **UI 문구 불일치 결함**: 신규 유저에게 최초 3회(`maxBaseCrafts: 3`)가 정상 부여되고 있으나, 아바타 제작 버튼 툴팁 및 소진 토스트에 레거시 텍스트인 "최대 10회"가 하드코딩되어 있어 사용자 혼선 발생.
  2. **승인선 위반 잔재**: PR #443에 상민님의 승인 없는 VIP 멤버십, 유료 패스, 생성권 제한 등의 수익화 코드가 임의로 삽입되어 헌법 제5조 제1항 제1호(돈 및 수익화) 위반 및 본질감시자 병합 차단 발생.
  3. **상황별 아바타 체감 부재**: 사용자가 체크인을 1회차, 2회차, 3회차 수행하거나 세부할일·마일스톤을 달성해도 단조로운 고정 아바타만 노출되어 성취 체감이 반감됨.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/표기 결함)**:
    - 아바타 소진 문구의 '10회' 하드코딩으로 인한 신규 가입자 혼선.
    - 상황별 아바타 프리셋(`DYNAMIC_SITUATIONS`) 및 순수 무료 도감 모달 부재.
  - **2층 (구조/프로세스 부재)**:
    - 5대 상황(아침 1회차, 오후 2회차, 야간 3회차, 할일 완료, 마일스톤 돌파)에 맞는 시각 소품 및 말풍선 결합 엔진 미비.
  - **3층 (시스템/유저 체감 괴리)**:
    - 유료 과금 장벽 없이 모든 유저가 자신의 실천에 맞춰 아바타가 반겨주는 '100% 무료 성장 도피처' 경험을 체감해야 함.
- **사용자 상황 및 페르소나**:
  - 아침, 점심, 저녁 실천을 기록하며 마일스톤을 달성할 때마다 내 아바타가 살아 움직이듯 칭찬해주길 원하는 모든 일반 사용자(무료 유저 100%).

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **본질 축 (Essence Axis)**: E1(체크인 루프) & FIX
- **[본질] (Essence)**:
  - 이 기능의 본질은 **"유저의 실제 행동(당일 1~3회차 체크인, 세부할일 완료, 마일스톤 돌파)에 맞춰 아바타가 살아 숨쉬듯 무료로 동적 반응하고, 유료화 장벽 없이 모든 유저가 성취의 기쁨을 소장하는 순수 아바타 리액션 도감과 정직한 3회 쿼터 안내"**이다.
  - 3대 철학 기준:
    1. **무공해성**: 유료 결제 유도나 광고 강요 없이 100% 온전한 무료 도감 제공.
    2. **RPG식 체감**: 실천 및 마일스톤 돌파 시 즉각적인 시각 보상과 말풍선 반응.
    3. **동류 연대**: 타인과의 박탈감 없는 순수 자기만족 꾸미기 도감.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (UI 하드코딩 문구)**: `js/avatar-system.js` 내 소진 안내에 과거 레거시 10회 텍스트 방치.
  2. **원인 2 (임의 유료화 코드 삽입)**: 승인되지 않은 VIP 멤버십 및 생성권 제한 로직의 무단 삽입.
  3. **원인 3 (상황별 프리셋 배선 미흡)**: 유저 행동 트리거와 연동되는 순수 무료 리액션 도감 부재.
- **[중심] (Core Bottleneck & Anchor)**:
  - `js/avatar-system.js` 내 VIP 코드 100% 소거, `DYNAMIC_SITUATIONS` 5대 상황 프리셋 기반 100% 무료 `openDynamicAlbumModal()` 제공, 하드코딩 소진 문구를 `getMaxCrafts(profile)`로 정상화.
- **[핵심] (Critical Safety & Termination)**:
  - 기존 유저 프로필 아바타 100% 무손실 보존.
  - 일체의 결제/VIP/광고 로직 완전 배제 (0건).
  - 헌법 게이트 및 Zero Dead-Click 100% 통과.
- **체감 가설**:
  > *"신규 가입 유저는 최초 3회의 아바타 제작 기회를 정직하게 안내받고, 매일 체크인과 마일스톤을 깰 때마다 5대 상황별 아바타가 무료로 반겨주어 온전한 무공해 성취감을 체감한다."*

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

- **하지 말아야 할 것 (Avoid)**:
  - VIP, 결제, 생성권 추가 결제 유도 등 일체의 수익화 요소를 넣지 않는다.
  - 기존 320종 아바타 세계관과 3회 쿼터 체계를 훼손하지 않는다.
- **해야 할 것 (Adopt)**:
  - `js/avatar-system.js`에서 `getVipPassInfo`, `claimFreeVipPass`, VIP 배너/버튼 100% 삭제.
  - `btnRunCraft.title` 및 소진 `toast`에서 '10회' 하드코딩을 제거하고 실제 계정 한도(`total`, `getMaxCrafts`)로 동적 치환.
  - 5대 상황별 프리셋(`checkin_1`, `checkin_2`, `checkin_3`, `todo_done`, `milestone_break`)을 무료 도감에서 자유롭게 열람하고 '대표 반응으로 착용' 가능하게 배선.
- **스토리지 원장화 3대 명세 (Storage Blueprint)**:
  1. **원격 DB 스키마**: `users.settings.equippedSituationKey` (장착된 상황 키 텍스트 저장, 기본값 `'checkin_1'`)
  2. **스마트 스토리지 분기**: 로컬 `localStorage('ourgoal_dynamic_album')` 및 Supabase 프로필 백업 동시 보존.
  3. **4대 연계 뷰 동시 전파**: 도감에서 대표 반응 착용 시 `renderHome()`, `renderSettingsScreen()` 즉시 동시 호출.

---

## 4. [원칙 ④] 1~3 재검토 · 보완 (Critical Review & Edge Cases)

- **엣지 케이스 점검**:
  - 신규 가입자(3회): 소진 시 "아바타 제작 가능 횟수(3회)를 모두 소진하였습니다. 7일 연속 체크인 시 1회가 자동 충전됩니다."로 정상 노출되는가? -> 확인.
  - 기존 가입자(10회 보존 계정): 소진 시 자신의 한도(10회)에 맞게 정상 노출되는가? -> 확인.
  - 게스트 유저: 로그인하지 않은 상태에서도 상황별 아바타 도감을 열람하고 기본 반응을 체험할 수 있는가? -> 확인.
  - 375px 모바일 뷰포트: 도감 모달의 닫기 버튼 및 착용 버튼이 잘리거나 화면을 벗어나지 않는가? -> 확인.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Implementation Procedure)

1. `js/avatar-system.js` 문구 결함 수정: `btnRunCraft.title` 및 소진 `toast`의 하드코딩 10회 제거.
2. `js/avatar-system.js` VIP 코드 완전 삭제: `getVipPassInfo`, `claimFreeVipPass`, VIP 배너/버튼 소거 및 무료 도감 모달화.
3. `ui.css`: `.dynamic-vip-banner` 등 불필요 스타일 정리 및 무료 도감 375px 반응형 보완.
4. `docs/rules/TICKETS.md`: `#TASK-ES-249` 정식 등재 (G0 위반 해소).
5. `scripts/smoke-test.js`: VIP 단언 삭제 및 3회 안내 문구 정상화 단언 탑재.
6. `reports/TASK-ES-249/claims.json`: `ui.css` 주장 추가 및 5대 지시 항목 무료 기능 기준으로 갱신.
7. 로컬 테스트 전수 실행: `npm test`, Zero Dead-Click, 38대 게이트 검증.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **SPOF 점검**:
  - `claimFreeVipPass`나 `getVipPassInfo`를 호출하던 다른 외부 스크립트가 존재하는가?
    - grep 검사 결과: 해당 함수들은 PR #443에서 자체 생성된 함수이며 외부 호출처 없음. 안전하게 제거 가능.
  - `docs/rules/TICKETS.md` 등록 시 기존 티켓(#TASK-ES-229, #TASK-ES-230) 보존 여부 확인 완료.
  - `ui.css` 내 `ui.css` 변경 주장이 `claims.json`에 누락되어 발생했던 법정 "확인 부족" 사유 사전 차단.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)

- `npm test`: 366개 이상 검사 0 failures 전수 통과.
- `verify-integrity-gate.js`: 38개 헌법 게이트 100% ALL PASS.
- Zero Dead-Click: 840개 전수 무결성 입증.
- 법정 검사: GitHub Court CI에서 `ui.css` 주장 누락 없이 통과.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)

- **예상 블로커**: `smoke-test.js`에 이전 VIP 관련 단언이 남아있을 경우 테스트 실패 발생 가능.
- **대응책**: `smoke-test.js` 내 VIP 단언을 정밀 확인하여 무료 도감 및 문구 정상화 단언으로 교체.
- **재검증 트리거**: `npm test` 실패 시 원칙 ⑤의 수정 코드로 복귀하여 단언문 일치 여부 재검토.
