# REQ — #TASK-ES-406 팀 카드 「팀 수준별 목표 관리」 아코디언 죽은 클릭 수정

- 근거: 코디네이터 지시(2026-10-05) — #719(TASK-ES-402) 빌더 진단: 팀 카드의 「팀 수준별 목표 관리」 머리(`[data-tglevelaccordion]`)를 실제로 눌러도 본문(`[data-tglevelbody]`)이 펼쳐지지 않는다. 기준 커밋(origin/main 0529229)에서도 같다. 그래서 게스트가 마우스로 수준별 조 모달(`openLevelGroupDetailModal`, `js/team-level-group-modal.js`)을 열 길이 없다.
- 범위: `js/team-visibility-levels.js`(토글 저장값 계산 + 판정 함수 `isLevelSectionOpen` 노출), `index.html` `collapseAllTeamGoalAccordions`(같은 줄 안에서 수정, 줄 수 증가 0). 다른 팀 아코디언(일괄 접기가 의도된 곳)의 동작은 그대로.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. 원인 배선을 고친다: 사용자가 펼친 상태(저장값)를 일괄 접기 함수가 존중하게 한다. CSS 은폐·`!important` 금지.
2. 4위 1체: 클릭 → 펼침/접힘 → 저장값 일치 → 시각 피드백(본문 보임·화살표 `rotated`).
3. 증명: 부품 시험(클릭 1회 펼침·2회 접힘·다시 렌더 뒤 유지, 기준 실패→작업 통과), 게스트 화면 시나리오(기준: 본문 안 보임 / 작업: 본문 글자 보임 → 수준별 조 모달 열림), 탭 실측 기준·작업 비교.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- 본질: 「펼침」을 정하는 곳이 세 군데(렌더 `isLevelFolded`, 클릭 토글, 일괄 접기)인데 셋이 서로 다른 규칙을 썼다. 상태 하나에 판정이 셋이라 클릭이 화면에 닿지 못했다.
- 원인(측정, 두 겹):
  ① 토글 `p.settings.foldLevelSection[gid] = !p.settings.foldLevelSection[gid]` — 저장값이 없을 때(undefined) 렌더는 「접힘」(`!== false`)으로 보는데 토글은 `!undefined = true`(접힘)를 저장한다. 첫 클릭은 아무것도 바꾸지 않는다.
  ② 두 번째 클릭에 저장값이 false(펼침)가 되어 렌더는 `display:block` 을 그리지만, `renderTeamGoalsScreen` 이 `view.innerHTML` 직후 부르는 `collapseAllTeamGoalAccordions`(index.html, #TASK-ES-302)가 `.tg-accordion-body, [data-tglevelbody]` 를 전부 `display:none` 으로 덮고 화살표 `rotated` 를 뗀다. 저장값은 false 인데 본문은 접힘.
- 중심: 저장값 `foldLevelSection[gid] === false` 하나만 「펼침」이다. 이 판정을 `isLevelSectionOpen(gid)` 한 함수로 두고 토글·일괄 접기가 같이 쓴다.
- 핵심: 일괄 접기의 다른 대상(마일스톤·세부 할 일·댓글·조별 본문 `[data-tglgbody]`·details)은 건드리지 않는다 — 수준별 본문과 그 머리의 화살표만 저장값을 본다.

## 3. [원칙 ③] 해결방식

- `js/team-visibility-levels.js`: `function isLevelSectionOpen(gid)` 추가(프로필 `settings.foldLevelSection[gid] === false`), 노출 객체 끝에 `isLevelSectionOpen` 키 추가. 토글은 `p.settings.foldLevelSection[gid] = isLevelSectionOpen(gid);`(지금 펼쳐져 있으면 접힘 true, 접혀 있으면 펼침 false).
- `index.html` `collapseAllTeamGoalAccordions`: 첫 줄 끝에 지역 함수 `isTeamLevelSectionOpen`(모듈이 있으면 `OurgoalTeamVisibilityLevels.isLevelSectionOpen` 호출, 없으면 false = 예전처럼 접음)을 두고, 수준별 본문 줄은 `if (!isTeamLevelSectionOpen(el.getAttribute('data-tglevelbody'))) el.style.display = 'none';`, 화살표 줄은 `[data-tglevelaccordion]` 머리 안의 화살표이고 그 팀이 펼침이면 `rotated` 를 남긴다. 세 줄 모두 같은 줄 안 수정(인라인 줄 수 증가 0).
- `js/components.js` 3524·3580 의 같은 모양 폴백은 `window.collapseAllTeamGoalAccordions` 가 없을 때만 도는 길이라(앱에서는 index.html 이 항상 정의) 이번에 고치지 않는다.

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- 저장값이 이미 false 로 남아 있던 사용자(두 번 눌렀던 사람)는 이제 그 팀 카드가 펼쳐진 채로 보인다 — 저장값과 화면이 일치하게 된 결과다.
- 게스트 체험 팀(운동 크루 g0)은 「목표별 수준관리」 조가 0개라, 시나리오는 「🌐 팀 통합 수준관리」로 바꾼 뒤 A조 「자세히보기」로 모달을 연다.
- 탭 실측 도구(`tab-check.js`)의 goals 상태에는 팀 서브탭·아코디언 펼침 상태가 없다 — 펼침 칸 자체는 게스트 시나리오와 부품 시험이 잰다.
- 로그인 사용자 화면·실기기는 재지 않았다(원격 저장 경로는 기존 `saveProfile` 그대로).

## 5. [원칙 ⑤] 절차

1. `git archive` 기준 사본 → 2. 원인 배선 확인(토글·일괄 접기) → 3. 수정 → 4. 부품 시험 `tests/team-level-accordion-es406.test.js`(기준 사본·작업) → 5. 게스트 시나리오 `reports/TASK-ES-406/scenarios/team-level-accordion.json` 로컬 예비 실행(court/lib/scenario.js 그대로, 기준·작업) → 6. `tab-check.js goals --deadclick off` 기준 2회·작업 1회 → `tab-compare.js` → 7. npm test 기준·작업, tests/ 종료 코드 비교 → 8. `module-specs --write`·`module-guard` → 9. REQ·claims·dev_log·TICKETS·PR.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "일괄 접기(#TASK-ES-302)는 탭 진입 때 모두 접으라는 지시였다 — 펼침을 남기면 그 지시를 어긴다." → 격파: 그 지시의 대상은 기본 상태다. 사용자가 직접 펼친 수준별 섹션까지 접으면 이 섹션의 클릭이 영원히 화면에 닿지 않는다(죽은 클릭, 제6조). 저장값이 없는 기본 상태는 여전히 접힘이고, 다른 아코디언은 그대로 모두 접힌다(부품 시험이 잰다).
- 반론 2: "렌더 뒤 bindEvents 에서 펼침을 다시 칠하면 index.html 을 안 건드려도 된다." → 격파: 그것은 덮인 뒤 다시 덮는 증상 처리이고, 일괄 접기를 부르는 다른 길(`js/components.js` 의 `handle팀목표_Item52Action` 등)에서는 또 어긋난다. 판정 하나(`isLevelSectionOpen`)를 접는 쪽이 직접 보게 하는 것이 배선 수정이다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- DOM: `[data-tglevelaccordion="<gid>"]`(머리), `[data-tglevelbody="<gid>"]`(본문), `.tg-accordion-arrow`(화살표), `[data-tglevelmode="<gid>:team"]`, `[data-openleveldetail="<gid>:<lgId>"]`, `#modalSheet`.
- 함수: `isLevelSectionOpen`(신규, `js/team-visibility-levels.js`), `bindEvents` 의 `[data-tglevelaccordion]` 클릭 리스너, `renderTeamCardContent`(`isLevelFolded`, 변경 없음), `collapseAllTeamGoalAccordions`(index.html), `renderTeamGoalsScreen`(변경 없음).
- 파일: `js/team-visibility-levels.js`, `index.html`, `tests/team-level-accordion-es406.test.js`, `scripts/test-shipyard-modular.js`(runNode 1줄), `reports/TASK-ES-406/**`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

수치는 `reports/TASK-ES-406/` 의 측정 파일을 인용한다.

| 측정 | 방법 | 결과 |
| :-- | :-- | :-- |
| 부품 시험 | `node tests/team-level-accordion-es406.test.js` (기준 사본에 같은 파일 복사) | 기준 종료 1(9개 중 5개 실패) · 작업 종료 0(9/9) |
| 게스트 시나리오 | court/lib/scenario.js 로컬 예비 실행 | 기준: 단계 12(본문 글자) 실패 · 작업: 23단계 통과(본문 글자 → 접힘 → 펼침 → 모달 「수준별 목표 상세 관리」) |
| 탭 실측 | `tab-check.js goals --deadclick off` 기준 2회·작업 1회 → `tab-compare.js` | 408값, 기준1 대 기준2 0 · 기준1 대 작업 0 · 기준2 대 작업 0 (goals 상태에 팀 서브탭·펼침 칸 없음) |
| npm test | 기준·작업 | smoke 443/0 · 무결성 38/38 기준·작업 같음, tests/ 102개 종료 코드 기준과 차이 0(새 파일 1개 추가) |
