# REQ — 미분화 덩어리 해체 B4: 목표 키트(_goalsKit) 배선 철거 1차·2차 + 설정 키트(_settingsKit) 2차

- Task ID: **TASK-ES-622** (L012: 오케스트레이터가 번호를 배정했고, `gh pr list --state all` · `git ls-remote origin` 에서 622 가 비어 있음을 다시 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-622-unwire-goals` 를 먼저 push 해 선점했다. 620 은 시험지 수정, 621 은 생성 지도 갱신이 쓴다.)
- 상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」
- 지시함(origin/main): **DIR-003**(「키트별 철거: settings → goals → ui → …」 · 「철거 PR 마다 module-baseline.json 에 inlineScriptLines 를 기록한다. 숫자가 줄지 않은 철거 PR 은 실패다」) · **DIR-004**((가) 생성기 줄 종류 닫힌 목록 · (다) 시험이 글자로 붙잡는 연결선 이름은 남긴다).
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준에 가까운 탐색 — 「배선 철거」 둘째 사례**. 작업참고(기준 PR #890, 919b1a49)에는 아직 이 유형의 경험칙이 없지만, 첫 사례 #891(TASK-ES-618, 판정 「통과」·R1 동작 보존 확인)의 절차와 실행기를 그대로 따른다. 다른 점은 하나 — 한 설정에 **여러 실행**(생성기 확장 #892, TASK-ES-619)을 처음 쓴다. 그래서 실행기를 여러 실행에 맞게 넓히고, 「실행을 차례로 되짚어 기준에서 작업 index.html 을 다시 만든다」는 검증을 더했다.
- 착수 기준 main 83272f53(#891 설정 1차 철거 · #892 생성기 unwire 확장 병합) · push 전 합친 main 90883cac(#893 생성 지도 갱신 — 두 커밋 사이 `index.html`·`js/**`·`scripts/**`·`tests/**`·`court/**`·기준선·도구 차이 0, 합친 뒤 npm test·측정·로컬 법정을 다시 돌렸다).
- 설계 정본: docs/architecture/CELL-REGISTRY-DESIGN.md 3.1·3.2·4절·5절(U1~U3 · 여러 실행)·6.2 순서 2. 철거 계획 입력: `reports/TASK-ES-614/unwire-plan.json`.
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

| ID | 지시 | 출처 | 완료 기준 |
|---|---|---|---|
| R1 | index.html 인라인 IIFE 에서 배선 세 실행을 생성기 unwire 로 지우고 앱 동작을 보존한다(손 편집 0): ① `_goalsKit` 1차(가져오기·getter·window) ② `_goalsKit` 2차(가져오기 줄은 남기고 getter·window) ③ `_settingsKit` 2차(#891 이 남긴 8개) | DIR-003 「키트별 철거: goals」 · 오케스트레이터 지시 | 목표 탭·설정 탭 조작 시나리오와 게스트 여섯 탭 시나리오가 기준·작업 양쪽에서 통과 · 법정의 생성기 재실행 결과와 index.html 이 바이트 동일 |
| R2 | 지운 이름은 등록 기관(own)이 같은 값으로 내준다 | 설계 3.1·3.2 | 철거 전 이름 목록으로 대조해 불일치 0 · 통로에서 사라진 이름 0 · 이름별 값 지문 차이 0 |
| R3 | 지우는 대상은 설정이 허용한 줄 종류(U1~U3)뿐 · names 밖 이름·함수 본문·그 밖의 글자 불변 · 바뀐 제품 파일은 index.html 하나 | DIR-003·DIR-004 (가) · 설계 5.1 | 실행을 차례로 되짚어 만든 결과 == 작업 index.html · 허용 종류 밖 삭제 줄 0 |
| R4 | 증명 하한과 기준선 기록 | 설계 4절 「배선 철거」 · DIR-003 | inlineScriptLines 감소와 `module-guard --update` 기록 · 모듈 로드 새 회귀 0 · npm test 동일·폐기 0 · tests/·금고·생성기·등록 기관 변경 0 |

원문에 있는데 이 PR 에 없는 것(목표 줄에 남긴다): 「남은 미분화작업 모두」 — 시험이 배선 글자를 붙잡는 이름(시험지 수정 #TASK-ES-620 뒤), 나머지 키트(_uiKit·_recordsKit·_commKit·_calendarKit·기타), 손잡이 줄(X2)은 다음 PR 들이다.

### 구체 식별자

- 고친 제품 파일: `index.html` 하나 — 인라인 IIFE 의 `var X = _goalsKit.X;` 75줄 · `window.OurgoalAppScope.expose('index.html', { get X(){ return X; }, … })` 속성 73줄(빈 껍데기 3문) · `window.X = X;` 42줄(빈 if 블록 껍데기 1개) · 쉼표 12글자(생성기 산출 그대로)
- 고친 도구(제품 코드 아님): `docs/design/harness/module-split/unwire-run.js` — `apply --runs <손잡이:차수,…>`(한 설정에 여러 실행) · `measure` 가 실행을 차례로 되짚음 · X2·X3 기록(손잡이 줄·한 줄 안 삭제)도 읽음
- 기록: `docs/architecture/module-baseline.json`(`node scripts/module-guard.js --update` 가 51번째 항목을 더함) · `docs/rules/TICKETS.md` · `reports/TASK-ES-622/`
- 손대지 않은 것: `js/**` 전부 · `gen-inline-hard.js`·`gen-cell-provide.js` · tests/ · 금고 · 그 밖의 생성 지도(L009)
- 화면 식별자(시나리오): `.navbtn[data-tab=…]` · `#btnGoalsSubPersonal`·`#btnGoalsSubRoutine`·`#btnGoalsSubTemplate`·`#btnGoalsSubStats`(onclick=`switchGoalsSubTab`) · `#btnGoalPeriodWeek`·`#btnGoalPeriodMonth`(onclick=`switchGoalStatPeriod`) · `#setGroupDataSummary` · `#advancedSettingsSummary` · `#settingsCustomFeedbackBtn` · `#fbSetupBack`(`closeFeedbackSetup`)
- 지운 이름 96개의 목록은 `reports/TASK-ES-622/proof.json` `unwire[0..2].names`(예: `switchGoalsSubTab` · `switchGoalStatPeriod` · `renderRoutineGoalsScreen` · `renderTemplateEncyclopediaScreen` · `renderGoalsScreen` · `openTemplateEncyclopediaModal` · `closeFeedbackSetup` · `performLogout`)

## 1. [원칙 ①] 문제를 정확히 파악한다

- #891 뒤 index.html 인라인 줄 수는 3,860(module-metrics, 기준 83272f53)이다. 그 가운데 목표 키트의 배선이 가장 크다(계획상 1차 169줄 · 2차 19줄).
- #891 은 설정 키트 1차만 지웠다 — 당시 생성기는 PR 하나에 실행 하나만 받았다. #892 로 한 설정에 여러 실행을 차례로 적용할 수 있게 됐으므로, 이 PR 은 목표 키트 1차·2차와 설정 키트 2차를 한 설정으로 지운다.
- 2차 대상은 IIFE 안 남은 코드(로드 중 호출·남은 함수)가 아직 맨이름으로 쓰는 이름이다. 가져오기 줄은 지울 수 없고(지우면 ReferenceError), 통로 getter 줄과 window 대입 줄만 지운다 — 그 두 줄은 등록 기관이 같은 값으로 대신 내준다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 중계선을 걷어 낸다. 이름과 값은 그대로, 내주는 길만 등록 기관 하나로 줄인다(#891 과 같다).
- **원인**: 함수는 세포로 옮겨졌지만 index.html 이 다시 이어 주는 줄이 남아 덩어리가 줄지 않았다.
- **중심**: 생성기 unwire 한 번, 설정 `reports/TASK-ES-622/proof.json` 의 `unwire` 배열 세 칸. 앞 실행이 지운 결과를 다시 파싱해 다음 실행이 돈다.
- **핵심**: 여러 실행이어도 지우는 줄 종류는 그대로 세 종류다. 「한 PR 에 많이 지운다」가 「검증을 덜 한다」가 되지 않게, 실행마다 지운 줄을 종류로 가르고(밖 0), 실행을 차례로 되짚어 기준 index.html 에서 작업 index.html 을 다시 만들어 글자 그대로 같은지 본다.

## 3. [원칙 ③] 해결 방식

1. 실행기 `unwire-run.js apply --runs _goalsKit:1,_goalsKit:2,_settingsKit:2` — 계획 파일에서 실행마다 names 를 읽어 `proof.json`(unwire 배열)을 쓰고 생성기를 돌린다. 생성기가 멈추면 그 실행에서 그 이름만 빼고 다시 돌리며 사유를 남긴다(이번에 멈춘 이름 0 — 계획 96개 그대로).
2. `node scripts/module-guard.js --update` — 낮아진 값만 기준선에 기록.
3. 시나리오 셋 — (가) 게스트 여섯 탭 (나) 목표 탭 하위 탭 다섯 번 전환·통계 기간 전환(인라인 처리기 `switchGoalsSubTab`·`switchGoalStatPeriod` — 둘 다 이번에 window 대입 줄을 지운 이름. 템플릿 하위 탭은 `renderTemplateEncyclopediaScreen`, 루틴은 `renderRoutineGoalsScreen` 을 통로로 부른다) (다) 설정 탭에서 맞춤 피드백 설정 화면 열고 닫기(`closeFeedbackSetup` — 설정 2차 이름).
4. `unwire-run.js measure` · `claims` — #891 과 같다. 대조 탐침의 이름 목록은 철거 전 기준 트리 결과로 고정.

### 실행기 사용법 (다음 키트에서 그대로 쓴다)

```
export NODE_PATH=C:/dev/ourgoal-app/node_modules
node docs/design/harness/module-split/unwire-run.js apply   . --task TASK-ES-6xx --runs _uiKit:1,_uiKit:2
node scripts/module-guard.js --update
(reports/TASK-ES-6xx/scenarios/*.json · reports/TASK-ES-6xx/raw/npm-test.{base,work}.{log,exit} 를 둔다)
node docs/design/harness/module-split/unwire-run.js measure . --task TASK-ES-6xx --base <origin/main 임시 worktree>
node docs/design/harness/module-split/unwire-run.js claims  . --task TASK-ES-6xx --req docs/specs/REQ-TASK-ES-6xx-….md
```

실행 = `<손잡이 이름>:<차수>[:옵션+옵션]`. 차수 1 = 세 종류 모두, 2 = 가져오기 줄은 남김. 옵션 `shared`(X3 — 한 줄을 나눠 쓰는 window 대입) · `dropkit`(X2 — 손잡이 줄)은 설정에 그 칸을 넣을 뿐이고, 쓸지는 그 PR 이 정한다. 이 PR 은 둘 다 쓰지 않았다.

## 4. [원칙 ④] 재검토 (반례·부작용)

- **지운 이름이 사라지지 않는가** → 철거 전 이름 목록(통로 423 · window 199)으로 대조: 통로에서 사라진 이름 0, 지운 통로 이름 70개 중 70개·지운 window 이름 42개 중 42개가 철거 뒤에도 있고, 이름별 값 지문 차이 0.
- **2차 이름의 가져오기 줄이 실수로 지워지지 않았는가** → 2차 두 실행의 가져오기 삭제 0줄(`unwire-meta.json` runs[1]·runs[2] `removed.imports`). 게스트 부팅 예외 0.
- **여러 실행의 줄 번호가 실행마다 밀린다** → 측정이 실행 순서대로 되짚는다: 실행 n 의 줄 번호는 실행 n−1 까지 반영한 글자에 적용한다. 실행마다 「되짚기 직전 줄 수 == 생성기가 적은 htmlLinesBefore」도 확인한다(전부 참).
- **허용 종류 밖의 줄** → 실행마다 지운 줄 번호가 전부 가져오기 줄·expose 속성 줄(과 빈 껍데기)·window 대입 줄(과 빈 블록 껍데기)에 든다(밖 0). 확장 종류(X1·X2·X3) 사용 0.
- **window 대입 시점이 달라진다**(IIFE 중간 → IIFE 바로 앞 commit) → 이번에 window 줄을 지운 42개의 window 값 지문이 철거 전후 같다.
- **`isMockGroup`·`groupState` 같은 값·상태성 이름** → 등록 기관은 등록 때의 값을 내준다. 다시 대입되는 이름이면 어긋난다 — 지문 차이 0, 그리고 생성기가 가져오기 줄을 지운 이름에 대입이 남으면 멈춘다(통과).
- **기준선 파일 충돌** → 철거 PR 은 한 번에 하나다. main 이 움직이면 `apply` 와 `module-guard --update` 를 다시 돌린다.

## 5. [원칙 ⑤] 절차

1. origin/main(83272f53) 기준 worktree · 번호 선점 → 확장된 생성기의 여러 실행 기록 형식 확인.
2. 실행기를 여러 실행에 맞게 넓힘 → `apply`(세 실행) → 지운 이름·줄 확인.
3. 시나리오 작성 → 기준·작업 로컬 실행(기준에서 닿지 않는 조작은 버리고 닿는 조작으로 바꿈).
4. `module-guard --update` → npm test 기준/작업 전경 실행 → `measure` → `claims`.
5. `verify-integrity-gate` → 커밋 → 로컬 법정 전체 실행과 `recomputeSplit` 직접 호출(실제 커밋 대상) → origin/main 확인 → push → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「세 실행을 한 PR 에 넣으면 문제가 났을 때 어느 실행 탓인지 모른다」** → 실행별 기록(`unwire-meta.json` runs)이 지운 줄·이름을 실행마다 따로 갖고, 설정에서 그 칸만 빼고 `apply` 를 다시 돌리면 그 실행만 뺀 결과가 나온다. 판정이 돌려보내면 실행 단위로 줄여 다시 낸다. 반대로 실행마다 PR 을 나누면 계획 전체가 16 PR 이 되어 병합 사이마다 충돌 재생성이 든다.
- **반론 2 「설정 2차는 설정 PR 에 있어야 한다」** → #891 당시에는 생성기가 한 실행만 받아 넣을 수 없었다. 지금 넣지 않으면 8개 이름을 위해 PR 이 하나 더 든다. 키트가 달라도 줄 종류와 검증은 같고, 실행별 기록이 구분한다.
- **재검증**: 계획 파일은 #889 시점에서 만든 것이다. 지금 main(83272f53 — 설정 1차가 이미 지워진 뒤)에서 생성기를 실제로 돌려 96개가 전부 통하는지 확인했다(멈춘 이름 0 · 삭제 198줄 = 계획의 예상 169 + 19 + 10).
- **재검증**: 처음 쓴 시나리오 둘(템플릿 백과사전 창·앱 평가 창)은 기준 트리에서도 버튼이 보이지 않아 실패했다(게스트 화면에서 숨은 진입로). 단언을 약하게 하지 않고, 기준에서 실제로 닿는 조작(템플릿 하위 탭·맞춤 피드백 설정 화면)으로 바꿨다.

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-622/` 아래. 수치는 `measurement.json` 이 각 결과 파일에서 읽어 모은 것이다(L002 — 전체 수치는 이 PR 소유 파일을 가리킨다).

| 파일 | 무엇 |
|---|---|
| `proof.json` | 생성기 설정(법정이 기준 커밋에서 다시 돌린다): `unwire` 배열 3칸 — `_goalsKit` 세 종류 75개 · `_goalsKit` imports:false 13개 · `_settingsKit` imports:false 8개 · cells `js/core/cell-registry.js` |
| `unwire-meta.json` | 실행별 생성기 산출: ① 삭제 169줄(가져오기 75 · 속성 59 · window 29) ② 19줄(속성 10 · window 7) ③ 10줄(속성 4 · window 6) — 합 198줄 · 쉼표 12 · index.html 6130 → 5932줄 · 계획에서 뺀 이름 0 |
| `cell-registry-compare.before.json` · `cell-registry-compare.json` | 대조: 불일치 0 · 통로에서 사라진 이름 0 · 예외 0 · own 438 |
| `scenario-local.json` | 시나리오 3개 기준·작업 통과(비공허 단언 13 · 12 · 3), 예외 0/0 |
| `module-load.json` | 새 회귀 0 |
| `npm-test-compare.json` · `raw/` | npm test 기준/작업 종료 코드 0/0 · ✓ 487/487 · ok 156/156 · 요약 동일 |
| `measurement.json` | 위 전부 + 제품 파일 = index.html 하나 · 되짚기 결과 == 작업 index.html · inlineScriptLines 3860 → 3662(−198) · 기준선 마지막 기록 = 측정값 · module-guard 종료 0 |
| `claims.json` | 주장(보존 3 + 기록 17) |
| `court-local.json` | 로컬 법정 전체 실행 요약(작업자 PC — 판정 아님) |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: 법정의 생성기 재실행이 배열 설정에서 어긋날 수 있다(첫 사용) → push 전에 `recomputeSplit` 을 실제 커밋 대상으로 직접 부르고 로컬 법정 전체를 돌린다.
- **예상**: 보존 주장 셋 가운데 하나라도 기준 2회의 DOM 이 서로 다르면 「확인 못 함」이 된다 → 로컬 법정 전체 실행에서 셋 다 확인한다.
- **측정불가**: 로그인 뒤 화면에서의 동작(팀 목표·초대·응원 등 목표 키트의 많은 이름은 로그인 뒤 경로다 — 이름과 값의 동일성은 게스트 부팅 뒤 전수 대조로 쟀다) · 운영 환경.
- **성과 측정**: inlineScriptLines 3860 → 3662(−198, 출처 `measurement.json` `summary.inlineScriptLines`). #891 과 합쳐 4003 → 3662.
