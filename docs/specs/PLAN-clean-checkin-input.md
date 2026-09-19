# 엔지니어링 작업계획서 (PLAN) — 오늘의 3초 체크인 입력창 자동 채우기 제거 및 순수 빈 입력창·지움 없는 힌트 시스템

> **문서 ID**: PLAN-clean-checkin-input  
> **요구사항 연계**: [REQ-clean-checkin-input](file:///C:/dev/ourgoal-app/docs/specs/REQ-clean-checkin-input.md)  
> **티켓 연계**: #TASK-ES-190  
> **작성 일시**: 2026-09-19  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 홈 화면 3초 체크인 입력창에서 `inp.value`에 긴 예시 텍스트를 강제로 채워넣는 코드를 전면 제거하고, 순수한 빈 입력창과 플레이스홀더 기반 힌트 시스템으로 전환하여 사용자가 지울 필요 없이 즉시 타이핑할 수 있게 구현.
- **영향 받는 파일 목록 전수**:
  - `index.html`: UI 마크업(188~195행), 커닝페이퍼 렌더러(`renderQuickCheckinGuideChips()`), 초기화 보장 로직
  - `docs/specs/REQ-clean-checkin-input.md`: 요구사항 정의서
  - `docs/specs/PLAN-clean-checkin-input.md`: 작업 계획서
  - `scripts/verify-integrity-gate.js`: 무결성 게이트 검증
  - `scripts/smoke-test.js`: 스모크 테스트 검증

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 3초 체크인의 엔지니어링 본질은 '무저항 빠른 기록'이며, 입력창(`textarea#captureInput`)은 항상 사용자의 입력을 맞이할 준비가 된 빈 버퍼여야 함.
- **[원인] (Technical Causes)**:
  1. `btn-quick-chip` 인라인 클릭 핸들러에서 `inp.value = '...'` 실행.
  2. `renderQuickCheckinGuideChips()` 리스너에서 `inp.value = btn.dataset.cunningtext;` 실행.
  3. `placeholder` 문자열의 커서 파이프 기호(` |`)로 인한 오해 유발.
- **[중심 배선] (Core Wire & State)**:
  - `textarea#captureInput`: `value = ''` 유지, `placeholder = '예: ' + hint`로 연동.
  - `state.profile`: 저장 시 레코드 추가 및 스트릭 갱신 정상 유지.
- **[핵심 안전장치] (Critical Safety & Persistence)**: 기존 스모크 테스트 단언문(`renderQuickCheckinGuideChips();`, `내 목표 맞춤 커닝페이퍼`, `data-cunningtext=`, `id="captureInput" placeholder="예: `) 100% 호환 보장.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[홈 화면 로드 / 칩 클릭] -> [inp.value 유지(빈 상태) + inp.placeholder 힌트 설정 + inp.focus()] -> [사용자 타이핑] -> [기록 완료 클릭] -> [state.profile.records 저장 및 inp.value 클리어] -> [4대 뷰 전파]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 정적 칩 및 동적 커닝페이퍼 클릭 핸들러 수정 | +10줄 | -8줄 | +2줄 | 외과수술적 diff |
| `docs/specs/REQ-clean-checkin-input.md` | 요구사항 정의서 작성 | +80줄 | 0줄 | +80줄 | 신규 스펙 |
| `docs/specs/PLAN-clean-checkin-input.md` | 엔지니어링 작업계획서 작성 | +90줄 | 0줄 | +90줄 | 신규 스펙 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `id="captureInput"`, `.btn-quick-chip`, `[data-cunningtext]` 시맨틱 완비.
2. **이벤트 리스너 (Listener)**: 클릭 시 힌트 적용 및 포커스 배선.
3. **비즈니스 로직 (Logic)**: 실제 저장 시 빈 값 처리 및 테마 연동 정상 유지.
4. **피드백 & 예외처리 (Feedback)**: 힌트 적용 토스트 안내 및 햅틱 피드백 연동.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (정적 칩 핸들러 개선)**: `index.html` 188~190행의 `onclick`에서 `inp.value` 대입을 제거하고 `inp.value=''; inp.placeholder='...'; inp.focus();`로 수정.
2. **Step 2 (Textarea Placeholder 정돈)**: `index.html` 193행의 끝부분 파이프 문자(` |`) 제거.
3. **Step 3 (동적 커닝페이퍼 렌더러 수정)**: `renderQuickCheckinGuideChips()` 내 클릭 리스너에서 `inp.placeholder` 변경 및 포커스 배선. 안내 문구 텍스트 정돈.
4. **Step 4 (초기 순수 빈 버퍼 보장)**: `renderHome()` 시점에 사용자가 입력 중이 아닌 경우 `inp.value = ''` 확인.
5. **Step 5 (검증 및 테스트)**: 무결성 게이트 및 스모크 테스트 실행, 브라우저 실측 캡처.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
> *(주의: 본 원칙은 구현 순서(⑤)와 체크리스트(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 합치는 것은 위헌입니다)*
- **시나리오 A (Zero Dead-Click)**: 정적 칩 3종 및 커닝페이퍼 칩 전수 클릭 시 에러 0건 및 포커스 정상 작동 확인.
- **시나리오 B (Zero Data Loss)**: 10종 가상 페르소나 데이터 무손실 검증 및 기존 체크인 저장 기능 보존 확인.
- **시나리오 C (Zero UX Regression)**: 사용자가 글을 지우지 않고 바로 작성할 수 있는 UX 100% 달성 확인.
- **시나리오 D (Full State Propagation)**: 체크인 저장 시 히트맵, 스트릭, 4대 뷰 정상 반영 확인.
- **시나리오 E (자동화 게이트 통과)**: `scripts/smoke-test.js` 및 `scripts/verify-integrity-gate.js` 100% ALL PASS.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] Step 1~5 순차적 구현 (AI 코드 축약 `// ...` 일절 없이 완전한 실행 코드 작성)
- [x] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [x] 스모크 테스트 전수 검증: `npm test` PASS
- [x] Chrome CDP 브라우저 실측 캡처 및 시각적 검증 완결
- [ ] [4단계: 로컬 메인 병합 상태 및 5A 프리뷰 배포] 완결 후 상민님께 실서버 배포 여부 보고

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 스모크 테스트 단언문 불일치 가능성.
- **사전 방어 및 우회 로직**: `scripts/smoke-test.js`의 7100~7102행 단언문을 사전에 확인하여 요구되는 문자열 정확히 계승.
- **롤백 계획 (Rollback Strategy)**: 실패 시 `git reset --hard HEAD`를 통해 `feat/clean-checkin-input-es190`의 시작 지점으로 안전 롤백.
- **재검증 트리거**: 자동화 테스트 불통과 시 원칙 ④(재검토)로 즉시 회귀하여 코드 단언문 분석.
