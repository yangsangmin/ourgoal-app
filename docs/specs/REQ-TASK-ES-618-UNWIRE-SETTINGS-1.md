# REQ — 미분화 덩어리 해체 B3: 설정 키트(_settingsKit) 1차 배선 철거

- Task ID: **TASK-ES-618** (L012: 오케스트레이터가 `gh pr list --state all` · `git ls-remote origin` 에서 618 이 비어 있음을 확인했고, 빈 브랜치 `feat/2026-10-11-task-es-618-unwire-settings` 를 먼저 push 해 선점했다. 617 은 생성 지도 갱신, 619 는 생성기 확장이 쓴다.)
- 상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」
- 지시함(origin/main): **DIR-003**(B 트랙 — 「키트별 철거: settings → goals → …」 · 「철거 PR 마다 docs/architecture/module-baseline.json 에 inlineScriptLines 를 기록한다. 숫자가 줄지 않은 철거 PR 은 실패다」) · **DIR-004**(순서 「own 전환 → 키트별 철거 1차 → …」 · (다) 「시험이 글자로 붙잡고 있는 연결선 이름은 지우지 않고 남겨 둔 채 진행한다」).
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(다) 탐색 — 「배선 철거」의 첫 실제 사례**. 작업참고(기준 PR #886, eec662b2)에 이 유형의 표준 절차는 아직 없다. 가장 가까운 것은 세포 분열(CELL_SPLIT, 생성기 재실행 대조 — 선례 #864 TASK-ES-596)이고, 다른 점은 옮기는 글자가 없고 **지우기만** 한다는 것이다. 설계 4절 「배선 철거」 행을 증명 하한으로 삼고, 「지운 이름이 여전히 같은 값으로 나가는가」를 재는 검증을 더했다(7절). 다음 키트들이 표준으로 쓰도록 실행기를 함께 넣는다.
- 착수 기준 main a3bad12a(PR #889 「등록 기관 own 적용」 병합) · push 전 합친 main 919b1a49(#890 생성 지도 갱신 — 두 커밋 사이 `index.html`·`js/**`·`scripts/**`·`tests/**`·기준선 차이 0, 합친 뒤 npm test·측정을 다시 돌렸다). 이 PR 은 #889 의 own 이 있어야 성립한다.
- 설계 정본: docs/architecture/CELL-REGISTRY-DESIGN.md 3.1(own·PR 분리) · 3.2(이름 목록 고정) · 4절(증명 하한) · 5.1(U1~U3 — 처음 허용된 세 종류) · 6.2 순서 2. 철거 계획 입력: `reports/TASK-ES-614/unwire-plan.json`(#889 로 병합).
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

| ID | 지시 | 출처 | 완료 기준 |
|---|---|---|---|
| R1 | index.html 인라인 IIFE 에서 `_settingsKit` 의 가져오기 줄·통로 getter 줄·window 대입 줄을 생성기 unwire 로 지우고 앱 동작을 보존한다(손 편집 0) | DIR-003 「키트별 철거: settings」 · 설계 6.2 순서 2 | 설정 탭 조작 시나리오와 게스트 여섯 탭 시나리오가 기준·작업 양쪽에서 통과 · 법정의 생성기 재실행 결과와 index.html 이 바이트 동일 |
| R2 | 지운 이름은 등록 기관(own)이 같은 값으로 내준다 | 설계 3.1·3.2 | 철거 전 이름 목록으로 대조해 불일치 0 · 통로에서 사라진 이름 0 · 이름별 값 지문 차이 0 |
| R3 | 지우는 대상은 세 종류(U1~U3)뿐 · names 밖 이름·함수 본문·그 밖의 글자 불변 · 바뀐 제품 파일은 index.html 하나 | DIR-003 결심 기록 · 설계 5.1 | 「기준에서 생성기가 적어 낸 줄을 지우고 쉼표를 뗀 결과 == 작업 index.html」 · 세 종류 밖 삭제 줄 0 |
| R4 | 증명 하한과 기준선 기록 | 설계 4절 「배선 철거」 · DIR-003 | inlineScriptLines 감소와 `module-guard --update` 기록 · 모듈 로드 새 회귀 0 · npm test 동일·폐기 0 · tests/·금고·생성기·등록 기관 변경 0 |

원문에 있는데 이 PR 에 없는 것(목표 줄에 남긴다): 「남은 미분화작업 모두」 — 설정 키트 2차(IIFE 안 다른 코드가 아직 쓰는 이름 8개, 가져오기 줄은 남기고 getter·window 줄만)와 시험이 붙잡는 이름, 나머지 키트는 다음 PR 들이다. 2차는 생성기 확장(한 설정에 여러 실행) 병합 뒤에 한다.

### 구체 식별자

- 고친 제품 파일: `index.html` 하나 — 인라인 IIFE(2253행~)의 `var X = _settingsKit.X;` 62줄 · `window.OurgoalAppScope.expose('index.html', { get X(){ return X; }, … })` 속성 46줄과 빈 껍데기 1문 · `window.X = X;` 29줄과 빈 if 블록 껍데기 2개(생성기 산출 그대로)
- 새 도구(제품 코드 아님): `docs/design/harness/module-split/unwire-run.js`(apply · measure · claims)
- 기록: `docs/architecture/module-baseline.json`(`node scripts/module-guard.js --update` 가 50번째 항목을 더함) · `docs/rules/TICKETS.md` · `reports/TASK-ES-618/`
- 손대지 않은 것: `js/**` 전부(`js/core/cell-registry.js` 포함) · `docs/design/harness/module-split/gen-inline-hard.js`·`gen-cell-provide.js` · tests/ · 금고 · 그 밖의 생성 지도(cell-map·inline-script-map — L009)
- 화면 식별자(시나리오): `#btnLandingPreviewDirect` · `#btnAvatarGreetClose` · `.navbtn[data-tab=…]` · `#btnPwaInstallGuide`(onclick=`openPwaInstallGuideModal`) · `#btnPwaOsIos`·`#btnPwaOsAndroid`(onclick=`switchPwaOsTab`) · `#btnClosePwaGuide`(onclick=`closePwaInstallGuideModal`) · `#btnModeMinimal`·`#btnModeGamified`(onclick=`switchUxMode`) — 넷 다 이 PR 이 window 대입 줄을 지운 이름이다
- 지운 이름 62개의 목록은 `reports/TASK-ES-618/proof.json` `unwire.names`(예: `renderSettingsScreen` · `applyTheme` · `openPwaInstallGuideModal` · `switchUxMode` · `killDeviceSession` · `refreshSecurityStatus`)

## 1. [원칙 ①] 문제를 정확히 파악한다

- index.html 인라인 IIFE 4,003줄(module-metrics inlineScriptLines, 기준 a3bad12a) 가운데 큰 부분이 「세포가 키트에 단 함수를 다시 끌어와(`var X = _kit.X`) 통로와 window 로 다시 내주는」 배선이다. #889 로 등록 기관이 같은 이름을 같은 값으로 직접 내주게 됐으므로(own), 옛 배선 줄은 값이 같은 이중 노출이다.
- 이 PR 은 그 가운데 설정 키트 몫을 처음으로 실제로 지운다. 지운 뒤에도 이름이 통로와 window 에 같은 값으로 있어야 하고, 마크업의 `onclick="openPwaInstallGuideModal()"` 같은 인라인 처리기가 그대로 불려야 한다.
- 법정의 생성기 재실행 대조(`court/lib/preserve-source.js` `recomputeSplit`)는 기준 커밋의 생성기를 이 PR 의 `proof.json` 으로 다시 돌려 `index.html` 과 `js/core/cell-registry.js` 가 PR 의 것과 바이트 동일한지 보고, 설정 `cells` 밖의 `js/**` 변경은 거부한다. 그래서 이 PR 의 제품 변경은 index.html 하나여야 한다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 중계선을 걷어 낸다. 이름과 값은 그대로, 내주는 길만 하나(등록 기관)로 줄인다.
- **원인**: 함수는 이미 세포로 옮겨졌지만 index.html 이 그것을 다시 이어 주는 줄이 남아 덩어리가 줄지 않았다. 옮길 원문이 없으니 「옮기기」로는 사라지지 않는다.
- **중심**: 생성기 unwire 한 번. 설정은 `reports/TASK-ES-618/proof.json`(kitVar `_settingsKit`, 세 플래그 모두, names 62). 줄을 고르는 것도 지우는 것도 생성기다.
- **핵심**: 지울 수 있는 이름만 지운다 — (가) 등록 기관에 등록돼 own 으로 나가는 이름 (나) 가져오기 줄을 지워도 IIFE 안 다른 줄에 참조가 남지 않는 이름(생성기 안전 검사) (다) 시험이 배선 글자를 붙잡지 않는 이름(DIR-004 (다)). 이 세 조건은 #889 의 모의 철거 측정에서 걸러 계획 파일에 담겼고, 이 PR 은 그 목록을 현재 main 에서 생성기로 다시 돌려 확인했다(멈춘 이름 0).

## 3. [원칙 ③] 해결 방식

1. 실행기 `unwire-run.js apply` — 계획 파일에서 `_settingsKit` 1차의 names 62개를 읽어 `proof.json` 을 쓰고 생성기를 돌린다. 생성기가 멈추면 그 이름만 빼고 다시 돌리며 사유를 남긴다(이번에 멈춘 이름 0).
2. `node scripts/module-guard.js --update` — 낮아진 값만 기준선에 기록(사유 없이). DIR-003 이 철거 PR 마다 요구한다. 그 밖의 생성 지도는 건드리지 않는다(L009).
3. 시나리오 둘 — (가) 게스트 여섯 탭 (나) 설정 탭에서 이 PR 이 window 대입 줄을 지운 이름 넷을 마크업 인라인 처리기로 부른다(설치 안내 창 열기·기기 탭 전환·닫기, 화면 모드 칩).
4. `unwire-run.js measure` — 기준 트리(origin/main 임시 worktree)와 맞대어 측정. 대조 탐침의 이름 목록은 **철거 전** 기준 트리 결과로 고정한다(`--names-from`).
5. `unwire-run.js claims` — 측정 파일에서 주장 파일을 만든다(보존 주장 = 시나리오마다 하나 + `proof.json`).

### 실행기 사용법 (다음 키트 B4~B8 에서 그대로 쓴다)

```
export NODE_PATH=C:/dev/ourgoal-app/node_modules
node docs/design/harness/module-split/unwire-run.js apply   . --task TASK-ES-6xx --kit _goalsKit --pass 1
node scripts/module-guard.js --update
(reports/TASK-ES-6xx/scenarios/*.json 을 그 키트의 화면 조작으로 쓴다 · npm test 를 기준·작업 트리에서 전경으로 돌려 reports/TASK-ES-6xx/raw/npm-test.{base,work}.{log,exit} 에 둔다)
node docs/design/harness/module-split/unwire-run.js measure . --task TASK-ES-6xx --base <origin/main 임시 worktree>
node docs/design/harness/module-split/unwire-run.js claims  . --task TASK-ES-6xx --req docs/specs/REQ-TASK-ES-6xx-….md
```

`--pass 1` 은 세 종류 모두(계획의 imports:true 실행), `--pass 2` 는 가져오기 줄은 남기고 getter·window 줄만. `--plan` 으로 다른 계획 파일을 줄 수 있다(기본 `reports/TASK-ES-614/unwire-plan.json`).

## 4. [원칙 ④] 재검토 (반례·부작용)

- **지운 이름이 사라지지 않는가** → 대조 탐침을 철거 전 이름 목록(통로 423 · window 199)으로 돌렸다: 통로에서 사라진 이름 0, 지운 통로 이름 44개 중 44개·지운 window 이름 29개 중 29개가 철거 뒤에도 있고, 이름별 값 지문 차이 0.
- **IIFE 안 남은 코드가 지운 이름을 맨이름으로 쓰지 않는가** → 생성기가 지운 줄 밖에 참조·대입이 남으면 멈춘다(통과). 엄격 모드라 남았다면 부팅 때 ReferenceError 가 났을 것 — 게스트 부팅 예외 0.
- **세 종류 밖의 줄을 지우지 않았는가** → 생성기 기록의 지운 줄 번호가 전부 가져오기 줄·expose 속성 줄(과 빈 껍데기)·window 대입 줄(과 빈 블록 껍데기)에 든다(밖 0). 기준 index.html 에서 그 줄을 지우고 쉼표 4개를 뗀 결과가 작업 index.html 과 글자 그대로 같다 — 더한 줄 0.
- **window 대입 시점이 달라진다**(IIFE 중간 → IIFE 바로 앞의 commit) → #889 에서 겹침 이름을 쟀다. 이번에 window 줄을 지운 29개 가운데 IIFE 밖 파일도 대입하는 이름은 `startOnboarding` 하나(`js/tabs/settings/onboarding.js` — commit 보다 앞에 로드)이고, 세 트리 지문이 같았다. 이번 측정에서도 window 지문 차이 0.
- **`var _settingsKit = window.OurgoalSettingsKit;` 손잡이 줄은 남는다** — 세 종류가 아니다(설계 5.2 X2, finalize 몫). 2차 대상 8개와 시험이 붙잡는 이름의 가져오기가 아직 이 손잡이를 쓴다.
- **기준선 파일을 분열 PR 이 고치면 충돌한다(L009)** → DIR-003 이 철거 PR 마다 기록을 요구한다(지시함이 경험칙보다 위). 철거 PR 은 한 번에 하나만 열리므로 충돌은 main 을 합칠 때 `module-guard --update` 를 다시 돌려 푼다.
- **줄바꿈(L060)**: 이 PC 는 `core.autocrlf=true` 라 작업 트리 index.html 은 CRLF 다. 법정은 저장소 글자(LF)로 대조한다. push 전에 로컬 법정을 실제 커밋 대상으로 돌려 생성기 재실행 대조가 성립하는지 확인한다(7절).

## 5. [원칙 ⑤] 절차

1. origin/main(a3bad12a) 기준 worktree · 번호 선점 → 법정 보존 대조 코드(`court/lib/preserve.js`·`preserve-source.js`)와 선례(reports/TASK-ES-596) 정독.
2. 실행기 작성 → `apply`(생성기 실행) → 지운 이름·줄 확인.
3. 시나리오 작성 → 기준·작업 로컬 실행.
4. `module-guard --update` → npm test 기준/작업 전경 실행 → `measure` → `claims`.
5. `verify-integrity-gate` → 커밋 → 로컬 법정 전체 실행(실제 커밋 대상, 생성기 재실행 대조 포함) → origin/main 확인 → push → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「1차와 2차를 한 PR 에 넣어야 PR 이 줄어든다」** → 법정은 PR 하나에 생성기를 한 번만 돌린다. 두 실행의 결과는 한 설정으로 재현되지 않아 바이트 대조가 깨진다. 생성기가 한 설정에서 여러 실행을 받게 하는 확장은 별도 PR(#TASK-ES-619)이고, 이 PR 은 현행 생성기 그대로(변경 0) 쓴다.
- **반론 2 「시나리오가 통과하면 충분하다 — 탐침·지문은 과하다」** → 시나리오가 누르는 것은 62개 중 몇 개뿐이다. 나머지 이름은 화면에서 닿지 않아도 다른 세포가 `L.이름` 으로 읽는다. 그래서 이름 전수를 철거 전 목록으로 대조하고 값 지문을 맞댔다. 반대로 탐침만으로는 인라인 처리기가 실제로 불리는지 모른다 — 둘 다 필요하다.
- **재검증**: 계획 파일은 #889 시점(c42a61ae 계열)에서 만든 것이다. 지금 main(a3bad12a)에서 생성기를 실제로 돌려 62개가 전부 통하는지 다시 확인했다(멈춘 이름 0 · 삭제 143줄 = 계획의 예상 143줄).
- **재검증**: 법정이 보존 주장에서 화면 상태(DOM·저장값·토스트·모달·오류 수)를 기준 2회·작업 1회로 맞댄다(`court/lib/preserve.js` `judgePreserve`). 기준 2회의 DOM 이 서로 다르면 「확인 못 함」이 된다. 로컬 법정 전체 실행으로 두 시나리오가 그 대조를 지나는지 push 전에 본다(7절에 결과).

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-618/` 아래. 수치는 `measurement.json` 이 각 결과 파일에서 읽어 모은 것이다(main 을 합치면 바뀌는 전체 수치는 주장에 쓰지 않고 이 PR 소유 파일을 가리킨다 — L002).

| 파일 | 무엇 |
|---|---|
| `proof.json` | 생성기 설정(법정이 기준 커밋에서 다시 돌린다): kitVar `_settingsKit` · imports/exposeGetters/windowAssign 모두 true · names 62 · cells `js/core/cell-registry.js` |
| `unwire-meta.json` | 생성기 산출 기록: 가져오기 62줄 · expose 속성 46줄(껍데기 1문) · window 대입 29줄(블록 껍데기 2) · 쉼표 4 · 삭제 143줄 · index.html 6273 → 6130줄 · 계획에서 뺀 이름 0 |
| `cell-registry-compare.before.json` · `cell-registry-compare.json` | 대조: 철거 전(기준 트리) → 그 이름 목록으로 철거 뒤. 불일치 0 · 통로에서 사라진 이름 0 · 예외 0 · own 438 |
| `scenario-local.json` | 시나리오 2개 기준·작업 통과(비공허 단언 13 · 9), 예외 0/0 |
| `module-load.json` | 법정 모듈 로드 탐침과 같은 비교: 새 회귀 0 |
| `npm-test-compare.json` · `raw/` | npm test 기준/작업 종료 코드 0/0 · ✓ 487/487 · ok 156/156 · 요약 동일 |
| `measurement.json` | 위 전부 + 바뀐 파일 범위(제품 파일 = index.html 하나) · 「지운 줄과 쉼표 말고 0」 · inlineScriptLines 4003 → 3860(−143) · 기준선 마지막 기록 3860 = 측정값 · module-guard 종료 0 |
| `claims.json` | 주장(보존 2 + 기록 17) |
| `court-local.json` | 로컬 법정 전체 실행 요약(작업자 PC — 판정 아님) |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: 법정의 생성기 재실행 대조가 줄바꿈 때문에 어긋날 수 있다 → 로컬 법정 전체 실행으로 먼저 확인한다. 어긋나면 push 하지 않고 원인을 고친다.
- **예상**: 보존 주장의 DOM 대조에서 기준 2회가 서로 달라(시간·난수) 「확인 못 함」이 될 수 있다 → 로컬 실행에서 드러나면 그 단계를 빼거나 시나리오를 바꾼다(단언을 약하게 하지 않는다).
- **예상**: main 이 움직이면 index.html·기준선이 충돌한다 → main 판 index.html 로 `apply` 를 다시 돌리고 `module-guard --update` 를 다시 돌린다(L010 과 같은 방식 — 손 충돌 해결 0).
- **측정불가**: 로그인 뒤 화면에서의 동작(설정의 계정·보안 기능 대부분은 로그인 뒤 경로다 — 이름과 값의 동일성은 게스트 부팅 뒤 전수 대조로 쟀고, 로그인 뒤 동작은 재지 못했다) · 운영 환경 · 서비스워커 갱신 중 동작.
- **성과 측정**: inlineScriptLines 4003 → 3860(−143, 출처 `measurement.json` `summary.inlineScriptLines`). 전체 완료 기준(IIFE 0)까지 남은 양은 다음 PR 들이 같은 방식으로 잰다.
