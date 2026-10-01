# 엔지니어링 작업계획서 (PLAN) — 가상 페르소나·목업 모임 전면 삭제 및 팔로워만 공개 옵션 제거

> **문서 ID**: PLAN-TASK-ES-332-PURGE-MOCK-PERSONAS-FOLLOWERS  
> **요구사항 연계**: [REQ-TASK-ES-332-PURGE-MOCK-PERSONAS-FOLLOWERS](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-332-PURGE-MOCK-PERSONAS-FOLLOWERS.md)  
> **티켓 연계**: #TASK-ES-332  
> **작성 일시**: 2026-10-01  
> **작성자**: Antigravity Pair Programmer (Gemini 3.8 Flash)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2항 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - `SIM_PERSONAS` 40인의 가짜 프로필 데이터 및 가짜 응원 생성기 영구 제거.
  - 목표 생성 모달 내 미작동 `followers` 옵션 제거 및 기존 데이터의 `team` 무손실 마이그레이션.
  - Zero Data Loss, Zero Dead-Click, 헌법 게이트 100% 무결성 유지.
- **영향 받는 파일 목록 전수**:
  - `index.html`: `SIM_PERSONAS` 빈 배열화, `defaultSettings().virtualCheerEnabled: false`, 가짜 응원 함수 무력화, 피드 내 `singleAiGuide` 주입 제거, `mGoalVis` 옵션 및 `VISIBILITY_LABELS` 정돈.
  - `js/viral-sharing.js`: `global.SIM_PERSONAS` 폴백 정리.
  - `reports/TASK-ES-332/claims.json`: 법정 주장서 작성.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: **E3 (동류 소통)** 및 **INFRA** — 위조 데이터 없는 순수 팩트 기반 데이터 파이프라인 확립.
- **[원인] (Technical Causes)**:
  - `index.html` 32884행의 `SIM_PERSONAS`가 인메모리 상수로 선언되어 있고, 15497행 및 17379행의 함수들이 이를 조회하여 허위 피드백을 생성하던 구조적 결함.
  - `index.html` 19203행의 `<option value="followers">`가 실제 기능 배선 없이 잔존하던 인터페이스 껍데기 결함.
- **[중심 배선] (Core Wire & State)**:
  - `state.profile.settings.virtualCheerEnabled`: 기본값 `false`.
  - `FEED_POSTS_CACHE`: 순수 실제 게시글 및 사용자 본인 글만 조합(`myItems.concat(posts)`).
  - `state.profile.goals`: 로드 시 `g.visibility === 'followers'`인 항목을 `'team'`으로 자동 정규화.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - `SIM_PERSONAS = []` 빈 배열 유지로 외부 스크립트에서의 참조 에러(TypeError) 방어.
  - 기존 목표의 visibility 속성 무손실 보존(`followers` ➔ `team`).
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[체크인 완료/글 작성] -> [진짜 DB 저장] -> [가짜 봇 응원 스케줄링 차단] -> [실제 유저 피드에만 정직하게 노출]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | SIM_PERSONAS 비우기, 가짜응원 차단, followers 옵션 제거 | +15줄 | -55줄 | -40줄 | 슬림화 및 정제 |
| `js/viral-sharing.js` | SIM_PERSONAS 폴백 제거 | +2줄 | -4줄 | -2줄 | 정돈 |
| `reports/TASK-ES-332/claims.json` | 법정 심사 청구서 신설 | +30줄 | 0줄 | +30줄 | 심사 문서 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `#mGoalVis` 내 `<option value="public">`, `<option value="private">` 2종 표준 명시.
2. **이벤트 리스너 (Listener)**: 공개범위 변경 시 `change` 리스너에서 유효한 값만 처리.
3. **비즈니스 로직 (Logic)**: `saveProfile()`, `ensureFeedPostsLoaded()`, 목표 로드 시 `followers` ➔ `team` 자동 치환.
4. **피드백 & 예외처리 (Feedback)**: 토스트 알림 정상 작동, 가짜 응원 토스트 배제.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 정돈했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타, 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] `smoke-test.js`의 기존 템플릿 테스트(`isMockGroup`, `g-workshop`)를 깨뜨리지 않는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (`index.html`)**: `defaultSettings().virtualCheerEnabled`를 `false`로 수정.
2. **Step 2 (`index.html`)**: `triggerFirstCheerResponse` 및 `addSimulatedCheerAndReplyToPost` 가짜 응원 스케줄링 비활성화.
3. **Step 3 (`index.html`)**: `SIM_PERSONAS` 배열 내부 40명 객체를 제거하여 `var SIM_PERSONAS = [];`로 비움.
4. **Step 4 (`index.html`)**: `renderCommFeed`에서 `singleAiGuide` 결합 분기 제거.
5. **Step 5 (`index.html`)**: `mGoalVis`의 `<option value="followers">` 제거, `VISIBILITY_LABELS` 정돈, 목표 로드 시 마이그레이션 삽입.
6. **Step 6 (`js/viral-sharing.js`)**: `global.SIM_PERSONAS` 참조 제거.
7. **Step 7 (검증 & 법정 문서)**: `reports/TASK-ES-332/claims.json` 생성 및 `npm test` 통과 확인.

---

## 6. [원칙 ⑥] 절차 재검증: 법정 주장(claims) 설계
- **지시 항목 1 (SIM_PERSONAS 가짜 인물 0건화)**:
  - 검증 시나리오: `index.html` 내 `SIM_PERSONAS`의 길이가 0이고, 가짜 응원 타이머가 등록되지 않음을 확인.
  - 주장 코드: `assert-zero-sim-personas`.
- **지시 항목 2 (팔로워만 옵션 제거 및 team 전환)**:
  - 검증 시나리오: `#mGoalVis` 옵션 목록에 `followers`가 없고, 과거 데이터는 `team`으로 매핑됨을 확인.
  - 주장 코드: `assert-followers-removed-and-migrated`.
- **지시 항목 3 (무결성 게이트 및 스모크 테스트 100% ALL PASS)**:
  - 검증 시나리오: `verify-integrity-gate.js` 및 `smoke-test.js` 전수 무결 통과.
  - 주장 코드: `assert-all-gates-pass`.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트
- [ ] Step 1~6 외과수술적 코드 수정 완료.
- [ ] `node scripts/verify-integrity-gate.js` 100% PASS 확인.
- [ ] `npm test` 440개 테스트 100% PASS 확인.
- [ ] Git commit 및 초안 PR 생성 (`gh pr create --draft`).
- [ ] 법정 판정 청구 (`node court/chat.js <PR번호>`).

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: `smoke-test.js`의 기존 모임 템플릿 테스트에서 식별자를 찾지 못할 경우.
- **사전 방어**: `MOCK_GROUPS`의 템플릿 데이터(`g-workshop`, `g-travel`)는 그대로 보존하고, 활성 페르소나 데이터만 선별 제거.
- **롤백 계획 (Rollback Strategy)**: 문제 발생 시 `git checkout feat/2026-10-01-task-es-332-purge-mock-personas-followers` 브랜치 커밋 단위로 원자적 롤백 수행.
- **재검증 트리거**: `npm test` 실패 시 즉시 원칙 ①로 복귀하여 테스트 단언문 요구사항 재분석.
