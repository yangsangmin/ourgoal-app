# REQ — 미분화 덩어리 해체 B6: 기록 키트(_recordsKit) 배선 철거 1차·2차

- Task ID: **TASK-ES-626** (L012: 오케스트레이터가 번호를 배정했고, `gh pr list --state all --limit 40` · `git ls-remote origin` 에서 626 이 비어 있음을 다시 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-626-unwire-records` 를 먼저 push 해 선점했다.)
- 상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」
- 지시함(origin/main): **DIR-003**(「키트별 철거: settings → goals → ui → records → …」 · 철거 PR 마다 기준선에 inlineScriptLines 기록 — 줄지 않으면 실패) · **DIR-004**((가) 생성기 줄 종류 닫힌 목록 · (다) 시험이 글자로 붙잡는 연결선 이름은 남긴다).
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준 — 「배선 철거」 넷째 사례**. 작업참고(기준 PR #895, 4134955f). 선례 #891·#894·#896(셋 다 판정 「통과」·R1 동작 보존 확인)의 절차와 실행기를 그대로 따른다. 새로 쓰는 생성기 기능·도구 변경 없음.
- 착수 기준 main 9d039044(#896 병합) · push 전 합친 main 1ab4bc0b(#897 생성 지도 갱신 — 두 커밋 사이 `index.html`·`js/**`·`scripts/**`·`tests/**`·`court/**`·기준선·도구 차이 0, 합친 뒤 npm test·측정·로컬 법정을 다시 돌렸다).
- 설계 정본: docs/architecture/CELL-REGISTRY-DESIGN.md 3.1·3.2·4절·5.1(U1~U3)·6.2. 철거 계획 입력: `reports/TASK-ES-614/unwire-plan.json`.
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

| ID | 지시 | 출처 | 완료 기준 |
|---|---|---|---|
| R1 | index.html 인라인 IIFE 에서 `_recordsKit` 배선 두 실행을 생성기 unwire 로 지우고 앱 동작을 보존한다(손 편집 0): ① 1차(가져오기·getter·window) ② 2차(가져오기 줄은 남기고 getter·window) | DIR-003 「키트별 철거: records」 · 오케스트레이터 지시 | 기록 탭 조작 시나리오와 게스트 여섯 탭 시나리오가 기준·작업 양쪽에서 통과 · 법정의 생성기 재실행 결과와 index.html 이 바이트 동일 |
| R2 | 지운 이름은 등록 기관(own)이 같은 값으로 내준다 | 설계 3.1·3.2 | 철거 전 이름 목록으로 대조해 불일치 0 · 통로에서 사라진 이름 0 · 이름별 값 지문 차이 0 |
| R3 | 지우는 대상은 설정이 허용한 줄 종류(U1~U3)뿐 · names 밖 이름·함수 본문·그 밖의 글자 불변 · 바뀐 제품 파일은 index.html 하나 | DIR-004 (가) · 설계 5.1 | 실행을 차례로 되짚어 만든 결과 == 작업 index.html · 허용 종류 밖 삭제 줄 0 |
| R4 | 증명 하한과 기준선 기록 | 설계 4절 「배선 철거」 · DIR-003 | inlineScriptLines 감소와 `module-guard --update` 기록 · 모듈 로드 새 회귀 0 · npm test 동일·폐기 0 · tests/·금고·생성기·등록 기관·도구 변경 0 |

원문에 있는데 이 PR 에 없는 것(목표 줄에 남긴다): 「남은 미분화작업 모두」 — 시험이 배선 글자를 붙잡는 이름(`renderStopwatchWidgetHtml`·`renderMultiMetricSvg`·`instantShareCheckinToFeed` 등), 손잡이 줄(X2), 나머지 키트(_commKit·_calendarKit·기타·`_xp`)는 다음 PR 들이다.

### 구체 식별자

- 고친 제품 파일: `index.html` 하나 — 인라인 IIFE 의 `var X = _recordsKit.X;` 51줄 · `OurgoalAppScope.expose('index.html', { get X(){ return X; }, … })` 속성 61줄(빈 껍데기 4문) · `window.X = X;` 19줄(빈 if 블록 껍데기 2개) · 쉼표 3글자(생성기 산출 그대로)
- 기록: `docs/architecture/module-baseline.json`(`node scripts/module-guard.js --update` 가 53번째 항목을 더함) · `docs/rules/TICKETS.md` · `reports/TASK-ES-626/`
- 손대지 않은 것: `js/**` 전부 · 생성기 · 실행기(`unwire-run.js` — #896 판 그대로) · tests/ · 금고 · 그 밖의 생성 지도(L009)
- 화면 식별자(시나리오): `.navbtn[data-tab=…]` · `#recViewFeed` · `#recViewStats` · `#recSearchInput` · `#recordsList .empty-state` · `#recMiniPulseBar`
- 지운 이름 70개의 목록은 `reports/TASK-ES-626/proof.json` `unwire[0..1].names`(예: `setRecordsSegment` · `filterRecordsByQuery` · `renderRecordThemeFilters` · `buildRecordCardHtml` · `renderRecordHeatmap` · `toggleRecordArchive` · `exportRecordsCsv` · `renderRecordsScreen` · `openRecordModal` · `openWeeklyRecapModal`)

## 1. [원칙 ①] 문제를 정확히 파악한다

- #896 뒤 index.html 인라인 줄 수는 3,483(module-metrics, 기준 9d039044)이다. 남은 키트 배선 가운데 기록 키트가 가장 크다(계획상 1차 115줄 · 2차 28줄).
- 기록 키트의 이름은 기록 탭 화면 그리기(`renderRecordsScreen`·`buildRecordCardHtml`·`filterRecordsByQuery`), 구획 전환(`setRecordsSegment`), 체크인 뒤 처리, 내보내기(`buildCSV`·`buildICS`)다. 다른 세포가 통로(`L.이름`)로 읽고, 일부는 마크업 인라인 처리기(`onclick="toggleRecordArchive()"` · `"exportRecordsCsv()"`)가 window 이름으로 부른다.
- 2차 대상 19개는 IIFE 안 남은 코드(로드 중 문·남은 함수 `openProTemplateRecordModal` 등)가 아직 맨이름으로 쓰는 이름이라 가져오기 줄은 남긴다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 중계선을 걷어 낸다. 이름과 값은 그대로, 내주는 길만 등록 기관 하나로 줄인다.
- **원인**: 함수는 세포로 옮겨졌지만 index.html 이 다시 끌어와 통로와 window 로 내주는 줄이 남았다.
- **중심**: 생성기 unwire 한 번, 설정 `reports/TASK-ES-626/proof.json` 의 `unwire` 배열 두 칸.
- **핵심**: 지운 뒤에도 이름 하나하나가 같은 값으로 나가는지를 이름 전수 대조로 잰다 — 화면 조작이 닿는 이름은 일부뿐이다.

## 3. [원칙 ③] 해결 방식

1. `node docs/design/harness/module-split/unwire-run.js apply . --task TASK-ES-626 --runs _recordsKit:1,_recordsKit:2` — 계획의 이름 그대로(멈춘 이름 0).
2. `node scripts/module-guard.js --update`.
3. 시나리오 둘 — (가) 게스트 여섯 탭 (나) 기록 탭: 목록 구획이 보임 → 검색칸에 글자 입력(인라인 덩어리의 입력 처리기가 `renderRecordsScreen` 을 다시 부르고, 그 안에서 `filterRecordsByQuery`·`renderRecordThemeFilters` 등을 통로로 읽는다) → 요약 띠를 눌러 통계 구획으로 전환(`setRecordsSegment`) → 다른 탭에 다녀와도 통계 구획 유지(`renderRecordsScreen` 의 구획 복원).
4. `unwire-run.js measure` · `claims` — 선례와 같다. 실행기 사용법은 docs/specs/REQ-TASK-ES-624-UNWIRE-UI.md 3절.

## 4. [원칙 ④] 재검토 (반례·부작용)

- **지운 이름이 사라지지 않는가** → 철거 전 이름 목록(통로 423 · window 199)으로 대조: 통로에서 사라진 이름 0, 지운 통로 이름 59개 중 59개·지운 window 이름 19개 중 19개가 철거 뒤에도 있고, 이름별 값 지문 차이 0.
- **인라인 처리기가 부르는 window 이름**(`toggleRecordArchive`·`exportRecordsCsv`) → window 값 지문 같음. 화면에서 누르는 시나리오에는 넣지 않았다 — `toggleRecordArchive` 는 누르면 2.2초 뒤 사라지는 토스트를 띄워, 법정이 기준을 두 번 돌려 화면을 맞댈 때 시점에 따라 달라질 수 있다(#896 REQ 6절과 같은 판단). `exportRecordsCsv` 는 파일 내려받기라 화면 단언이 없다.
- **`GeminiQuotaDispatcher`·`PREMIUM_FEEDBACK_CATALOG`·`TREND_METRICS` 같은 값 이름** → 등록 기관은 등록 때의 객체를 내준다(같은 객체 참조). 지문(종류) 같음, 대조(`===`) 불일치 0.
- **2차 이름의 가져오기 줄** → 2차 실행의 가져오기 삭제 0줄. 게스트 부팅 예외 0.
- **허용 종류 밖의 줄** → 실행마다 지운 줄이 전부 세 종류에 든다(밖 0). 확장 종류(X1·X2·X3) 사용 0.

## 5. [원칙 ⑤] 절차

1. origin/main(9d039044) 기준 worktree · 번호 선점.
2. `apply`(두 실행) → 지운 이름·줄 확인.
3. 시나리오 후보를 기준·작업에서 시험 → 기준에서 닿는 것만 남김.
4. `module-guard --update` → npm test 기준/작업 전경 실행 → `measure` → `claims`.
5. `verify-integrity-gate` → 커밋 → 로컬 법정 전체 실행과 `recomputeSplit` 직접 호출(실제 커밋 대상) → origin/main 확인 → push → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「기록 탭이 비어 있는 게스트로는 기록 키트를 잴 수 없다」** → 화면으로 닿는 범위가 좁은 것은 사실이다(게스트는 기록 0건이라 카드·히트맵 내용이 그려지지 않는다). 그래서 중심 증거를 화면이 아니라 이름 전수 대조와 값 지문에 두었고, 화면 시나리오는 「부팅·기록 탭 그리기·구획 전환·검색 다시 그리기가 예외 없이 같게 돈다」를 잰다. 기록이 있는 계정에서의 화면은 측정불가로 적는다.
- **반론 2 「검색 입력 단계는 결과가 같아(빈 목록) 의미가 없다」** → 결과 화면은 같지만 그 사이에 `renderRecordsScreen` 이 다시 돌며 지운 이름들을 통로로 읽는다. 이름이 빠졌다면 예외가 나고 `noExceptions` 가 잡는다. 빈 목록 안내가 「입력 전에도 보인다」는 것을 단계로 따로 넣어, 입력이 화면을 바꾼 것처럼 꾸미지 않았다.
- **재검증**: 시나리오 후보 가운데 체크인 입력칸의 글자 수 표시는 기준 트리에서도 단언이 성립하지 않아 뺐다(단언을 약하게 고쳐 넣지 않았다).
- **재검증**: 계획 파일의 이름이 현재 main(설정·목표·공용 키트 철거 뒤)에서도 통하는지 생성기를 실제로 돌려 확인했다(멈춘 이름 0 · 삭제 143줄 = 계획의 예상 115 + 28).

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-626/` 아래. 수치는 `measurement.json` 이 각 결과 파일에서 읽어 모은 것이다(L002).

| 파일 | 무엇 |
|---|---|
| `proof.json` | 생성기 설정: `unwire` 배열 2칸 — `_recordsKit` 세 종류 51개 · `_recordsKit` imports:false 19개 · cells `js/core/cell-registry.js` |
| `unwire-meta.json` | 실행별 생성기 산출: ① 115줄(가져오기 51 · 속성 42 · window 16) ② 28줄(속성 19 · window 3) — 합 143줄 · 쉼표 3 · index.html 5753 → 5610줄 |
| `cell-registry-compare.before.json` · `cell-registry-compare.json` | 대조: 불일치 0 · 통로에서 사라진 이름 0 · 예외 0 · own 438 |
| `scenario-local.json` | 시나리오 2개 기준·작업 통과(비공허 단언 13 · 10), 예외 0/0 |
| `module-load.json` | 새 회귀 0 |
| `npm-test-compare.json` · `raw/` | npm test 기준/작업 종료 코드 0/0 · ✓ 줄·ok 줄 수와 요약 비교(값은 측정 기록) |
| `measurement.json` | 위 전부 + 제품 파일 = index.html 하나 · 되짚기 결과 == 작업 index.html · inlineScriptLines 3483 → 3340(−143) · 기준선 마지막 기록 = 측정값 · module-guard 종료 0 |
| `claims.json` | 주장(보존 2 + 기록 17) |
| `court-local.json` | 로컬 법정 전체 실행 요약(작업자 PC — 판정 아님) |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: main 이 움직이면(지도 갱신 PR) 합친 뒤 npm test·측정·로컬 법정을 다시 돌린다 — ✓ 줄·ok 줄 수까지 다시 센다.
- **예상**: 로컬 법정 실행이 도중에 끊길 수 있다(#896 에서 한 번 — 「심사 못 함 — 실행 중 종료」). 끊기면 요약을 쓰지 않고 다시 돌린다.
- **측정불가**: 기록이 있는 계정에서의 기록 탭 화면(카드·히트맵·주간 리캡·내보내기) · 로그인 뒤 동작 · 운영 환경.
- **성과 측정**: inlineScriptLines 3483 → 3340(−143, 출처 `measurement.json` `summary.inlineScriptLines`). #891·#894·#896 과 합쳐 4003 → 3340.
