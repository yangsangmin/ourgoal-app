# REQ — 미분화 덩어리 해체 B5: 공용 키트(_uiKit) 배선 철거 1차·2차 + `_ui` 손잡이(X1)

- Task ID: **TASK-ES-624** (L012: 오케스트레이터가 번호를 배정했고, `gh pr list --state all --limit 40` · `git ls-remote origin` 에서 624 가 비어 있음을 다시 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-624-unwire-ui` 를 먼저 push 해 선점했다.)
- 상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」
- 지시함(origin/main): **DIR-003**(「키트별 철거: settings → goals → ui → …」 · 철거 PR 마다 기준선에 inlineScriptLines 기록 — 줄지 않으면 실패) · **DIR-004**((가) 생성기 줄 종류 닫힌 목록 — U1~U3 과 X1~X9 · (다) 시험이 글자로 붙잡는 연결선 이름은 남긴다).
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준 — 「배선 철거」 셋째 사례**. 작업참고(기준 PR #893, 90883cac). 선례 #891(TASK-ES-618)·#894(TASK-ES-622, 여러 실행) 둘 다 판정 「통과」·R1 동작 보존 확인이고, 그 절차와 실행기를 그대로 따른다. 새로운 점은 하나 — 확장 종류 **X1**(이름이 `_xxxKit` 꼴이 아닌 손잡이 `_ui` 의 가져오기 줄)을 처음 실제로 쓴다. 그래서 push 전에 법정의 생성기 재실행 대조와 로컬 법정 전체를 실제 커밋 대상으로 돌려 확인한다.
- 착수 기준 main 357ccc93(#894 병합) · push 전 합친 main 4134955f(#895 생성 지도 갱신 — 두 커밋 사이 `index.html`·`js/**`·`scripts/**`·`tests/**`·`court/**`·기준선·도구 차이 0, 합친 뒤 npm test·측정·로컬 법정을 다시 돌렸다).
- 설계 정본: docs/architecture/CELL-REGISTRY-DESIGN.md 3.1·3.2·4절·5.1(U1~U3)·5.2(X1)·6.2. 철거 계획 입력: `reports/TASK-ES-614/unwire-plan.json`. 생성기 확장 사양: docs/specs/REQ-TASK-ES-619-GEN-UNWIRE-EXT.md.
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

| ID | 지시 | 출처 | 완료 기준 |
|---|---|---|---|
| R1 | index.html 인라인 IIFE 에서 배선 네 실행을 생성기 unwire 로 지우고 앱 동작을 보존한다(손 편집 0): ① `_uiKit` 1차 ② `_uiKit` 2차(가져오기 줄은 남김) ③ `_ui` 1차(`download`) ④ `_ui` 2차(`escapeHtml` — 가져오기 줄은 남김) | DIR-003 「키트별 철거: ui」 · 오케스트레이터 지시 | 공용 부품이 불리는 조작 시나리오와 게스트 여섯 탭 시나리오가 기준·작업 양쪽에서 통과 · 법정의 생성기 재실행 결과와 index.html 이 바이트 동일 |
| R2 | 지운 이름은 등록 기관(own)이 같은 값으로 내준다 | 설계 3.1·3.2 | 철거 전 이름 목록으로 대조해 불일치 0 · 통로에서 사라진 이름 0 · 이름별 값 지문 차이 0 |
| R3 | 지우는 대상은 설정이 허용한 줄 종류(U1~U3, 손잡이 꼴은 X1)뿐 · names 밖 이름·함수 본문·그 밖의 글자 불변 · 바뀐 제품 파일은 index.html 하나 | DIR-004 (가) · 설계 5절 | 실행을 차례로 되짚어 만든 결과 == 작업 index.html · 허용 종류 밖 삭제 줄 0 |
| R4 | 증명 하한과 기준선 기록 | 설계 4절 「배선 철거」 · DIR-003 | inlineScriptLines 감소와 `module-guard --update` 기록 · 모듈 로드 새 회귀 0 · npm test 동일·폐기 0 · tests/·금고·생성기·등록 기관 변경 0 |

원문에 있는데 이 PR 에 없는 것(목표 줄에 남긴다): 「남은 미분화작업 모두」 — 시험이 배선 글자를 붙잡는 이름(`openModal`·`showToast`·`getKSTDateKey` 등), 한 줄을 나눠 쓰는 window 대입(X3 — `defaultProfile`·`loadProfile`·`saveProfile`·`setTab`), 손잡이 줄(X2), 나머지 키트는 다음 PR 들이다. X3·X2 는 이번에 쓰지 않았다.

### 구체 식별자

- 고친 제품 파일: `index.html` 하나 — 인라인 IIFE 의 `var X = _uiKit.X;` 56줄 · `var download = _ui.download;` 1줄 · `OurgoalAppScope.expose('index.html', { get X(){ return X; }, … })` 속성 78줄(빈 껍데기 5문) · `window.X = X;` 22줄(빈 if 블록 껍데기 6개) · 쉼표 8글자(생성기 산출 그대로)
- 고친 도구(제품 코드 아님): `docs/design/harness/module-split/unwire-run.js` — 계획 당시 생성기가 못 돌리던 손잡이(`_ui`·`_xp`)의 이름을 계획의 `notRunnableKitVars` 에서 읽음 · `--names-for <손잡이:차수>=이름+이름` 으로 실행의 이름을 손으로 지정
- 기록: `docs/architecture/module-baseline.json`(`node scripts/module-guard.js --update` 가 52번째 항목을 더함) · `docs/rules/TICKETS.md` · `reports/TASK-ES-624/`
- 손대지 않은 것: `js/**` 전부 · `gen-inline-hard.js`·`gen-cell-provide.js` · tests/ · 금고 · 그 밖의 생성 지도(L009)
- 화면 식별자(시나리오): `.navbtn[data-tab=…]` · `#sanctuaryBellBtn`(onclick=`window.openNotificationCenterModal`) · `#closeNotifCenterBtn`(통로 `closeModal`)
- 지운 이름 77개의 목록은 `reports/TASK-ES-624/proof.json` `unwire[0..3].names`(예: `toast` · `closeModal` · `escapeHtml` · `download` · `openNotificationCenterModal` · `openBottomSheetConfirm` · `updateTopBar` · `dateKey` · `nowISO` · `uid` · `pad` · `renderAll`)

## 1. [원칙 ①] 문제를 정확히 파악한다

- #894 뒤 index.html 인라인 줄 수는 3,662(module-metrics, 기준 357ccc93)다. 남은 배선 가운데 공용 키트(`OurgoalUiHelpers` — 손잡이 `_uiKit` 과 `_ui` 둘이 같은 객체를 가리킨다)의 몫이 가장 크다.
- 공용 키트의 이름은 `escapeHtml`·`toast`·`closeModal`·날짜 도우미처럼 거의 모든 세포가 통로(`L.이름`)로 읽는다. 지운 뒤에도 이름 하나라도 빠지면 그 세포가 부르는 순간 오류가 난다 — 화면 몇 개를 눌러 보는 것으로는 다 잴 수 없으므로 이름 전수 대조가 중심 증거다.
- `_ui` 손잡이는 이름이 `_xxxKit` 꼴이 아니라 #891·#894 때의 설정으로는 돌릴 수 없었다. #892 의 X1 로 이제 돌 수 있다. 이 손잡이에서 가져오는 등록된 이름은 둘이다 — `download`(IIFE 안 참조 0)와 `escapeHtml`(IIFE 안 남은 코드가 19곳에서 맨이름으로 씀 — 생성기 정지 메시지 실측).

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 중계선을 걷어 낸다. 이름과 값은 그대로, 내주는 길만 등록 기관 하나로 줄인다(#891·#894 와 같다).
- **원인**: 공용 함수는 세포로 옮겨졌지만 index.html 이 그것을 다시 끌어와 통로와 window 로 내주는 줄이 남았다.
- **중심**: 생성기 unwire 한 번, 설정 `reports/TASK-ES-624/proof.json` 의 `unwire` 배열 네 칸.
- **핵심**: X1 은 줄 종류를 넓히지 않는다 — 지우는 것은 여전히 「손잡이에서 이름을 끌어오는 가져오기 줄」이고, 손잡이의 이름꼴 제한만 푼 것이다(설계 5.2). `escapeHtml` 처럼 IIFE 가 아직 쓰는 이름은 가져오기 줄을 남기고 getter 줄만 지운다.

## 3. [원칙 ③] 해결 방식

1. `unwire-run.js apply --runs _uiKit:1,_uiKit:2,_ui:1,_ui:2 --names-for _ui:1=download,_ui:2=escapeHtml`. 먼저 `_ui:1` 에 두 이름을 모두 주고 돌려 생성기가 `escapeHtml` 에서 멈추는 것을 확인했고(잔존 참조 19곳), 그 이름을 2차(가져오기 줄 남김)로 돌렸다. `_uiKit` 두 실행은 계획의 이름 그대로다(멈춘 이름 0).
2. `node scripts/module-guard.js --update` — 낮아진 값만 기준선에 기록.
3. 시나리오 둘 — (가) 게스트 여섯 탭(탭마다 화면을 다시 그리며 `escapeHtml`·날짜 도우미·`renderAll` 등을 통로로 부른다) (나) 홈의 종 버튼으로 알림 센터 창 열기(인라인 처리기 `window.openNotificationCenterModal` — 이번에 window 대입 줄을 지운 이름)와 닫기(통로 `closeModal` — 이번에 getter·window 줄을 지운 이름)를 두 번.
4. `unwire-run.js measure` · `claims` — 선례와 같다. 대조 탐침의 이름 목록은 철거 전 기준 트리 결과로 고정.

### 실행기 사용법 (다음 키트에서 그대로 쓴다)

```
export NODE_PATH=C:/dev/ourgoal-app/node_modules
node docs/design/harness/module-split/unwire-run.js apply   . --task TASK-ES-6xx --runs _recordsKit:1,_recordsKit:2
node scripts/module-guard.js --update
(reports/TASK-ES-6xx/scenarios/*.json · reports/TASK-ES-6xx/raw/npm-test.{base,work}.{log,exit} 를 둔다)
node docs/design/harness/module-split/unwire-run.js measure . --task TASK-ES-6xx --base <origin/main 임시 worktree>
node docs/design/harness/module-split/unwire-run.js claims  . --task TASK-ES-6xx --req docs/specs/REQ-TASK-ES-6xx-….md
```

`_xp` 처럼 계획에 실행이 없는 손잡이는 `--runs …,_xp:1` 로 주면 계획의 등록된 이름 전부로 돌고, 생성기가 멈춘 이름은 빠지며 사유가 남는다. 그 이름을 `--names-for _xp:2=이름+이름` 으로 2차에 돌린다.

## 4. [원칙 ④] 재검토 (반례·부작용)

- **지운 이름이 사라지지 않는가** → 철거 전 이름 목록(통로 423 · window 199)으로 대조: 통로에서 사라진 이름 0, 지운 통로 이름 70개 중 70개·지운 window 이름 21개 중 21개가 철거 뒤에도 있고, 이름별 값 지문 차이 0.
- **`toast` 는 요소 id 와 이름이 같다**(`<div id="toast">` — #889 에서 commit 시점에 window.toast 가 그 요소였음을 쟀다). 지금까지는 IIFE 의 `window.toast = toast` 가 요소 이름을 덮었고, 이제는 commit 이 덮는다. window 값 지문이 철거 전후 같다(함수).
- **`closeModal` 은 IIFE 뒤 인라인 스크립트(전역 ESC 처리기)가 맨이름으로 부른다** — window 에 있어야 한다. 철거 뒤 window 지문 같음 + 알림 센터 닫기 시나리오 통과.
- **2차 이름의 가져오기 줄이 지워지지 않았는가** → 2차 두 실행의 가져오기 삭제 0줄. 게스트 부팅 예외 0.
- **`_ui` 와 `_uiKit` 이 같은 객체다** → 서로 다른 손잡이 변수라 실행을 나눴다. 가져오기 줄은 그 줄의 손잡이로만 맞는다(생성기 U1 정지 조건).
- **허용 종류 밖의 줄** → 실행마다 지운 줄이 전부 가져오기 줄·expose 속성 줄(과 빈 껍데기)·window 대입 줄(과 빈 블록 껍데기)에 든다(밖 0). X3·X2 사용 0.
- **시험이 붙잡는 이름** → 계획이 이미 뺐다. npm test 기준/작업 동일.

## 5. [원칙 ⑤] 절차

1. origin/main(357ccc93) 기준 worktree · 번호 선점.
2. 실행기에 손잡이 이름 출처 두 가지를 더함 → `apply`(먼저 세 실행으로 `_ui` 의 멈춤 확인 → 네 실행으로 확정).
3. 시나리오 작성 → 기준·작업 로컬 실행(상단 종 버튼은 기준에서도 누를 수 없어 홈의 종 버튼으로 바꿈).
4. `module-guard --update` → npm test 기준/작업 전경 실행 → `measure` → `claims`.
5. `verify-integrity-gate` → 커밋 → 로컬 법정 전체 실행과 `recomputeSplit` 직접 호출(실제 커밋 대상) → origin/main 확인 → push → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「공용 키트는 위험하니 이름을 나눠 여러 PR 로 지워야 한다」** → 위험은 이름 수가 아니라 「지운 이름이 같은 값으로 나가는가」다. 그것은 이름 전수 대조(불일치 0·지문 차이 0)가 잰다. PR 을 나누면 같은 검증을 여러 번 하고 그 사이 병합마다 충돌 재생성이 든다. 문제가 나면 실행 단위로 줄여 다시 낼 수 있다(실행별 기록).
- **반론 2 「`escapeHtml` 은 19곳이 쓰니 건드리지 말아야 한다」** → 지운 것은 통로 getter 한 줄뿐이고, IIFE 의 맨이름 참조가 기대는 가져오기 줄은 그대로다. 통로의 `escapeHtml` 은 등록 기관이 같은 함수로 내준다(지문 같음).
- **재검증**: X1 첫 실사용 — 법정의 생성기 재실행이 `_ui` 실행을 그대로 재현하는지 `recomputeSplit` 을 실제 커밋 대상으로 직접 불러 확인한다(7절).
- **재검증**: 토스트가 뜨는 조작은 보존 주장에 넣지 않았다. 토스트는 2.2초 뒤 사라져, 법정이 기준을 두 번 돌려 화면을 맞댈 때 시점에 따라 달라질 수 있다(기준 2회 불일치 → 「확인 못 함」). `toast` 는 이름 대조와 지문으로 쟀다. 단언을 약하게 한 것이 아니라 흔들리는 단계를 넣지 않은 것이다.

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-624/` 아래. 수치는 `measurement.json` 이 각 결과 파일에서 읽어 모은 것이다(L002).

| 파일 | 무엇 |
|---|---|
| `proof.json` | 생성기 설정: `unwire` 배열 4칸 — `_uiKit` 세 종류 56개 · `_uiKit` imports:false 19개 · `_ui` 세 종류 1개(`download`) · `_ui` imports:false 1개(`escapeHtml`) · cells `js/core/cell-registry.js` |
| `unwire-meta.json` | 실행별 생성기 산출: ① 142줄(가져오기 56 · 속성 52 · window 16) ② 34줄(속성 24 · window 6) ③ 2줄(가져오기 1 · 속성 1) ④ 1줄(속성 1) — 합 179줄 · 쉼표 8 · index.html 5932 → 5753줄 |
| `cell-registry-compare.before.json` · `cell-registry-compare.json` | 대조: 불일치 0 · 통로에서 사라진 이름 0 · 예외 0 · own 438 |
| `scenario-local.json` | 시나리오 2개 기준·작업 통과(비공허 단언 13 · 5), 예외 0/0 |
| `module-load.json` | 새 회귀 0 |
| `npm-test-compare.json` · `raw/` | npm test 기준/작업 종료 코드 0/0 · ✓ 487/487 · ok 156/156 · 요약 동일 |
| `measurement.json` | 위 전부 + 제품 파일 = index.html 하나 · 되짚기 결과 == 작업 index.html · inlineScriptLines 3662 → 3483(−179) · 기준선 마지막 기록 = 측정값 · module-guard 종료 0 |
| `claims.json` | 주장(보존 2 + 기록 17) |
| `court-local.json` | 로컬 법정 전체 실행 요약(작업자 PC — 판정 아님) |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: X1 실행이 법정의 재실행에서 어긋날 수 있다 → push 전 `recomputeSplit` 직접 호출과 로컬 법정 전체 실행.
- **예상**: 알림 센터 창의 내용이 시각에 따라 달라 기준 2회의 화면이 다를 수 있다 → 로컬 법정 전체 실행에서 확인하고, 어긋나면 그 시나리오를 바꾼다.
- **측정불가**: 로그인 뒤 화면에서의 동작(공용 키트 이름 다수는 로그인 뒤 경로에서도 쓰인다 — 이름과 값의 동일성은 게스트 부팅 뒤 전수 대조로 쟀다) · 토스트가 실제로 뜨는 화면 동작 · 운영 환경.
- **성과 측정**: inlineScriptLines 3662 → 3483(−179, 출처 `measurement.json` `summary.inlineScriptLines`). #891·#894 와 합쳐 4003 → 3483.
