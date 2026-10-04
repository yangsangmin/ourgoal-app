# REQ/PLAN — TASK-ES-380 목표 상세 「+ 최종 결과」(#goalResultBtn) 되살리기

> 숫자는 부품 시험·법정 러너(`court/lib/scenario.js`) 로컬 실행 산출이다(손으로 옮긴 수치 없음). 로컬 실행은 판정이 아니다.

## 지시 원문(작업 지시서 요지)

- 2026-09-29 ES-331(커밋 9c368bf)이 ui.css `#goalDetailBody > .toss-goal-hero-card { display:none !important; }` 로 위쪽 등반 로드맵과 중복되는 아래 진행 카드를 숨겼는데, 그 카드 안의 `#goalResultBtn`(「+ 최종 결과」)까지 가려졌다. 지금 목표 단위 최종 결과는 보관할 때만 입력 가능.
- 세션 [기본값] 결정(상민님께 선택지 설명 후 이의 없으면 A): **중복 카드는 그대로 숨기고, 버튼만 보이는 위쪽 영역으로 옮긴다.** 문구·동작(`L.openResultModal('goal', goal, …)`) 그대로. 숨김 CSS 는 그대로 두고 마크업만 옮긴다(CSS 은폐로 다시 가리는 꼼수 금지).

## REQ

- 대상 DOM ID: `#goalResultBtn`(옮김) · `#goalResultRow`·`.goal-result-row`(새 줄) · `#goalResultSummary`(결과 있을 때 요약) · 숨김 카드 `.toss-goal-hero-card.meta-strip` · 확인용 `#rsSave` · `#rsAiQuickInput` · `#rsJustArchive` · `#toast` · `#goalsHeadlineSentence`
- 대상 함수: `renderGoalDetailBody(goal, body)`(js/tabs/goals/goal-detail.js) — 지역 변수 `metaStrip` 에서 버튼을 빼고 새 지역 변수 `goalResultRow` · `goalResultPct` 를 만들어 `body.innerHTML` 의 보기 모드 자리 `metaStrip + goalResultRow` 로 붙인다. 연결은 `wireGoalDetailEvents`(js/tabs/goals/goal-detail-events.js 182~185줄 `getElementById('goalResultBtn')` → `L.openResultModal('goal', goal, …)`) 그대로 — 변경 0.
- 수정/생성 파일: `js/tabs/goals/goal-detail.js`(수정) · `tests/goal-result-btn-es380.test.js`(신규) · `scripts/test-shipyard-modular.js`(등록 2줄) · `reports/TASK-ES-380/`(주장·시나리오) · `docs/specs/REQ-TASK-ES-380-GOAL-RESULT-BTN.md` · `dev_log.md` · `docs/rules/TICKETS.md`
- 손대지 않는 것: `ui.css`(숨김 규칙 그대로), `index.html`(인라인 줄 수 0 증가), `goal-detail-events.js`, 버튼 문구(「+ 최종 결과」/「📝 결과 수정」).
- [기본값] 버튼 옆에 결과가 저장돼 있으면 「최종 결과 · 달성률 N%」(달성률 계산 불가면 「기록 완료」) 요약을 붙였다 — 예전 카드는 버튼 문구로만 결과 유무를 알렸는데, 카드가 숨겨져 달성률 막대가 안 보이므로 결과를 화면에 표시하는 최소 장치.

## PLAN — 문제해결 8원칙

