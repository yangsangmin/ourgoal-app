# 작업 계획서 (PLAN) — 상황별 다이나믹 아바타 리액션 도감 100% 무료 기능 및 아바타 생성횟수(최초 3회) 문구 정상화

> **문서 ID**: PLAN-TASK-ES-249-DYNAMIC-AVATAR-REACTION-ALBUM  
> **티켓 연계**: #TASK-ES-249  
> **작성 일시**: 2026-09-24  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악 (Architecture & Scope)

- **핵심 목표**:
  1. `js/avatar-system.js` 내 소진 툴팁/토스트 문구에서 '10회' 하드코딩을 제거하고 최초 3회 설정과 100% 일치하도록 동적 한도 표기로 정상화.
  2. PR #443 내 VIP 멤버십, 유료 패스, 생성권 추가 로직(`getVipPassInfo`, `claimFreeVipPass` 등) 100% 완전 소거.
  3. 5대 상황별 프리셋 기반 순수 무료 아바타 리액션 도감(`openDynamicAlbumModal`) 완성.
  4. `docs/rules/TICKETS.md`에 #TASK-ES-249 정식 등록 및 `reports/TASK-ES-249/claims.json` 법정 주장 완비.
- **영향받는 파일 전수 목록**:
  - `js/avatar-system.js`: 문구 정상화, VIP 로직 삭제, 순수 무료 도감 모달 정제
  - `ui.css`: VIP 전용 배너 스타일 제거, 무료 도감 375px 모바일 반응형 유지
  - `docs/rules/TICKETS.md`: #TASK-ES-249 티켓 등재
  - `docs/specs/REQ-TASK-ES-249-DYNAMIC-AVATAR-REACTION-ALBUM.md`: 무료화 REQ 정본
  - `docs/specs/PLAN-TASK-ES-249-DYNAMIC-AVATAR-REACTION-ALBUM.md`: 무료화 PLAN 정본
  - `reports/TASK-ES-249/claims.json`: 법정 주장서 보강 (`ui.css` 포함)
  - `scripts/smoke-test.js`: 스모크 테스트 단언 갱신

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **본질 (Essence)**:
  - 유저 실천(체크인 회차, 할일 완료, 마일스톤 돌파)에 즉각 반응하는 100% 순수 무료 아바타 리액션 도감과 정직한 3회 쿼터 안내 제공.
- **원인 (Causes)**:
  - 원인 1: `js/avatar-system.js` 내 소진 안내에 과거 레거시 10회 텍스트 방치.
  - 원인 2: 미승인 VIP 멤버십 및 생성권 유료 로직 무단 삽입.
  - 원인 3: 5대 상황 프리셋 기반 무료 도감 모달의 배선 부재.
- **중심 (Core Wire & Bottleneck)**:
  - `state.profile.settings.equippedSituationKey`: 장착된 상황 키 (`'checkin_1'`, `'checkin_2'`, `'checkin_3'`, `'todo_done'`, `'milestone_break'`)
  - `state.profile.settings.maxBaseCrafts`: 신규 계정 3회, 레거시 계정 10회
  - 종단간 데이터 흐름:
    1. 유저가 설정 탭 프로필 카드의 `[📖 아바타 리액션 도감]` 클릭
    2. `OurgoalAvatar.openDynamicAlbumModal` 호출 -> 5대 상황별 SVG 아바타 프리뷰 및 인사말 말풍선 렌더링 (100% 무료)
    3. 원하는 상황의 `[대표 반응으로 착용]` 버튼 클릭 -> `settings.equippedSituationKey` 저장 및 프로필 저장
    4. `renderHome()`, `renderSettingsScreen()` 동시 전파 -> 홈 화면 아바타 카드에 선택된 상황별 말풍선과 프리셋 반영
    5. 아바타 제작 모달에서 횟수 소진 시 -> "아바타 제작 가능 횟수(3회)를 모두 소진하였습니다. 7일 연속 체크인 시 1회가 자동 충전됩니다."로 정직하게 출력
- **핵심 (Anchor & Safety)**:
  - 기존 유저 아바타/프로필 100% 무손실 보존.
  - VIP/결제/유료 기능 완전 소거(0건) 및 무료 도감 무결성 유지.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

