# 엔지니어링 작업계획서 (PLAN) — 포커스 성소 실시간 러닝메이트 레이더 실기능 100% 복구 및 헌법 개정안 준수

> **문서 ID**: PLAN-TASK-SANCTUARY-COMM-RADAR-REAL-INTEGRITY  
> **요구사항 연계**: [REQ-TASK-SANCTUARY-COMM-RADAR-REAL-INTEGRITY](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-SANCTUARY-COMM-RADAR-REAL-INTEGRITY.md)  
> **티켓 연계**: #TASK-SANCTUARY-COMM-RADAR-REAL-INTEGRITY  
> **작성 일시**: 2026-09-18  
> **작성자**: Antigravity AI  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) v2026.09.18 준수 (헌법 제2조 2~6항 및 제9조 제3항 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  - 포커스 성소(Focus Sanctuary V4) 소통 탭 상단의 '실시간 러닝메이트 레이더'에서 하드코딩된 위조 숫자(28명) 및 가짜 봇 배열을 완전 제거하고, 실제 동반자(`state.profile.companions`)와 팀원(`getTeamMembersPool()`)을 SSOT로 직결.
  - 레이더 아이템 클릭 시 `OurgoalTeamInviteComm.openUserProfileModal` 및 1:1 DM(`renderCommDM`)을 4위 1체로 호출하도록 배선하고, 새로고침 버튼에 실제 DB 동기화 파이프라인 탑재.
  - 최신 헌법(v2026.09.18) 제2조 제6항(시각 IA 명세), 제3조 제5항(CSS 은폐 금지), 제7조 제8항(시각 자가감사)을 물리적으로 완벽 준수.
- **영향 받는 파일 목록 전수**:
  - `js/sanctuary-v3-engine.js`: 레이더 렌더링 로직 개편, 실제 데이터 결속, `openPeerInteraction`, `refreshRadar`, `gotoCompanions` 구현.
  - `ui.css`: 레이더 엠프티 스테이트 스타일, 로딩 스피너 애니메이션, 모바일(375px) 텍스트 짤림 방지 및 44x44px 터치 타겟 보강.
  - `sw.js`: PWA 캐시 무효화(`CACHE_NAME` 버전 갱신 - 헌법 제14조 3항).
  - `docs/rules/TICKETS.md`: 승인 티켓 등록.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

- **[본질] (Engineering Essence)**:
  - 성소 레이더 컴포넌트를 기존의 검증된 소통·DM 엔진(`OurgoalTeamInviteComm`)과 1:1 결속시켜 데드 클릭과 위조 숫자가 없는 단일 진실 인터페이스로 통합.
- **[원인] (Technical Causes)**:
  - 성소 V4 초기 구현 시 디자인 마크업만 올리고 실제 핸들러 함수(`openPeerDm`)를 엔진에 등록하지 않아 데드 클릭 발생.
  - 실제 DB/로컬 스토리지 연동 없이 하드코딩 배열(`defaultPeers`)과 임의 숫자(`28명`)를 임시 바인딩하여 헌법 위반 발생.
- **[중심] (Core Bottleneck)**:
  - `state.profile.companions`: 로컬스토리지 및 Supabase DB에 영구 영속화된 실제 동반자 목록.
  - `window.OurgoalTeamInviteComm.getTeamMembersPool()`: 사용자가 속한 팀의 실제 동료 목록.
  - `window.OurgoalTeamInviteComm.openUserProfileModal(peer)`: 프로필/상세 조회 모달.
  - `state.commSubTab = 'dm'`, `state.dmActiveId = peerId`, `renderCommScreen()`: 1:1 실시간 대화방 직통 라우팅.
- **[핵심] (Critical Anchor)**:
  - 콜드스타트 투명 안내: 결합된 실사용자가 0명일 때 가짜 봇을 만들지 않고 `[+ 동반자 찾기]` 버튼을 노출하여 안전하게 동반자 서브탭으로 라우팅.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[레이더 아바타 클릭] -> [피어 객체 식별] -> [OurgoalTeamInviteComm.openUserProfileModal(peer)] -> [프로필 모달 내 DM/응원 클릭] -> [1:1 실시간 DM방 전환]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

### 1) 파일별 변경 예산 (Diff Budget)
- `js/sanctuary-v3-engine.js`: 약 +70줄, -50줄 (더미 배열 제거 및 실데이터 집계, 핸들러 구현)
- `ui.css`: 약 +30줄 (엠프티 카드, 스피너, 터치 타겟 보정)
- `sw.js`: 약 +2줄, -2줄 (CACHE_NAME 갱신)
- `docs/rules/TICKETS.md`: +1줄

### 2) 4위 1체 배선 명세
1. **마크업**: `<div class="s-radar-item" data-peerid="..." role="button" tabindex="0">` + 시맨틱 배지 + 접근성 라벨.
2. **리스너**: 인라인 `onclick` 제거 또는 안전한 전역 위임 래퍼 연결.
3. **비즈니스 로직**: 실제 피어 ID 매핑, `openUserProfileModal` 또는 `state.commSubTab = 'dm'` 직통 전환.
4. **피드백**: 스피너 회전, 모달 오픈, 토스트 팩트 알림.

### 3) 시각적 IA 및 시맨틱 통합 배선도 (헌법 제2조 제6항)
- **1호 (상하 위계 및 서브뷰 공존 설계)**:
  - 상단: `#sanctuaryCommView` -> `.s-peer-radar-card` (실시간 러닝메이트 퀵 액세스 레이더).
  - 중간: `.screen-head` -> 소통 헤더 및 `#btnCommPostFeed` (게시하기).
  - 하단: `#commBody` -> `.comm-subtabs` (피드/팀/동반자/DM/마니또/공유) + `#commSubBody`.
- **2호 (기존 기능 슬롯 1:1 이식 매핑표)**:
  | 레이더 UI 슬롯 | 연결되는 기존 코어 함수 | 대상 DOM / 상태 |
  | :--- | :--- | :--- |
  | 레이더 아이템 클릭 | `OurgoalTeamInviteComm.openUserProfileModal(peer)` | `#modalSheet` 프로필 모달 팝업 |
  | 새로고침 버튼 클릭 | `OurgoalTeamInviteComm.syncCompanionsFromDb()` | 레이더 재렌더링 및 동기화 토스트 |
  | 엠프티 CTA 클릭 | `state.commSubTab = 'companion'; renderCommScreen()` | `#commSubBody` 동반자 탭으로 이동 |
- **3호 (모바일 반응형 뷰포트 여백 예산 - 375px / 430px)**:
  - 아바타 링: 44×44px 최소 터치 영역 엄수.
  - 텍스트 말줄임: `text-overflow: ellipsis; white-space: nowrap; overflow: hidden;`으로 375px 폭에서도 절대 줄바꿈이나 영역 이탈 없음.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증

- **비-성소 테마 호환성**:
  - 성소 테마가 아닐 때는 `#sanctuaryCommView`가 `display: none`으로 안전 격리되며 기존 소통 화면이 100% 원형대로 동작함.
- **유저 데이터 100% 무손실 보존**:
  - `state.profile.companions`에 대해 읽기(Read)만 수행하거나 정식 추가 함수만 사용하므로 기존 동반자 목록이 절대 초기화되거나 유실되지 않음.
- **위헌적 CSS 은폐 0건**:
  - 하단 `#commBody`나 `.screen-head`를 가리거나 숨기지 않고 상하로 매끄럽게 배치됨.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)

