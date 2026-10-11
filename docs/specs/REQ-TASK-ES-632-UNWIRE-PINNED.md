# REQ — 미분화 덩어리 해체 철거 2차: 시험에서 풀린 이름 42개 + 한 줄 나눠 쓰기 4개(X3)

- Task ID: **TASK-ES-632** (L012: 오케스트레이터가 번호를 배정했고, `gh pr list --state all --limit 40` · `git ls-remote origin` 에서 632 가 비어 있음을 다시 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-632-unwire-pinned` 를 먼저 push 해 선점했다.)
- 상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」
- 지시함(origin/main): **DIR-003**(철거 PR 마다 기준선에 inlineScriptLines 기록 — 줄지 않으면 실패) · **DIR-004**((가) 생성기 줄 종류 닫힌 목록 U1~U3·X1~X9 · (다) 「시험이 글자로 붙잡고 있는 연결선 이름은 지우지 않고 남겨 둔 채 진행한다. 시험의 기대값·단언을 바꾸는 PR 은 따로 올리고…」 — 그 시험 PR 이 #900(TASK-ES-620)·#901(TASK-ES-623)로 병합됐다).
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준 — 「배선 철거」 일곱째 사례**. 작업참고(기준 PR #903, e02e397c). 선례 #891·#894·#896·#898·#902·#904(여섯 다 판정 「통과」·R1 동작 보존 확인)의 절차와 실행기를 따른다. 새로운 점은 확장 종류 **X3**(다른 글자와 한 줄을 나눠 쓰는 window 대입 — `sharedLine:true`, #892)의 첫 실사용이다. 그래서 「한 줄 안에서 지운 글자」를 되짚기로 따로 확인하고, push 전에 법정의 생성기 재실행 대조와 로컬 법정 전체를 실제 커밋 대상으로 돌린다.
- 기준 main eab4365b(#904 일정·기타 키트 철거 · #905 생성 지도 갱신 병합 뒤).
- 설계 정본: docs/architecture/CELL-REGISTRY-DESIGN.md 3.1·3.2·4절·5.1(U1~U3)·5.2(X3)·6.2 순서 5. 입력: `reports/TASK-ES-630/remaining-wiring.json`(#904 가 남긴 남은 배선 — 「시험에서 풀림」 42 · 「한 줄 나눠 쓰기」 4).
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

| ID | 지시 | 출처 | 완료 기준 |
|---|---|---|---|
| R1 | index.html 인라인 IIFE 에서 (가) 시험에서 풀린 이름 42개 (나) 한 줄을 나눠 쓰는 window 대입의 이름 4개(`defaultProfile`·`loadProfile`·`saveProfile`·`setTab`)의 배선을 생성기 unwire 로 지우고 앱 동작을 보존한다(손 편집 0) | 오케스트레이터 지시 · 설계 6.2 순서 5 | 이번에 지운 이름이 불리는 조작 시나리오와 게스트 여섯 탭 시나리오가 기준·작업 양쪽에서 통과 · 법정의 생성기 재실행 결과와 index.html 이 바이트 동일 |
| R2 | 지운 이름은 등록 기관(own)이 같은 값으로 내준다. `window.switchTab` 은 여전히 `setTab` 함수를 받는다 | 설계 3.1·3.2 · 오케스트레이터 지시 | 철거 전 이름 목록으로 대조해 불일치 0 · 통로에서 사라진 이름 0 · 이름별 값 지문 차이 0(`switchTab` 포함) |
| R3 | 지우는 대상은 설정이 허용한 줄 종류(U1~U3, 한 줄 안 삭제는 X3)뿐 · names 밖 이름·함수 본문·그 밖의 글자 불변 · 바뀐 제품 파일은 index.html 하나 · X3 로 고친 줄에 남는 글자는 온전한 문이다 | DIR-004 (가) · 설계 5절 | 실행을 차례로 되짚어 만든 결과 == 작업 index.html · 허용 종류 밖 삭제 줄 0 · 한 줄 안 삭제 3건의 전·후 글자 기록 |
| R4 | 증명 하한과 기준선 기록 — 시험지 수정(#900·#901) 뒤의 시험으로 통과한다 | 설계 4절 「배선 철거」 · DIR-003 | inlineScriptLines 감소와 `module-guard --update` 기록 · 모듈 로드 새 회귀 0 · npm test 기준/작업 ✓ 줄·ok 줄 수 동일·폐기 0 · 무결성 게이트 38/38 · tests/·금고·생성기·등록 기관 변경 0 |
| R5 | 남은 배선을 다시 재서 남긴다 | 오케스트레이터 지시 | `reports/TASK-ES-632/remaining-wiring.json` |

원문에 있는데 이 PR 에 없는 것(목표 줄에 남긴다): 「남은 미분화작업 모두」 — IIFE 가 아직 쓰는 가져오기 줄 77개, 참조 0 이 된 가져오기 줄 2개와 손잡이 줄 1개(`_homeKit`, X2), 등록되지 않은 이름(상태·함수·DOM 참조)의 줄은 다음 PR 들(함수 이전·상태 이전·구역 이전)이다.

### 구체 식별자

- 고친 제품 파일: `index.html` 하나 — 인라인 IIFE 의 가져오기 줄 34줄 · `OurgoalAppScope.expose('index.html', { get X(){ return X; }, … })` 속성 33줄(빈 껍데기 5문) · `window.X = X;` 47개(빈 if 블록 껍데기 13개) · 쉼표 3글자 · **한 줄 안 삭제 3건**(X3): `/* … */ window.defaultProfile = defaultProfile;` → 주석만 남김 · `if(…){ window.loadProfile = loadProfile; window.saveProfile = saveProfile; }` → `loadProfile` 대입만 뺌(그 뒤 실행에서 `saveProfile` 대입도 빠져 줄이 지워짐) · `if(…){ window.setTab = setTab; window.switchTab = setTab; }` → `if(…){ window.switchTab = setTab; }`
- 고친 도구(제품 코드 아님): `docs/design/harness/module-split/unwire-run.js` — `--names-for` 의 열쇠가 옵션까지 적은 꼴(`_uiKit:2:shared`)을 먼저 찾는다(같은 손잡이·차수의 실행을 옵션으로 나눌 때 이름이 섞이지 않게)
- 기록: `docs/architecture/module-baseline.json`(`module-guard --update` 가 56번째 항목을 더함) · `docs/rules/TICKETS.md` · `reports/TASK-ES-632/`(남은 배선 재기 도구 사본 `remaining-wiring.cjs` 포함)
- 손대지 않은 것: `js/**` 전부 · 생성기 `gen-inline-hard.js`·`gen-cell-provide.js` · tests/ · 금고 · 그 밖의 생성 지도(L009)
- 화면 식별자(시나리오): `#btnAvatarGreetClose`(onclick=`closeAvatarGreetingPopup`) · `.navbtn[data-tab=…]`(`setTab`) · `#homeAddGoal`(통로 `promptNewGoal`) · `#ngCancelBtn`·`#ngDescInput` · `#btnGoalsSubTeam` · `#sanctuaryBellBtn` · `#closeNotifCenterBtn`
- 지운 이름 46개의 목록은 `reports/TASK-ES-632/proof.json` `unwire[0..13].names`(예: `openModal` · `showToast` · `promptNewGoal` · `closeAvatarGreetingPopup` · `collapseAllSettingsSections` · `toggleAdvancedSettings` · `collapseAllTeamGoalAccordions` · `getKSTDateKey` · `triggerHaptic` · `setTab` · `saveProfile` · `loadProfile` · `defaultProfile`)

## 1. [원칙 ①] 문제를 정확히 파악한다

- #904 뒤 index.html 인라인 줄 수는 3,136(module-metrics, 기준 eab4365b)이다. 등록됐는데 배선이 남은 이름 116개 가운데 42개는 「시험이 그 배선 글자를 정답으로 붙잡고 있어서」 남겨 둔 것이었다(DIR-004 (다)).
- 시험지 수정 PR #900·#901 이 병합돼, 그 시험들은 이제 「옛 배선 글자가 있거나, 세포가 등록 기관에 그 이름을 등록했거나」로 넓혀 본다. #904 에서 저장소 밖 사본으로 42개를 지워 보고 npm test 가 같음을 쟀고(`reports/TASK-ES-630/pinned-release-mock.json`), 이 PR 이 그것을 실제로 지운다 — 이번에는 대조·화면 시나리오·모듈 로드까지 실제 작업 트리에서 잰다.
- 나머지 4개는 window 대입이 다른 글자와 한 줄을 나눠 써서 줄 단위 삭제로는 못 지우던 것이다. 그중 `setTab` 은 같은 줄에 `window.switchTab = setTab;` 이 있다 — `switchTab` 의 통로 값은 `switchTab` 함수이고 window 값은 `setTab` 함수다(서로 다르다 — B2 가 등록하지 않고 남긴 이름). `setTab` 대입만 지우고 `switchTab` 대입은 남겨야 한다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 중계선을 걷어 낸다. 이름과 값은 그대로, 내주는 길만 등록 기관 하나로 줄인다.
- **원인**: 42개는 기술적으로는 진작 지울 수 있었지만 시험이 글자를 붙잡았고, 4개는 생성기가 줄 단위로만 지울 수 있었다. 둘 다 앞선 PR(#900·#901, #892)이 길을 열었다.
- **중심**: 생성기 unwire 한 번, 설정 `reports/TASK-ES-632/proof.json` 의 `unwire` 배열 14칸(그중 2칸이 `sharedLine:true`).
- **핵심**: X3 는 「줄을 지운다」가 아니라 「줄 안의 글자 일부를 지운다」다. 남는 글자가 온전한 문인지, 그리고 같은 줄의 다른 대입(`window.switchTab = setTab;`)이 그대로인지가 이 PR 에서 새로 봐야 할 것이다.

## 3. [원칙 ③] 해결 방식

1. 실행 목록을 `reports/TASK-ES-630/remaining-wiring.json` 에서 만든다: 이름마다 손잡이(키트)와, 「가져오기 줄이 있고 IIFE 안 잔존 참조가 0」이면 1차·아니면 2차(가져오기 줄 남김). X3 네 이름은 같은 규칙에 옵션 `shared` 를 붙인 별도 실행. 결과: `_calendarKit:1` · `_commKit:1` · `_goalsKit:1`·`2` · `_homeKit:1` · `_modalOpenKit:2` · `_recordsKit:1`·`2` · `_settingsKit:1`·`2` · `_uiKit:1`·`1:shared`·`2`·`2:shared`.
2. `unwire-run.js apply … --runs … --names-for …` → 생성기가 멈춘 이름 0(46개 전부).
3. `node scripts/module-guard.js --update`.
4. 시나리오 셋 — (가) 게스트 여섯 탭: 진입 때 아바타 인사 팝업 닫기(인라인 `closeAvatarGreetingPopup`), 탭 전환(`setTab`) (나) 홈의 「새 목표」로 새 목표 창 열기(통로 `promptNewGoal` → `openModal`)·취소, 목표 탭 팀목표 하위 탭으로 이동 (다) 홈의 종 버튼으로 알림 센터 창 두 번 열고 닫기(통로 `openModal`·`closeModal`), 설정 탭에 다녀오기.
5. `unwire-run.js measure` · `claims` + 남은 배선 재기.

## 4. [원칙 ④] 재검토 (반례·부작용)

- **지운 이름이 사라지지 않는가** → 철거 전 이름 목록(통로 423 · window 199)으로 대조: 통로에서 사라진 이름 0, 지운 통로 이름 31개 중 31개·지운 window 이름 45개 중 45개가 철거 뒤에도 있고, 이름별 값 지문 차이 0.
- **`window.switchTab`** → 철거 전후 지문이 같다: window 쪽 `function:setTab`, 통로 쪽 `function:switchTab`(`cell-registry-compare.before.json`·`cell-registry-compare.json`). 남은 줄 `if(typeof window !== 'undefined'){ window.switchTab = setTab; }` 가 기대는 가져오기 줄 `var setTab = _uiKit.setTab;` 은 남겼다(2차 실행 — 가져오기 삭제 0).
- **X3 로 고친 줄의 글자** → 세 건의 전·후 글자가 `unwire-meta.json` `runs[].inlineEdits` 에 있다. 측정이 실행을 차례로 되짚을 때 「고치기 직전 줄 글자 == 생성기가 적은 before」를 확인하고 after 로 바꿔 넣어, 그 결과가 작업 index.html 과 같다. 생성기 자신도 지운 뒤 다시 파싱해 토큰열이 예상과 같은지 본다(#892). 게스트 부팅 예외 0.
- **별칭 이름**(`showToast` ← `toast`, `copyUserGoalTemplate` ← `copyRealUserTemplate`, `openGoalTemplateEncyclopediaModal` ← `openTemplateEncyclopediaModal`) → 등록 기관이 별칭 이름으로 같은 함수를 window 에 내준다(B2 등록). window 지문 같음.
- **`toast` 는 요소 id 와 같은 이름** → `window.toast` 줄은 #896 에서 이미 지웠다. 이번 `showToast` 는 요소 id 와 겹치지 않는다.
- **시험이 정말 넓힌 단언으로 통과하는가** → 작업 트리에서 npm test 전경 실행: 종료 코드·✓ 줄·ok 줄 수가 기준과 같고, 무결성 게이트 38/38.
- **허용 종류 밖의 줄** → 실행마다 지운 줄이 전부 허용 종류에 든다(밖 0). X1·X2 사용 0.

## 5. [원칙 ⑤] 절차

1. origin/main 기준 worktree · 번호 선점 → 실행기 열쇠 보강 → 실행 목록 생성 → `apply`.
2. 시나리오 후보를 기준·작업에서 시험 → 기준에서 닿는 것만 남김.
3. 작업 중 main 이 움직여(#905) 새 main 위에서 `apply` 를 다시 돌리고 `module-guard --update` → npm test 기준/작업 전경 실행 → 무결성 게이트 → `measure` → `claims`.
4. 남은 배선 재기.
5. `verify-integrity-gate` → 커밋 → 로컬 법정 전체 실행과 `recomputeSplit` 직접 호출(실제 커밋 대상) → origin/main 확인 → push → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「`setTab` 은 `switchTab` 과 얽혀 있으니 빼는 게 안전하다」** → 얽힌 것은 같은 줄을 쓴다는 것뿐이다. `setTab` 의 통로·window 값은 등록 기관이 내주고, `switchTab` 줄은 글자 그대로 남는다. 애매한지 판단하려고 두 이름의 통로·window 지문 넷을 철거 전후로 따로 확인했다(넷 다 같음). 빼면 그 한 줄 때문에 `setTab` 의 getter·window 줄 셋이 계속 남는다.
- **반론 2 「시나리오가 설정 접기·팀 목표 접기를 직접 누르지 않는다」** → 그 두 이름(`collapseAllSettingsSections`·`collapseAllTeamGoalAccordions`)은 화면 진입 때 다른 파일이 window 이름으로 부르는 함수이고, 접힘 상태는 `<details>` 요소라 법정 실행기의 「보임」 판정으로는 접힘·펼침을 가르지 못했다(기준 트리에서 접힌 안쪽 요소도 보이는 것으로 잡혔다 — 실측). 단언을 꾸미지 않고, 진입까지만 시나리오에 넣고 값은 이름 대조·지문으로 쟀다.
- **재검증**: 첫 시나리오 후보 가운데 목표 탭의 새 목표 버튼(`#btnPersonalAddGoalInline`·`#chipAdd`)은 기준 트리의 게스트 화면에 없어, 같은 함수를 부르는 홈의 「새 목표」(`#homeAddGoal`)로 바꿨다.
- **재검증**: #904 의 「시험에서 풀림」 측정은 사본에서 npm test 만 본 것이었다. 이번에는 실제 작업 트리에서 대조·지문·시나리오·모듈 로드·npm test·무결성 게이트를 모두 돌렸다.

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-632/` 아래. 수치는 `measurement.json`·`remaining-wiring.json` 이 각 결과에서 읽어 모은 것이다(L002).

| 파일 | 무엇 |
|---|---|
| `proof.json` | 생성기 설정: `unwire` 배열 14칸(이름 46개 — 풀린 42 + X3 4), 그중 `_uiKit` 두 칸이 `sharedLine:true` · cells `js/core/cell-registry.js` |
| `unwire-meta.json` | 실행별 생성기 산출 — 합 삭제 147줄(가져오기 34 · 속성 33 · window 47) · 쉼표 3 · 한 줄 안 삭제 3건(전·후 글자) · index.html 5406 → 5259줄 · 멈춘 이름 0 |
| `cell-registry-compare.before.json` · `cell-registry-compare.json` | 대조: 불일치 0 · 통로에서 사라진 이름 0 · 예외 0 · own 438 |
| `scenario-local.json` | 시나리오 3개 기준·작업 통과(비공허 단언 9 · 13 · 6), 예외 0/0 |
| `module-load.json` | 새 회귀 0 |
| `npm-test-compare.json` · `raw/` | npm test 기준/작업 종료 코드·✓ 줄·ok 줄 수·요약 비교(값은 측정 기록) |
| `measurement.json` | 위 전부 + 제품 파일 = index.html 하나 · 되짚기 결과 == 작업 index.html · inlineScriptLines 3136 → 2989(−147) · 기준선 마지막 기록 = 측정값 · module-guard 종료 0 |
| `remaining-wiring.json` | **남은 배선**: 등록됐는데 배선이 남은 이름 79개 — 전부 가져오기 줄뿐(getter 0 · window 0). IIFE 안 잔존 참조 77 · 참조 0(지금 지울 수 있음) 2(`copyRealUserTemplate`·`openTemplateEncyclopediaModal`). 등록되지 않은 이름: getter 이름 69(102줄) · window 이름 19(19줄) · 등록 안 된 가져오기 80. 손잡이 15개 가운데 참조 0 은 `_homeKit` 하나 |
| `claims.json` | 주장(보존 3 + 기록 19) |
| `court-local.json` | 로컬 법정 전체 실행 요약(작업자 PC — 판정 아님) |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: X3 실행이 법정의 재실행에서 어긋날 수 있다(첫 실사용) → push 전 `recomputeSplit` 직접 호출과 로컬 법정 전체 실행.
- **예상**: main 이 또 움직이면 합친 뒤 다시 잰다. 로컬 법정 실행이 끊기면 요약을 쓰지 않고 다시 돌린다.
- **측정불가**: 설정 섹션·팀 목표의 접힘 상태 화면 단언(위 6절) · 로그인 뒤 화면(구글 캘린더 연결·문의·신고·잠금화면 허브 등 풀린 이름 다수의 실제 화면) · 햅틱 · 운영 환경.
- **성과 측정**: inlineScriptLines 3136 → 2989(−147, 출처 `measurement.json` `summary.inlineScriptLines`). 배선 철거 전체(#891~이 PR)로 4003 → 2989(−1,014). 등록된 이름의 통로 getter 줄·window 대입 줄은 이 PR 로 0 이 된다.