- **파일별 변경 예산**:
  - `js/avatar-system.js`: 약 -45줄 (VIP 코드 소거), +5줄 (문구 정상화)
  - `ui.css`: 약 -12줄 (VIP 배너 제거)
  - `docs/rules/TICKETS.md`: +1줄
  - `reports/TASK-ES-249/claims.json`: +25줄
  - `scripts/smoke-test.js`: +15줄 / -10줄
- **4위 1체 배선 명세**:
  - 마크업: `.dynamic-avatar-album-modal`, `#btnCloseDynamicAlbumModal`, `.btn-equip-dynamic-avatar`
  - 리스너: 모달 닫기 클릭, 대표 반응 착용 클릭 이벤트 위임
  - 비즈니스 로직: `settings.equippedSituationKey` 업데이트 및 영속화
  - 피드백: 12ms 햅틱, 성공 토스트, 4대 뷰 연계 재렌더링

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Review & Safety)

- **비파괴 검증**:
  - 기존 320종 MBTI 아바타 테마, 77종 바디 풀, 5대 랭크 날개 렌더러 100% 보존.
  - 기존 사용자의 저장된 아바타 서랍(`savedAvatars`) 및 대표 아바타 URL 1바이트도 유실 없음.
  - 레거시 계정의 10회 한도와 신규 계정의 3회 한도가 각각의 수치에 맞게 정상 안내됨.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)

1. `js/avatar-system.js` 문구 수정 (Line 5808, 6009)
2. `js/avatar-system.js` VIP 함수 및 UI 제거 (Line 6676 ~ 6828)
3. `ui.css` 불필요 VIP 스타일 제거 (Line 11454, 11486)
4. `docs/rules/TICKETS.md` 티켓 등록
5. `scripts/smoke-test.js` 테스트 케이스 갱신
6. `reports/TASK-ES-249/claims.json` 주장 파일 갱신
7. 로컬 무결성 테스트 실행 및 확인

---

## 6. [원칙 ⑥] 절차 재검증: 법정 주장(claims) 설계 (Claims Verification)

- **법정 청구 항목 (Claims)**:
  - **R1**: 체크인 회차(1·2·3회차), 세부할일 완료, 마일스톤 돌파 등 5대 상황별 다이나믹 프리셋(`DYNAMIC_SITUATIONS`) 정의 확인.
  - **R2**: 상황별 시각 소품 및 말풍선이 결합된 SVG 아바타 생성 엔진(`getDynamicAvatarSvg`) 구현 확인.
  - **R3**: 100% 순수 무료 상황별 아바타 도감 팝업(`openDynamicAlbumModal`) 및 대표 반응 착용 배선 확인.
  - **R4**: 설정탭 프로필 요약 카드에 도감 진입 버튼(`#btnOpenDynamicAlbum`) 배선 및 아바타 제작 횟수(최초 3회) 소진 안내 문구 정상화 확인.
  - **R5**: `ui.css` 스타일 및 38개 헌법 게이트, Zero Dead-Click 전수 통과 확인.
- **바뀐 파일 전수 주장 매핑**:
  - `js/avatar-system.js` -> R1, R2, R3, R4
  - `ui.css` -> R5
  - `docs/rules/TICKETS.md` -> R5

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (Execution Checklist)

- [x] 아바타 소진 문구 10회 하드코딩 제거 및 `getMaxCrafts` 동적 반영
- [x] `getVipPassInfo`, `claimFreeVipPass` 완전 삭제
- [x] 도감 모달 내 VIP 배너, VIP 뱃지, VIP 체험권 버튼 완전 삭제
- [x] `ui.css` VIP 스타일 소거
- [x] `docs/rules/TICKETS.md`에 #TASK-ES-249 등재
- [ ] `scripts/smoke-test.js` 단언 갱신
- [ ] `reports/TASK-ES-249/claims.json` 갱신
- [ ] `npm test` 및 무결성 검증 100% 패스

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획 (Rollback Plan)

- 문제 발생 시 `git checkout aa3b9a1`로 즉시 복구 가능.
- 순수 클라이언트 코드 변경이므로 DB 스키마 롤백 부담 0.