## 1. [원칙 ①] 목표 정의
목표 상세 보기 모드에서 「+ 최종 결과」 버튼이 375px 화면에서도 보이고 눌리며, 누르면 결과 입력 창이 열리고 저장하면 버튼이 「📝 결과 수정」으로 바뀌고 결과 요약이 보이며, 같은 창의 「보관」으로 목표가 보관된다(#694 R1 을 화면으로 확인).

## 2. [원칙 ②] 현상 분석 — 본질·원인·중심·핵심 파악
- 기준 커밋(20a2493) `goal-detail.js` 72~97줄: `#goalResultBtn` 이 `<div class="toss-goal-hero-card meta-strip">` 안 마지막 줄에 있다. ui.css 15213줄 `#goalDetailBody > .toss-goal-hero-card { display:none !important; }` 가 그 카드를 통째로 숨겨 버튼이 보이는 요소 0개.
- 그 결과 목표 단위 결과 입력 경로는 「편집 → 📦 보관」(결과 없을 때만 창을 연다)뿐이고, 결과 수정·결과 있는 목표의 보관 창은 열 길이 없다.
- 로컬 법정 러너: 기준 커밋에서 시나리오 14단계 `#goalResultBtn → 보이는 요소 0개`.

## 3. [원칙 ③] 원인 추정
ES-331 이 "중복 카드 평탄화"를 카드 단위 CSS 숨김으로 처리하면서 카드 안에 유일하게 동작하던 버튼(결과 입력)을 함께 묻었다. 카드의 정보(제목·진행률)는 위쪽 등반 로드맵과 중복이지만 버튼은 중복이 아니었다.

## 4. [원칙 ④] 대안 탐색
- (A) [기본값] 카드는 숨긴 채, 버튼을 카드 밖 `#goalDetailBody` 맨 위 새 줄(`.goal-result-row`)로 옮긴다 — goal-detail.js 한 파일, 연결(id) 그대로.
- (B) 버튼을 `index.html` 의 `.goal-head-row` 오른쪽(활용가이드·+ 새 목표·편집 옆)에 render.js 가 붙인다 — 375px 에서 이미 버튼 3개로 꽉 차 줄바꿈이 생기고, render.js·index.html 두 곳을 고친다.
- (C) 숨김 규칙을 풀고 카드를 되살린다 — 상단 로드맵과 중복 카드가 다시 나타난다(ES-331 결정 뒤집기).
- (D) 숨김 규칙에 예외 CSS 를 덧대 버튼만 보이게 — CSS 은폐 덧칠(헌법 3.2 금지).
→ (A).

## 5. [원칙 ⑤] 실행 계획
goal-detail.js 마크업 이동 → 부품 시험(실제 모듈을 불러 숨김 카드 안팎 판정) → npm test 등록 → 게스트 시나리오(375px 저장·보관) 기준/작업 커밋 양쪽 실행 → claims → module-specs --write → npm test → 커밋·PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
- 반론 1: "버튼만 옮기면 숨김 카드가 여전히 DOM 에 남아 껍데기다." → 이번 범위는 버튼 복구이고 카드 제거는 기존 기능 삭제(승인선 ③)에 닿을 수 있어 건드리지 않았다. 카드 안에는 클릭 요소로 일정 반영(`[data-calsyncgoal]`)·공개 범위 배지가 남아 있다(공개 범위는 상단 `.goal-head-row` 의 `#goalsPrivacyBadge` 에도 있음, 일정 반영의 다른 진입점은 이번에 재지 않음) — 이 지시 범위 밖이라 보고만 하고 별도 티켓 대상.
- 반론 2: "#goalResultBtn 이 다시 다른 CSS(예: `:first-child` 규칙)에 가려질 수 있다." → ui.css 에 `goalDetailBody` 를 가리키는 규칙은 15213줄 하나뿐(검색 확인)이고, 시나리오가 실제 375px 화면에서 보임·크기(rect)·가로 넘침 없음·누름 적중(법정 click 의 가려짐 검사)을 잰다.

## 7. [원칙 ⑦] 즉시 실행
완료 — 커밋 참조.

## 8. [원칙 ⑧] 성과 측정
- 부품 시험 `tests/goal-result-btn-es380.test.js` 5건: 기준 커밋 사본(git archive 20a2493)에서 2건 실패(버튼이 숨김 카드 안 · 결과 요약 없음), 작업 커밋에서 5건 통과.
- 시나리오 `goals-result-btn-save-archive`(375×812): 기준 커밋 14단계(`#goalResultBtn` 보이는 요소 0개)에서 멈춤, 작업 커밋 전 단계 통과(버튼 보임 → 결과 저장 → 「결과 수정」·요약 → 「보관」 토스트 → 빈 목표 안내 → 예외 0).
- 시나리오 `goals-result-btn-visible`(375×812, R1 화면 주장 — 법정 1차 판정 "R1 코드만 확인" 뒤 추가): 기준 커밋 14단계(`#goalResultRow #goalResultBtn` 보이는 요소 0개)에서 멈춤, 작업 커밋 전 단계 통과(버튼 보임·문구·크기·가로 넘침 없음 → 누르면 「목표 결과 기록」 창).
* 체크리스트 마감 규칙: [4단계: 심사 청구]까지만 등록.

## 확인 못 한 것
- 실기기(레벨 6) 화면 — 법정 러너의 375px 모바일 에뮬레이션까지만.
- 실계정(서버 원장 result·archived_at 반영) — 저장 경로는 기존 `saveProfile` 그대로이고 이번 변경은 마크업 위치뿐이다.