1. **Step 1 (데이터 집계 및 렌더러 수술)**:
   - `js/sanctuary-v3-engine.js`의 `renderSanctuaryComm` 함수에서 `defaultPeers` 및 '28명' 하드코딩 제거.
   - 실제 동반자 및 팀원 풀 결합 로직 작성.
   - 0명일 때 친절한 엠프티 카드 렌더링.
2. **Step 2 (핸들러 4위 1체 바인딩)**:
   - `OurgoalSanctuaryV3.openPeerInteraction(peerId)`: 피어 프로필 모달 오픈 또는 DM 전환.
   - `OurgoalSanctuaryV3.refreshRadar(btn)`: 실제 동기화 및 재렌더링.
   - `OurgoalSanctuaryV3.gotoCompanions()`: 동반자 탭 이동.
3. **Step 3 (UI 스타일 및 반응형 다듬기)**:
   - `ui.css`에 엠프티 카드, 스피너 및 44x44px 터치 타겟 클래스 추가.
4. **Step 4 (PWA 캐시 무효화)**:
   - `sw.js` `CACHE_NAME` 최신 버전으로 갱신.
5. **Step 5 (6대 무결성 검증)**:
   - `scripts/verify-integrity-gate.js` (22/22 PASS) 및 `npm test` (321+ PASS).
   - Chrome CDP 모바일 실측 캡처 및 5대 시각 자가감사 표 작성.

