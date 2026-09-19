# 엔지니어링 작업계획서 (PLAN) — 아워골 전반 입력창 지움 피로도 7대 전수 근절 및 목표 가이드 미작동 버튼 영구 삭제

> **문서 ID**: PLAN-clean-inputs-and-guide  
> **요구사항 연계**: [REQ-clean-inputs-and-guide](file:///C:/dev/ourgoal-app/docs/specs/REQ-clean-inputs-and-guide.md)  
> **티켓 연계**: #TASK-ES-191 (생각 메모장 [90]번 포함)  
> **작성 일시**: 2026-09-19  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 3초 체크인과 동일하게 피드 공유 모달, 팀 연계 개인목표 생성 모달, 온보딩 첫 실천 모달, 일정 첨부 모달, 팀 목표 추가 모달, AI 커스텀 모달, 아바타 기본 인사말 설정 등 7대 모달/입력창에서 `value`에 긴 텍스트를 강제로 채워넣는 코드를 전면 제거하고 순수 빈 입력창과 placeholder 힌트 시스템으로 전환. 아울러 생각 메모장 [90]번인 목표 탭 활용가이드 내 미작동 껍데기 버튼(`btnGuideAddFirstGoal`)을 영구 삭제.
- **영향 받는 파일 목록 전수**:
  - `index.html`: 7대 입력창 로직 및 [90]번 버튼 태그 수정
  - `docs/specs/REQ-clean-inputs-and-guide.md`: 요구사항 정의서
  - `docs/specs/PLAN-clean-inputs-and-guide.md`: 엔지니어링 작업계획서
  - `scripts/verify-integrity-gate.js`: 헌법 5대 게이트 검증
  - `scripts/smoke-test.js`: 스모크 테스트 검증

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 입력 필드의 엔지니어링 본질은 '무저항 타이핑 버퍼'이며, 사용자가 직접 쓰는 창은 항상 빈 상태여야 하고 예시는 placeholder로만 제시되어야 함. 또한 작동하지 않는 버튼은 0ms 즉시 DOM에서 영구 소거되어야 함.
- **[원인] (Technical Causes)**:
  1. 피드 공유 모달: `captionInput.value`에 긴 문자열을 직접 할당.
  2. 팀 연계 목표: HTML 마크업 상 `value="[...] 나의 실천 미션"` 하드코딩.
  3. 온보딩 첫 기록: 칩 클릭 시 `ta.value = chip.dataset.chip` 실행.
  4. 일정 첨부: 4대 프리셋 칩 클릭 시 `titleInput.value`, `noteInput.value`에 긴 텍스트 강제 주입.
  5. 팀 목표 추가: 추천 템플릿 클릭 시 `tgTitleInput.value = title` 실행.
  6. 커스텀 표 모달: `customTplTitle`의 value에 `curAiRec.title` 주입.
  7. 아바타 인사말: 커스텀 저장값 부재 시 기본 문자열을 value에 하드코딩.
  8. 가이드 버튼: `btnGuideAddFirstGoal`에 이벤트 리스너가 연결되지 않은 채 UI에만 노출.
- **[중심 배선] (Core Wire & State)**:
  - 모든 대상 입력 필드: `value = ''` 기본 유지, `placeholder = '예: ' + hint` 힌트 배선, 미입력 제출 시 스마트 fallback 보증.
  - 목표 탭 가이드: `btnGuideAddFirstGoal` 태그 완전 소거.
- **[핵심 안전장치] (Critical Safety & Persistence)**: 기존 스모크 테스트의 단언문 및 사용자 저장 데이터 구조 100% 무손실 보존.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[모달 오픈 / 추천 칩 클릭] -> [input.value 빈 상태 유지 + placeholder 힌트 노출 + focus()] -> [사용자 즉각 타이핑 또는 기본값 선택] -> [저장/게시 클릭 시 value 혹은 fallback 채택] -> [로컬/원격 원장 저장 및 상태 전파]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 7대 입력창 placeholder 전환 및 [90]번 버튼 소거 | +35줄 | -25줄 | +10줄 | 외과수술적 diff |
| `docs/specs/REQ-clean-inputs-and-guide.md` | 요구사항 정의서 작성 | +80줄 | 0줄 | +80줄 | 신규 스펙 |
| `docs/specs/PLAN-clean-inputs-and-guide.md` | 엔지니어링 작업계획서 작성 | +90줄 | 0줄 | +90줄 | 신규 스펙 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `shareCaptionInput`, `tlpTitleInput`, `obFirstNote`, `attTitleInput`, `tgTitleInput`, `customTplTitle`, `avatarGreetingDayMsg`의 시맨틱 무결성 완비. `btnGuideAddFirstGoal` 영구 소거.
2. **이벤트 리스너 (Listener)**: 클릭 시 `value`를 오염시키지 않고 `placeholder`와 포커스만을 제어하도록 완전 전환.
3. **비즈니스 로직 (Logic)**: 사용자가 직접 작성하지 않고 제출할 경우에도 안내된 힌트가 안전하게 fallback으로 작용하는 스마트 제출 안전망 배선.
4. **피드백 & 예외처리 (Feedback)**: 토스트 알림 및 유효성 검사 정상 유지.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (소통 탭 피드 공유 모달)**: `captionInput.value` 할당 제거 및 placeholder 힌트화, fallback 배선.
2. **Step 2 (팀 연계 개인목표 모달)**: `tlpTitleInput`의 하드코딩된 `value` 제거 및 placeholder 힌트화, fallback 배선.
3. **Step 3 (온보딩 첫 실천 모달)**: 칩 클릭 시 `ta.value` 대입 제거, `placeholder` 힌트 및 포커스 배선.
4. **Step 4 (일정 첨부 모달)**: 4대 프리셋 칩 클릭 시 value 대입 제거, placeholder 힌트화 및 fallback 배선.
5. **Step 5 (팀 목표 추가 모달)**: 추천 템플릿 클릭 시 제목 강제 대입 제거, placeholder 힌트화 및 fallback 배선.
6. **Step 6 (커스텀 표 모달)**: `customTplTitle` 초기 value 제거 및 placeholder 힌트화, fallback 배선.
7. **Step 7 (아바타 인사말 설정)**: 저장된 값 없을 때 빈 value 및 placeholder 안내.
8. **Step 8 (생각 메모장 [90]번)**: 목표 가이드 모달 내 미작동 `btnGuideAddFirstGoal` 영구 삭제.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
> *(주의: 본 원칙은 구현 순서(⑤)와 체크리스트(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 합치는 것은 위헌입니다)*
- **시나리오 A (Zero Dead-Click)**: 7대 모달의 추천 칩/버튼 클릭 및 [90]번 버튼 소거 검증 (콘솔 에러 0건 및 즉각 포커스).
- **시나리오 B (Zero Data Loss)**: 10종 가상 페르소나 데이터 무손실 검증 및 기존 저장 기능 100% 보존 확인.
- **시나리오 C (Zero UX Regression)**: 사용자가 기존 글자를 지우지 않고 즉시 타이핑할 수 있는 스마트 힌트 UX 달성 확인.
- **시나리오 D (Full State Propagation)**: 각 모달에서 저장/생성 시 관련 뷰(홈, 목표, 피드, 캘린더, 설정)에 100% 정상 전파 확인.
- **시나리오 E (자동화 게이트 통과)**: `scripts/smoke-test.js` 및 `scripts/verify-integrity-gate.js` 100% ALL PASS.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] Step 1~8 순차적 구현 (AI 코드 축약 `// ...` 일절 없이 완전한 실행 코드 작성)
- [x] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [x] 스모크 테스트 전수 검증: `npm test` PASS
- [x] Chrome CDP 브라우저 실측 캡처 및 시각적 검증 완결
- [ ] [4단계: 로컬 메인 병합 상태 및 5A 프리뷰 배포] 완결 후 상민님께 실서버 배포 여부 보고

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 스모크 테스트 단언문 불일치 가능성.
- **사전 방어 및 우회 로직**: 기존 기능의 주요 ID 및 함수 인터페이스 완벽 보존.
- **롤백 계획 (Rollback Strategy)**: 실패 시 `git reset --hard HEAD`를 통해 `feat/clean-inputs-and-guide-es191`의 시작 지점으로 안전 롤백.
- **재검증 트리거**: 자동화 테스트 불통과 시 원칙 ④(재검토)로 즉시 회귀하여 코드 단언문 분석.
