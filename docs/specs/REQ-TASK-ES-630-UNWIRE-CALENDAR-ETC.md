# REQ — 미분화 덩어리 해체 B8: 일정 키트(_calendarKit) 1차·2차 + 기타 키트 + `_xp` 손잡이(X1) 배선 철거

- Task ID: **TASK-ES-630** (L012: 오케스트레이터가 번호를 배정했고, `gh pr list --state all --limit 40` · `git ls-remote origin` 에서 630 이 비어 있음을 다시 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-630-unwire-calendar-etc` 를 먼저 push 해 선점했다.)
- 상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」
- 지시함(origin/main): **DIR-003**(「키트별 철거: … → calendar·기타」 · 철거 PR 마다 기준선에 inlineScriptLines 기록 — 줄지 않으면 실패) · **DIR-004**((가) 생성기 줄 종류 닫힌 목록 U1~U3·X1~X9 · (다) 시험이 글자로 붙잡는 연결선 이름은 남긴다).
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준 — 「배선 철거」 여섯째 사례**. 작업참고(기준 PR #899, 5ba571c4). 선례 #891·#894·#896·#898·#902(다섯 다 판정 「통과」·R1 동작 보존 확인)의 절차와 실행기를 그대로 따른다. X1(`_xxxKit` 꼴이 아닌 손잡이)은 #896 의 `_ui` 에 이어 `_xp` 가 둘째 사용이다. 도구 변경 없음.
- 기준 main e02e397c(#900 배선 글자 단언 시험 수정 · #901 무결성 게이트 단언 수정 · #902 소통 키트 철거 · #903 생성 지도 갱신 병합 뒤).
- 설계 정본: docs/architecture/CELL-REGISTRY-DESIGN.md 3.1·3.2·4절·5.1(U1~U3)·5.2(X1)·6.2. 철거 계획 입력: `reports/TASK-ES-614/unwire-plan.json`.
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

| ID | 지시 | 출처 | 완료 기준 |
|---|---|---|---|
| R1 | index.html 인라인 IIFE 에서 배선 여덟 실행을 생성기 unwire 로 지우고 앱 동작을 보존한다(손 편집 0): `_calendarKit` 1차·2차 · `_authSocialKit` 1차 · `_creatorTemplatesLegacyKit` 2차 · `_homeKit` 1차 · `_levelBadgeKit` 2차 · `_xp` 1차·2차 | DIR-003 「키트별 철거: calendar·기타」 · 오케스트레이터 지시 | 일정 탭 조작 시나리오와 게스트 여섯 탭 시나리오가 기준·작업 양쪽에서 통과 · 법정의 생성기 재실행 결과와 index.html 이 바이트 동일 |
| R2 | 지운 이름은 등록 기관(own)이 같은 값으로 내준다 | 설계 3.1·3.2 | 철거 전 이름 목록으로 대조해 불일치 0 · 통로에서 사라진 이름 0 · 이름별 값 지문 차이 0 |
| R3 | 지우는 대상은 설정이 허용한 줄 종류(U1~U3, 손잡이 꼴은 X1)뿐 · names 밖 이름·함수 본문·그 밖의 글자 불변 · 바뀐 제품 파일은 index.html 하나 | DIR-004 (가) · 설계 5절 | 실행을 차례로 되짚어 만든 결과 == 작업 index.html · 허용 종류 밖 삭제 줄 0 |
| R4 | 증명 하한과 기준선 기록 | 설계 4절 「배선 철거」 · DIR-003 | inlineScriptLines 감소와 `module-guard --update` 기록 · 모듈 로드 새 회귀 0 · npm test 동일·폐기 0 · tests/·금고·생성기·등록 기관·도구 변경 0 |
| R5 | 계획의 1차·2차가 이 PR 로 끝난다 — 지금 덩어리에 남은 배선을 다시 재서 철거 2차의 입력으로 남긴다 | 오케스트레이터 지시 | `reports/TASK-ES-630/remaining-wiring.json` 에 이유별 이름 수·줄 수와 손잡이 줄의 남은 참조 수가 있다 |

원문에 있는데 이 PR 에 없는 것(목표 줄에 남긴다): 「남은 미분화작업 모두」 — 시험에서 풀린 이름 42개의 철거, 한 줄을 나눠 쓰는 window 대입(X3) 4개, IIFE 가 아직 쓰는 가져오기 줄, 손잡이 줄(X2), 함수 이전·상태 이전·구역 이전은 다음 PR 들이다(7절 남은 배선 표).

### 구체 식별자

- 고친 제품 파일: `index.html` 하나 — 인라인 IIFE 의 가져오기 줄 22줄(`var X = _calendarKit.X;` 12 · `_authSocialKit` 1 · `_homeKit` 4 · `_xp` 5) · `OurgoalAppScope.expose('index.html', { get X(){ return X; }, … })` 속성 27줄(빈 껍데기 2문) · `window.X = X;` 19줄(빈 if 블록 껍데기 2개) · 쉼표 10글자(생성기 산출 그대로)
- 기록: `docs/architecture/module-baseline.json`(`node scripts/module-guard.js --update` 가 55번째 항목을 더함) · `docs/rules/TICKETS.md` · `reports/TASK-ES-630/`(남은 배선 재기 도구 `remaining-wiring.cjs` 포함)
- 손대지 않은 것: `js/**` 전부 · 생성기 · 실행기(`unwire-run.js`) · tests/ · 금고 · 그 밖의 생성 지도(L009)
- 화면 식별자(시나리오): `.navbtn[data-tab=…]` · `#sanctuaryCalendarView button[onclick*="openDayHubModal"]`(→ `window.openCalendarDayEditHubModal`) · `#hubCloseBtn`
- 지운 이름 30개의 목록은 `reports/TASK-ES-630/proof.json` `unwire[0..7].names`(예: `calShift` · `calendarItemsByDate` · `openCalendarManualEditModal` · `openCalendarDayEditHubModal` · `renderCalendarScreen` · `toggleScheduleDone` · `startOAuthLogin` · `cloneTemplate` · `renderHome` · `renderTodayMissionCard` · `renderLevelBadge` · `levelForXP` · `awardXP`)

## 1. [원칙 ①] 문제를 정확히 파악한다

- #902 뒤 index.html 인라인 줄 수는 3,212(module-metrics, 기준 e02e397c)다. 계획(`unwire-plan.json`)에 남은 실행은 일정 키트 둘과 작은 키트 넷이고, 계획 당시 생성기가 못 돌리던 `_xp` 손잡이(등록된 이름 7개)가 더 있다.
- `_xp` 는 먼저 일곱 이름을 1차로 돌려 생성기가 `XP_RULES`·`awardXP` 에서 멈추는 것을 확인했다(IIFE 안 한 줄이 둘을 맨이름으로 쓴다 — 생성기 정지 메시지 실측). 그 둘은 2차(가져오기 줄 남김)로 돌렸다.
- 일정 탭은 게스트 화면에서 성소 일정 보기(`#sanctuaryCalendarView`)가 그려지고 옛 달력 격자(`#calGrid`)와 월 이동 버튼(`#calPrevBtn`·`#calNextBtn`)은 보이지 않는다(기준 트리에서 실측 — 누를 대상 없음). 성소 일정 보기의 버튼은 `window.OurgoalSanctuaryV3.openDayHubModal()` 을 거쳐 `window.openCalendarDayEditHubModal` 을 부른다 — 이번에 window 대입 줄을 지운 이름이다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 중계선을 걷어 낸다. 이름과 값은 그대로, 내주는 길만 등록 기관 하나로 줄인다.
- **원인**: 함수는 세포로 옮겨졌지만 index.html 이 다시 끌어와 통로와 window 로 내주는 줄이 남았다.
- **중심**: 생성기 unwire 한 번, 설정 `reports/TASK-ES-630/proof.json` 의 `unwire` 배열 여덟 칸.
- **핵심**: 이 PR 로 「지금 계획으로 지울 수 있는 것」은 끝난다. 그래서 끝에 남은 배선을 이유별로 다시 재서, 다음에 무엇을 풀어야 줄이 더 주는지를 숫자로 남긴다.

## 3. [원칙 ③] 해결 방식

1. `node docs/design/harness/module-split/unwire-run.js apply . --task TASK-ES-630 --runs _calendarKit:1,_calendarKit:2,_authSocialKit:1,_creatorTemplatesLegacyKit:2,_homeKit:1,_levelBadgeKit:2,_xp:1,_xp:2 --names-for "_xp:1=levelForXP+levelProgress+notifyXpGained+triggerAvatarCelebrationPopup+xpForLevel,_xp:2=XP_RULES+awardXP"` — 계획의 이름 그대로이고 `_xp` 만 위와 같이 나눴다(멈춘 이름 0).
2. `node scripts/module-guard.js --update`.
3. 시나리오 둘 — (가) 게스트 여섯 탭(홈으로 돌아올 때 `renderHome`·`renderTodayMissionCard`·`renderLevelBadge` 등을 통로로 부른다) (나) 일정 탭에서 「일자 종합 허브」 버튼으로 날짜 편집 허브 창 열기·닫기를 두 번, 그 뒤 홈으로.
4. `unwire-run.js measure` · `claims` — 선례와 같다.
5. 남은 배선 재기: `reports/TASK-ES-630/remaining-wiring.cjs`. 시험이 붙잡던 이름이 시험지 수정(#900·#901) 뒤 풀렸는지는 글자 검색으로 가릴 수 없어, 저장소 밖 사본에서 그 42개를 모의 철거하고 npm test 를 돌려 쟀다(`pinned-release-mock.json` — 실제 철거 0).

## 4. [원칙 ④] 재검토 (반례·부작용)

- **지운 이름이 사라지지 않는가** → 철거 전 이름 목록(통로 423 · window 199)으로 대조: 통로에서 사라진 이름 0, 지운 통로 이름 26개 중 26개·지운 window 이름 16개 중 16개가 철거 뒤에도 있고, 이름별 값 지문 차이 0.
- **성소 일정 보기가 window 이름으로 직접 부른다**(`window.openCalendarDayEditHubModal`·`window.openCalendarManualEditModal`·`window.toggleScheduleDone`·`window.calendarItemsByDate` — `js/sanctuary-calendar-actions.js`·`js/sanctuary-v3-engine.js`) → window 값 지문 같음 + 허브 창 열기 시나리오 통과.
- **`XP_RULES`·`awardXP` 는 IIFE 가 아직 쓴다** → 가져오기 줄은 남기고 getter 줄만 지웠다(2차 실행의 가져오기 삭제 0줄).
- **`startOAuthLogin` 은 로그인 경로다** → 게스트 화면으로는 누르지 않는다(외부 로그인 창으로 나간다). 이름 대조와 지문으로 쟀다.
- **허용 종류 밖의 줄** → 실행마다 지운 줄이 전부 세 종류에 든다(밖 0). X3·X2 사용 0.
- **시험지가 바뀐 main 위에서 잰 것인가** → 그렇다. #900·#901 을 포함한 main(e02e397c)을 기준 트리로 npm test 를 돌렸다(ok 줄 수가 156 에서 172 로 늘어난 판).

## 5. [원칙 ⑤] 절차

1. origin/main 기준 worktree · 번호 선점 → `apply`(먼저 `_xp` 를 1차로만 돌려 멈추는 이름 확인 → 여덟 실행으로 확정).
2. 시나리오 후보를 기준·작업에서 시험 → 기준에서 닿는 것만 남김.
3. 작업 중 main 이 움직여(#900·#903) 새 main 위에서 `apply` 를 다시 돌리고 `module-guard --update` → npm test 기준/작업 전경 실행 → `measure` → `claims`.
4. 남은 배선 재기(모의 철거 측정 포함).
5. `verify-integrity-gate` → 커밋 → 로컬 법정 전체 실행과 `recomputeSplit` 직접 호출(실제 커밋 대상) → origin/main 확인 → push → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「시험지 수정(#900)이 병합됐으니 시험이 붙잡던 42개도 이 PR 에서 같이 지우면 된다」** → 오케스트레이터 지시는 「시험이 붙잡는 이름은 계속 뺀다」였고 그 시점에 #900 은 병합 전이었다. 작업 중 병합됐지만, 42개는 여섯 키트에 걸쳐 있고 화면 시나리오도 다시 짜야 한다. 이 PR 은 계획의 1차·2차까지로 닫고, 42개가 풀렸다는 측정(모의 철거 사본 npm test 동일)을 다음 PR 의 입력으로 남긴다.
- **반론 2 「월 이동(calShift)을 눌러 보지 않았다」** → 옛 달력 격자와 월 이동 버튼은 기준 트리의 게스트 화면에서 보이지 않는다(누를 대상 없음 — 실측). 닿지 않는 것을 닿는 것처럼 꾸미지 않고, `calShift` 는 이름 대조와 window 값 지문으로 쟀다.
- **재검증**: 처음 잰 것은 a83a1d80 기준이었다. 그 뒤 main 이 e02e397c 로 움직여(시험 파일 17개 변경 포함) 새 main 에서 철거를 다시 적용하고 전부 다시 쟀다 — 이 문서의 수치는 다시 잰 값이다.
- **재검증**: 「시험에서 풀림」 판단을 글자 검색에 맡기지 않았다. 글자 검색은 지금도 42개를 잡는다(시험 소스에 옛 글자가 남아 있다). 실제로 지워 보고 시험을 돌린 결과로 판단했다.

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-630/` 아래. 수치는 `measurement.json`·`remaining-wiring.json` 이 각 결과에서 읽어 모은 것이다(L002).

| 파일 | 무엇 |
|---|---|
| `proof.json` | 생성기 설정: `unwire` 배열 8칸 — `_calendarKit` 12 · 4 / `_authSocialKit` 1 / `_creatorTemplatesLegacyKit` 1 / `_homeKit` 4 / `_levelBadgeKit` 1 / `_xp` 5 · 2 · cells `js/core/cell-registry.js` |
| `unwire-meta.json` | 실행별 생성기 산출: 32 · 10 · 3 · 2 · 10 · 2 · 15 · 2줄 — 합 76줄(가져오기 22 · 속성 27 · window 19) · 쉼표 10 · index.html 5482 → 5406줄 |
| `cell-registry-compare.before.json` · `cell-registry-compare.json` | 대조: 불일치 0 · 통로에서 사라진 이름 0 · 예외 0 · own 438 |
| `scenario-local.json` | 시나리오 2개 기준·작업 통과(비공허 단언 8 · 13), 예외 0/0 |
| `module-load.json` | 새 회귀 0 |
| `npm-test-compare.json` · `raw/` | npm test 기준/작업 종료 코드·✓ 줄·ok 줄 수·요약 비교(값은 측정 기록) |
| `measurement.json` | 위 전부 + 제품 파일 = index.html 하나 · 되짚기 결과 == 작업 index.html · inlineScriptLines 3212 → 3136(−76) · 기준선 마지막 기록 = 측정값 · module-guard 종료 0 |
| `pinned-names-now.json` · `pinned-release-mock.json` | 시험이 붙잡던 이름: 글자 검색 결과(지금도 42) · 모의 철거 사본 측정(42개를 지운 사본의 npm test 가 기준과 같음 — 138줄) |
| `remaining-wiring.json` | **남은 배선**(이 PR 을 반영한 index.html): 등록됐는데 배선이 남은 이름 116개 — 시험에서 풀림 42(가져오기 39 · getter 28 · window 42줄) · 한 줄 나눠 쓰기 X3 4(가져오기 4 · getter 5 · window 5줄) · 가져오기 줄만 남음 70. 등록되지 않은 이름(IIFE 소유): getter 이름 69(102줄) · window 이름 19(19줄) · 등록 안 된 가져오기 80(그중 `bind…` 52). 손잡이 줄 15개 가운데 참조 0 인 것은 없다 |
| `claims.json` | 주장(보존 2 + 기록 17) |
| `court-local.json` | 로컬 법정 전체 실행 요약(작업자 PC — 판정 아님) |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: main 이 또 움직이면 합친 뒤(제품 파일이 바뀌었으면 `apply` 부터) 다시 잰다.
- **예상**: 로컬 법정 실행이 도중에 끊기면 요약을 쓰지 않고 다시 돌린다.
- **측정불가**: 옛 달력 격자·월 이동·날짜 칸 누르기(게스트 화면에 없음) · 일정이 있는 계정의 일정 탭 화면 · 소셜 로그인 · 레벨업 화면 · 로그인 뒤 동작 · 운영 환경. 모의 철거 사본에서는 npm test 만 돌렸다(대조·시나리오·모듈 로드는 철거 2차 PR 이 잰다).
- **성과 측정**: inlineScriptLines 3212 → 3136(−76, 출처 `measurement.json` `summary.inlineScriptLines`). 철거 1차·2차(#891·#894·#896·#898·#902·이 PR)를 합쳐 4003 → 3136(−867).