---

## 6. [원칙 ⑥] 절차 재검증: 6대 무결성 검증 시나리오 설계

- **시나리오 A (Zero Dead-Click)**:
  - 레이더 내 아바타, 새로고침, 엠프티 CTA 클릭 시 에러 0건 및 지정 동작 실행.
- **시나리오 B (Zero Data Loss)**:
  - 10종 가상 페르소나 딥이퀄 검증 100% 통과.
- **시나리오 C (Zero UX Regression)**:
  - 기존 소통 탭(피드/팀/동반자/DM/마니또/공유)의 모든 서브탭 정상 동작 확인.
- **시나리오 D (Full State Propagation)**:
  - 동반자 추가 시 레이더 카운트 및 아바타 덱 실시간 반영.
- **시나리오 E (자동화 게이트 통과)**:
  - 무결성 게이트 및 스모크 테스트 100% ALL PASS.
- **시나리오 F (Visual Self-Audit)**:
  - 375x812 및 430x932에서 5대 시각 감사(글자짤림, 대칭성, 뷰공존, 기능가시성, 터치타겟) 전수 PASS.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)

- [ ] Step 1: `js/sanctuary-v3-engine.js` 실제 러닝메이트 데이터 및 핸들러 100% 직결
- [ ] Step 2: `ui.css` 엠프티 카드 및 터치 타겟·스피너 스타일 보강
- [ ] Step 3: `sw.js` PWA 캐시 버전 갱신
- [ ] Step 4: `node scripts/verify-integrity-gate.js` 22/22 ALL PASS 검증
- [ ] Step 5: `npm test` 스모크 테스트 전수 통과 확인
- [ ] Step 6: Chrome CDP 375px/430px 모바일 실측 캡처 및 5대 시각 자가감사 표 작성
- [ ] Step 7: [4단계: 로컬 메인 병합 상태 및 5A 프리뷰 배포] 완결 및 4-Block 팩트 보고 후 상민님 승인 대기

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획

- **잠재적 엔지니어링 블로커**:
  - `OurgoalTeamInviteComm` 모듈과의 로딩 순서 차이로 인한 초기 빈 화면.
    -> *방어책*: 모듈 미로드 시에도 `state.profile.companions`를 직접 조회하도록 이중 방어망 배선.
- **롤백 계획 (Rollback Strategy)**:
  - 피처 브랜치 격리 작업 및 문제 발생 시 `git checkout main` 1초 롤백.
- **재검증 트리거**:
  - 레이더 클릭 시 반응이 없는 경우: [원칙 ⑥]으로 되돌아가 `window.OurgoalSanctuaryV3.openPeerInteraction` 바인딩 전수 재검토.
