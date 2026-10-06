# [작업계획서] TASK-ES-578: openThemePickerModal 세포 분열 및 무결성 증명

> **작업 기준 커밋**: `37f41857ced08770a05b79565563326e0b851541` (origin/main, PR #838 머지 기준)  
> **작업 공간**: `C:/Users/HP/.codex/worktrees/agy-theme-578/ourgoal-app`  
> **브랜치**: `codex/task-es-578-theme-picker`  
> **분열 대상**: `openThemePickerModal` (index.html -> js/tabs/records/theme-picker.js, 73줄)  
> **실행 성격**: 세포 분열 및 전수 무결성 검증 (생성기 gen-inline-hard.js 사용, 토큰/AST 100% 동일, tests 113개 회귀 0)

---

## 1. 착수 판단 요약 및 5단 추론

### 5단 추론 블록
- **이해**: TASK-ES-578의 세포 분열 대상 함수 `openThemePickerModal`을 `js/tabs/records/theme-picker.js`로 분열하고, 실제 브라우저 환경에서 실제 마우스 클릭으로 테마 선택 시나리오를 실행하여 도달 가능성, 마우스 hit, DOM 변화, 저장 프로필, 원래 함수의 CDP coverage를 실측하고 보존한다.
- **분류**: `(가) 표준` (CELL_SPLIT_PROOF 및 기존 `today-mission-ui576.js` 기반 정밀 하네스 표준 방식 적용).
- **예측**:
  - 홈 화면 빠른 기록 캡처(`#captureInput`, `#captureSave`) 시 게스트 프로필 생성 및 저장 타이밍 대기 필요.
  - 기록 탭(`#navbtn[data-tab="records"]`) 이동 후 `.rec-card` 및 `.rec-theme-chip[data-rectheme]` 렌더링 확인 필요.
  - 모달 렌더링 시 `#themePickList` 내 `[data-picktheme]` 클릭 후 `toast` 알림 및 `saveProfile` 비동기 완료 대기 필요.
  - 2회 실행 시 생성되는 레코드 ID는 시간 기반 난수/해시로 달라질 수 있으나 ID 일대일 관계를 온전히 보존하여 그대로 보고.
- **반론 및 격파**:
  - *반론 1*: `openThemePickerModal`을 콘솔이나 `page.evaluate`에서 직접 호출하면 훨씬 빠르고 오류 없이 측정할 수 있다.
    - *격파*: 헌법 제4조 및 사용자 지침에 따라 함수 직접 호출, 상태 주입, 가짜 데이터 주입은 절대 금지된다. 실제 마우스 클릭을 통해서만 데드클릭, CSS 은폐, 실제 배선 무결성을 온전히 입증할 수 있다.
  - *반론 2*: 동일한 UI 2회 실행 시 ID 차이가 발생하므로 ID를 placeholder로 정규화하거나 무시해야 한다.
    - *격파*: 지침에서 "ID는 일대일 관계를 보존한다. 서로 다른 ID를 같은 placeholder로 합치거나 해시·키·배열을 삭제해서 같게 만들지 않는다. 차이는 먼저 그대로 보고하고 Codex가 비교 설계를 확정한다"고 명시되어 있다. 정규화 없이 실제 원시 차이를 투명하게 보존하고 보고한다.
- **선택**: 저장소 밖(`C:/dev/wt/agy-scratch/TASK-ES-578/`)에 정밀 UI 하네스를 작성하고, 기준 UI 2회 실행 및 작업 UI 1회 실행, 원시 증거를 UTF-8로 저장하여 검증을 완료한다.

---

## 2. 핵심 식별자 및 코드 구조 분석

### 대상 함수 및 식별자
1. **함수 원문**:
   - 위치: `index.html` (이전 5673~5713행, 41줄 -> 세포 분열 후 `js/tabs/records/theme-picker.js` 73줄)
   - 선언: `function openThemePickerModal(recId)`
   - 앱 스코프 노출: `index.html` IIFE 헤더에서 `_recordsKit.openThemePickerModal` 바인딩
2. **호출부 및 연결 요소**:
   - `js/tabs/records/record-cards.js` 79행:
     `<span class="rec-theme-chip" data-rectheme="'+r.id+'" style="'+chipStyle+'" title="테마 변경 (클릭)">'+th.icon+' '+th.label+subThText+' ▾</span>`
   - `js/tabs/records/record-card-wire.js`:
     - 46행: `var chipBtn = card.querySelector('[data-rectheme]');`
     - 50행: `L.openThemePickerModal(id);`
   - 모달 내부 요소:
     - 테마 목록 컨테이너: `#themePickList`
     - 테마 선택 옵션: `[data-picktheme]`
     - 모달 닫기 버튼: `#mCloseTheme`
3. **기존 Records 키트 및 태그 순서 / 통째 대입 여부**:
   - 키트 변수: `OurgoalRecordsKit` (`window.OurgoalRecordsKit`)
   - 인라인 별칭: `index.html` `var _recordsKit = window.OurgoalRecordsKit;`
   - 태그 순서:
     - `record-cards.js` -> `record-card-wire.js` -> `theme-picker.js` -> ... -> `index.html` 본문
   - 통째 대입 여부:
     - `var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};` 형태로 속성만 덧붙임 (안전함).

---

## 3. 작업 항목 체크리스트

- [x] Step 1. 사전 열람 및 환경 확인 · 3분 · 기준 커밋 `37f41857` 및 헌법·작업참고·지시함 확인 완료
- [x] Step 2. 식별자 연결 및 코드 구조/키트 순서 조사 · 5분 · 대상 함수/호출부/키트/태그 순서/직전 커밋/claims 확인 완료
- [x] Step 3. 작업계획서 작성 (`.claude/plan-TASK-ES-578.md`) · 3분 · 완료
- [x] Step 4. 저장소 밖 테마 모달 UI 정밀 하네스 스크립트 작성 (`C:/dev/wt/agy-scratch/TASK-ES-578/theme-picker-ui578.js`) · 10분 · 실제 마우스 클릭 기반 시나리오 및 CDP coverage 계측기 작성 완료
- [x] Step 5. 기준 UI 1회차 실행 (base1) 및 증거 생성 · 5분 · `ui-base1.json`, coverage, DOM/저장소/토스트/클릭 로그 수집 (actualCallCount 2, completed true)
- [x] Step 6. 기준 UI 2회차 실행 (base2) 및 증거 생성 · 5분 · `ui-base2.json`, coverage, ID 보존 및 1회차 대비 차이점 수집 (actualCallCount 2, completed true)
- [x] Step 7. 생성기 실행 (`gen-inline-hard.js`) · 5분 · `js/tabs/records/theme-picker.js` 생성 및 `index.html` IIFE 배선 완료
- [x] Step 8. 세포 등록 및 메타데이터 갱신 · 3분 · `modules.json`, `cell-descriptions.json` 등록 완료
- [x] Step 9. 검증기 실행 (`verify-inline-hard.js`) · 3분 · AST/토큰 100% 동일 검증 통과
- [x] Step 10. 단독 로드 탐침 (`court/probes/module-load.js`) · 5분 · 82개 모듈 회귀 0 및 `theme-picker.js` 단독 로드 성공 (`reports/TASK-ES-578/module-load.json`)
- [x] Step 11. 작업본 UI 하네스 실행 (after) 및 증거 생성 · 5분 · `ui-after.json` (actualCallCount 2, completed true)
- [x] Step 12. UI 비교기 실행 (`theme-picker-compare578.js`) · 5분 · 1372개 지표 비교, 0 예기치 않은 차이, 1:1 ID 보존 입증 완료
- [x] Step 13. 격리 탭 하네스 실행 (`tab-isolated578.js`) · 5분 · 기록 탭 24장 실측 (base1, base2, after 408개 지표 차이 0)
- [x] Step 14. 시나리오 및 이음매 검증 · 5분 · `scenario-local-z56.js` (allPassedBoth: true), `seam-order-check.js` (ok: true)
- [x] Step 15. 시험 스위트 전체 및 113개 개별 시험 대조 · 10분 · `npm test` 통과, `tests-exit-compare-z4.js` 회귀 0 입증
- [x] Step 16. 보고서 적재 (`proof.json`, `claims.json`, `preparation.json`, `dev_log.md`, `TICKETS.md`) · 5분 · 완료

---

## 4. 실측 증거 및 대조 요약

### 1) 실행 요약
- **하네스**: `docs/design/harness/module-split/theme-picker-ui578.js`
- **1회차 (ui-base1)**:
  - 파일: `reports/TASK-ES-578/ui-base1.json` (원시: `C:/dev/wt/agy-scratch/TASK-ES-578/ui-base1-raw.json`)
  - `completed`: true, `actualCallCount`: 2 (step 3에서 1회, step 5에서 1회)
  - 마우스 클릭 수: 10회 (게스트 진입 -> 인사 모달 닫기 -> 홈 저장 -> 축하 모달 닫기 -> 피드백 시트 닫기 -> 기록 탭 -> 테마 칩 클릭 -> 테마 study 선택 -> 테마 칩 다시 클릭 -> 모달 닫기)
- **2회차 (ui-base2)**:
  - 파일: `reports/TASK-ES-578/ui-base2.json` (원시: `C:/dev/wt/agy-scratch/TASK-ES-578/ui-base2-raw.json`)
  - `completed`: true, `actualCallCount`: 2 (step 3에서 1회, step 5에서 1회)
  - 마우스 클릭 수: 10회 동일
- **작업본 (ui-after)**:
  - 파일: `reports/TASK-ES-578/ui-after.json` (원시: `C:/dev/wt/agy-scratch/TASK-ES-578/ui-after-raw.json`)
  - `completed`: true, `actualCallCount`: 2 (step 3에서 1회, step 5에서 1회)
  - 마우스 클릭 수: 10회 동일
- **비교 분석 결과**: `reports/TASK-ES-578/ui-compare.json`
  - 1372개 지표 비교 완료 (DOM 24종, leaf 1320개: 정적 1254개 일치, 동적 66개 코드 출처 검증)
  - 10개 클릭 selector 및 hitTag 100% 일치
  - 1:1 ID 맵핑 보존 (L053)
- **탭 격리 실측**: `reports/TASK-ES-578/tab-compare.json`
  - 24개 캡처 포인트, 408개 속성 비교: base1 == base2 == after (차이 0)
- **개별 시험 종료 코드 대조**: `reports/TASK-ES-578/tests-exit-compare.json`
  - 113개 시험지 대조 결과 regressions: 0
- **보존된 실패 증거**:
  - fail 1 (하네스 $eval sel 미전달): `ui-base1-fail1-raw.json`, `ui-base1-fail1.json`
  - fail 2 (첫 체크인 축하 모달 차폐): `ui-base1-fail2-raw.json`, `ui-base1-fail2.json`, `theme-picker-ui578-fail2.js`
  - fail 3 (체크인 피드백 시트 차폐 및 active 클래스 대기 미세조정): `ui-base1-fail3-raw.json`, `ui-base1-fail3.json`, `theme-picker-ui578-fail3.js`
