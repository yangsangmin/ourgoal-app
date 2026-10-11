# REQ — 미분화 덩어리 해체: 다시 생긴 배선 재철거(등록 기관이 내주는 이름의 getter · 참조 0 가져오기 줄 · 참조 0 손잡이 줄)

- Task ID: **TASK-ES-648** (L012: `gh pr list --state all` · `git ls-remote origin` 에서 648 이 비어 있음을 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-648-unwire-regrown` 를 먼저 push 해 선점했다. 643·646·647 은 다른 작업 몫이다.)
- 상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」
- 지시함(origin/main): **DIR-003**(철거 PR 마다 기준선에 inlineScriptLines 기록 — 줄지 않으면 실패) · **DIR-004**((가) 생성기 줄 종류 닫힌 목록 U1~U3 · X1~X9 — 이번에 쓰는 것은 U1(가져오기 줄) · U2(expose getter 줄) · X1(`_ui` 손잡이) · X2(손잡이 줄 `dropKitVar`) · (다) 시험이 글자로 붙잡은 이름은 남겨 둔다).
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준 — 「배선 철거」**(경험칙 L069·L072·L073·L075, 선례 #891~#907). 실행기 `docs/design/harness/module-split/unwire-run.js`(apply → measure → claims)를 그대로 썼다. 새로운 점은 확장 종류 **X2**(`dropKitVar` — 참조 0 손잡이 줄)의 첫 실사용이다. 작업참고 **기준 PR #905**(eab4365b).
- 이 작업 세션은 빌더(서브에이전트)다. 병합은 하지 않는다(오케스트레이터 몫).
- 기준 main: c0658b2c(#917 병합 뒤).
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

`unwire-run.js claims` 가 주장 파일에 적는 지시 항목(R1~R4)이 정본이다. 요지:

- **R1** index.html 인라인 IIFE 에서 다시 생긴 배선을 생성기(`gen-inline-hard.js` mode:"unwire", 한 설정 11칸)로 지우고 앱 동작을 보존한다(손 편집 0).
- **R2** 지운 이름은 등록 기관(own)이 같은 값으로 내준다: 철거 전 이름 목록으로 대조해 불일치 0 · 통로에서 사라진 이름 0 · 이름별 값 지문 차이 0.
- **R3** 지우는 대상은 설정이 허용한 줄 종류뿐이고 names 밖 이름·함수 본문·그 밖의 글자는 바꾸지 않는다. 바뀐 제품 파일은 index.html 하나다.
- **R4** 증명 하한: 인라인 줄 수 감소와 기준선 기록 · 모듈 로드 새 회귀 0 · npm test 검사 수 동일·폐기 0 · tests/·금고·생성기·등록 기관 변경 0.
- (지시 항목 밖의 보고) 이 PR 을 반영한 index.html 에서 남은 배선과 덩어리의 줄 구성을 다시 재서 보고 파일로 남긴다(다음 단계 계획의 입력 — 주장으로 걸지 않는다).

범위 밖(지우지 않음): 등록되지 않은 이름(IIFE 소유 — `toggleAgentBtn` 은 상태 기관으로 갔고, `capturePhotoBtn` · `qRoutineRow` · `CURATED_MARKET_TEMPLATES` · `MOCK_PEOPLE` 등)의 getter · window 에만 나가게 등록된 이름 `initDevDebugButtons` 의 getter(기관이 통로에는 내주지 않는다 — 지우면 세포 `js/tabs/settings/boot-wiring.js` 가 못 읽는다) · 상태 기관이 맡은 이름 · 시험이 글자로 붙잡은 이름 5개(`openMicPermissionGuideModal` · `openModal` · `openShareToFeedModal` · `showLegalModal` · `triggerHaptic`) · IIFE 안 잔존 참조가 있는 가져오기 줄 60개.

### 구체 식별자

- 파일: `index.html`(인라인 IIFE 머리의 가져오기 줄 · `OurgoalAppScope.expose('index.html', {…})` 속성 줄 · 손잡이 줄) — 바뀐 제품 파일은 이것 하나. `js/core/cell-registry.js` 는 기준과 같다.
- 실행 11칸(`reports/TASK-ES-648/proof.json` `unwire` 배열, 이름 29개):
  - 1차(가져오기·getter 모두): `_creatorTemplatesLegacyKit`(`cloneTemplate`, + `dropKitVar`) · `_recordsKit`(`compressImage` · `openPhotoViewerModal` · `timeAgoStr`) · `_uiKit`(`dispatchFullViewPropagation` · `enterApp` · `fmtTime` · `triggerHapticFeedback`) · `_goalsKit`(`goalAchievement` · `copyRealUserTemplate` · `openTemplateEncyclopediaModal`) · `_commKit`(`renderCommFeed` · `renderCommScreen`)
  - 2차(가져오기 줄은 남김, getter 만): `_goalsKit`(`TEAM_COMMENTS_CACHE` · `groupState` · `renderGoalsScreen`) · `_uiKit`(`burstConfetti` · `closeModal` · `dDay` · `nowISO` · `saveLocalSettings` · `saveProfile` · `setTab` · `toast` · `uid`) · `_ui`(`escapeHtml`) · `_recordsKit`(`openRecordModal` · `renderRecordsScreen`) · `_settingsKit`(`performLogout`)
  - 손잡이 줄만: `_homeKit`(`dropKitVar`, 이름 0)
- 생성기 `docs/design/harness/module-split/gen-inline-hard.js`(변경 0) · 실행기 `unwire-run.js`(변경 0) · 남은 배선 재기 `reports/TASK-ES-648/remaining-wiring.cjs`(#907 의 것을 그대로 복사) · 구성 재기 `reports/TASK-ES-648/iife-composition.cjs`(새 측정 도구)

## 1. [원칙 ①] 문제를 정확히 파악한다

감싸기·함수 이전(#911 · #913 · #917)에서 생성기가 옮긴 코드가 읽는 인라인 이름의 통로 getter 를 IIFE 머리에 다시 달았다. 그 가운데 세포가 등록 기관에 통로용으로 등록한 이름은 기관이 IIFE 직전 commit 으로 이미 같은 값을 내주므로 index.html 의 getter 는 겹친 줄이다. 또 그 이전들로 IIFE 안 맨이름 참조가 0 이 된 이름의 가져오기 줄과, 가져오기가 하나도 남지 않은 손잡이 줄이 생겼다. 현재 main 에서 다시 재니(`remaining-wiring.before.json`) 등록됐는데 getter 줄이 남은 이름 33개(시험이 붙잡은 5 · window 전용 등록 1 포함), 참조 0 손잡이 `_homeKit` 이었다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 같은 값을 두 번 내주는 줄을 걷어 낸다. 이름과 값은 그대로, 내주는 길만 등록 기관 하나로 되돌린다.
- **원인**: 옮기기 생성기(일반 모드)는 「머리에 getter 가 없으면 단다」만 알고 등록 기관이 이미 내주는지는 모른다. 그래서 옮기기 PR 마다 getter 가 다시 생긴다.
- **중심**: 생성기 unwire 한 번, 설정 `reports/TASK-ES-648/proof.json` 의 `unwire` 배열 11칸.
- **핵심**: 「등록됐다」와 「기관이 통로에 내준다」는 다르다. window 전용으로 등록된 이름(`initDevDebugButtons`)은 등록 목록에는 있지만 통로에는 index.html 의 getter 로만 나간다 — 지우면 안 된다. 그래서 대상은 남은 배선 표의 종류 칸이 통로(scope)를 포함하는 이름으로만 잡았고, 철거 전 이름 목록으로 고정한 대조에서 「통로에서 사라진 이름 0」으로 확인했다.

## 3. [원칙 ③] 해결 방식

- 남은 배선 표(`remaining-wiring.before.json` `rows`)에서 이유가 「그 밖」(계획에 없던, 다시 생긴 줄)인 30개를 갈랐다: 종류가 통로를 포함하고 IIFE 안 잔존 참조 0 → 1차(가져오기·getter) 11개 · 잔존 참조 있음 → 2차(getter 만) 16개 · 종류가 window 뿐이고 가져오기 줄만 남은 `copyRealUserTemplate` → 1차 · 종류가 window 뿐인데 getter 가 있는 `initDevDebugButtons` → **제외** · 가져오기 줄만 남은 `openTemplateEncyclopediaModal`(참조 0) → 1차.
- 손잡이 줄: `_homeKit`(참조 0)과, `cloneTemplate` 을 지우면 참조가 0 이 되는 `_creatorTemplatesLegacyKit` 에 `dropKitVar`.
- `unwire-run.js apply --runs … --names-for …` 로 `proof.json` 을 쓰고 생성기를 돌렸다. 생성기가 멈춘 이름 0(29개 전부).

## 4. [원칙 ④] 재검토 (반례·부작용)

- **지운 이름이 통로에서 사라지지 않는가** → 철거 전 이름 목록(통로 431 · window 17)으로 대조: 통로에서 사라진 이름 0, 지운 통로 이름 27개가 27개 모두 남아 있고, 이름별 값 지문 차이 통로 0 · window 0, 불일치 0(`cell-registry-compare.before.json` · `cell-registry-compare.json` · `measurement.json` `summary.compare` · `fingerprints`).
- **가져오기 줄을 지운 이름을 IIFE 가 아직 쓰는가** → 생성기가 실행마다 잔존 참조를 보고 멈춘다. 멈춤 0.
- **X2 손잡이 줄(첫 실사용)** → `_creatorTemplatesLegacyKit` · `_homeKit` 두 줄. 생성기가 「그 실행의 삭제를 반영한 뒤 맨이름 참조 0」을 확인하고 지웠다. 되짚기에서 두 줄 모두 손잡이 줄로 분류됐고(`unwire-meta.json` `removed.kitVarLine`), push 전에 `recomputeSplit` 직접 호출과 로컬 법정 전체 실행으로 생성기 재실행 대조를 확인한다(8절).
- **허용 종류 밖의 줄** → 실행 11칸을 차례로 되짚어 기준 index.html 에서 작업 index.html 을 다시 만들었다: 같음(`onlyDeletions.rebuiltEqualsWork`), 허용 종류 밖 삭제 [] · names 밖 이름 []. 지운 것은 가져오기 13줄 · getter 속성 27줄 · 손잡이 2줄(합 42줄)과 쉼표 3글자.
- **세포가 실제로 그 이름을 읽는 길** → 시나리오 다섯 개가 지운 이름을 통로로 읽는 세포를 실제로 누른다: 샘플 정리(`toast` · `saveProfile` · `dispatchFullViewPropagation` · `renderRecordsScreen` · `triggerHapticFeedback`) · 빠른 목표 추가(`toast` · `saveProfile` · `dispatchFullViewPropagation` · `triggerHapticFeedback`) · 템플릿 마켓 창(`escapeHtml`) · 비밀번호 찾기 창(시동 때 부품 연결이 통로에서 읽어 건넨 `toast` · `closeModal` · `saveProfile` · `enterApp` · `performLogout`) · 게스트 여섯 탭 전환(시동 전체와 탭 그리기). 시나리오가 누르지 않는 이름은 이름 전수 대조와 값 지문으로만 말한다.
- **시험** → npm test 종료 코드 0 · 0, ✓ 줄 487 · 487, ok 줄 172 · 172, 기준에만 있는 줄 0 · 작업에만 있는 줄 0, 무결성 게이트 38/38.

## 5. [원칙 ⑤] 절차

1. origin/main 기준 작업 폴더 · `npm ci --ignore-scripts` · 기준 작업 폴더(분리 HEAD).
2. `pinned-names.cjs` → `remaining-wiring.cjs` 로 현재 남은 배선 재기 → 대상 가르기(3절).
3. `unwire-run.js apply` → `module-guard --update` → npm test 기준·작업 전경 실행 → `unwire-run.js measure` → `unwire-run.js claims`.
4. 남은 배선·덩어리 구성 다시 재기(`remaining-wiring.json` · `iife-composition.json`).
5. 서류 → `verify-integrity-gate.js` → `npm test` → 커밋 → `recomputeSplit` 직접 호출 · 로컬 법정 전체 실행 → origin/main 합치기 → push → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「다음 옮기기 PR 이 또 getter 를 달 테니 지금 지우는 것은 헛일이다」** → 남은 옮기기 대상은 함수 3개(그중 둘은 결심 대기)와 구역 이전뿐이다(`iife-composition.json`). 구역 이전은 다른 모드라 getter 를 다시 달지 않는다고 설계에 적혀 있지만 그 모드는 아직 없다 — 다시 생기면 같은 실행기로 다시 지운다. 지금 지우는 42줄은 기준선에 기록되고, 겹친 노출이 없어야 다음 측정(잔존 참조)이 흐려지지 않는다.
- **반론 2 「등록 목록에 있으면 다 지워도 된다」** → 아니다. `initDevDebugButtons` 는 등록 목록에 있지만 window 전용 등록이라 통로에는 index.html getter 로만 나간다(#911 대조에서 「통로에 처음 생긴 이름」으로 잡혔던 이름). 이 이름을 대상에서 뺐고, 대조의 「통로에서 사라진 이름 0」이 그 판단을 잰다.
- **재검증**: 실행기의 측정이 npm test 종료 코드 파일을 `exit=0` 꼴로 읽는다. 처음에 숫자만 적어 종료 코드가 비어 「같음 아님」으로 나왔다 — 파일 꼴을 맞추고 측정을 다시 돌렸다(종료 코드 0 · 0, 같음).

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-648/` 아래, 작업자 측정이다.

| 산출물 | 내용 |
|---|---|
| `proof.json` · `unwire-meta.json` | 생성기 설정(11칸)과 실행별 지운 줄 번호·종류 |
| `measurement.json` | 실행기 측정 한 벌(되짚기 · 줄 수 · 대조 · 지문 · 시나리오 · 모듈 로드 · npm test · 기준선) |
| `cell-registry-compare.before.json` · `cell-registry-compare.json` | 대조 탐침(이름 목록은 철거 전으로 고정) |
| `scenarios/c1~c5` · `scenario-local.json` | 게스트 시나리오 5개 기준·작업 |
| `module-load.json` · `npm-test-compare.json` · `raw/npm-test.{base,work}.{log,exit}` | 모듈 로드 · npm test |
| `pinned-names-now.json` · `remaining-wiring.before.json` · `remaining-wiring.json` | 시험이 붙잡은 이름 · 남은 배선(철거 전·후) |
| `iife-composition.json` | 이 PR 뒤 덩어리의 줄 구성(8절 표) |
| `court-local.json` | `recomputeSplit` 직접 호출 · 로컬 법정 전체 실행(커밋 뒤) |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: X2 가 법정의 재실행에서 어긋날 수 있다(첫 실사용) → push 전 `recomputeSplit` 직접 호출과 로컬 법정 전체 실행. 다른 index.html PR(TASK-ES-646)이 먼저 병합되면 main 판 index.html 로 apply 를 다시 돌린다(L071).
- **성과 측정**: inlineScriptLines 2392 → 2350(−42, 출처 `measurement.json` `summary.inlineScriptLines`).
- **남은 배선(이 PR 뒤, `remaining-wiring.json`)**: 등록됐는데 배선이 남은 이름 66개 — 가져오기 줄만 남음(IIFE 안 잔존 참조) 60 · 시험이 붙잡음 5(가져오기 5 · getter 5) · window 전용 등록 1(`initDevDebugButtons`, 가져오기 1 · getter 1). 등록되지 않은 이름의 getter 27개(38줄) · window 줄 17개. 지울 수 있는 손잡이 0.
- **덩어리 구성(이 PR 뒤, `iife-composition.json` — IIFE 2,328줄, 줄 합 일치)**:

| 종류 | 문 | 줄 | 다음 단계 |
|---|--:|--:|---|
| 함수 선언 | 3 | 986 | `openProTemplateRecordModal` 944 · `saveGoogleToken` 25 · `setupUserSessionRealtime` 17 — 앞 둘은 결심 대기·다른 작업, 셋째는 setter 선행 뒤 이전 |
| 그 밖의 var(상태·상수·DOM 참조) | 32 | 175 | 통로 노출 18 · 재대입 11 · DOM 참조 14 — 상태 이전 2차·구역 이전 |
| 키트 가져오기 | 167 | 167 | 잔존 참조가 풀리는 대로 철거(구역 이전이 로드 중 문을 옮기면 풀린다) |
| 로드 중 호출문(3줄 이하) | 86 | 88 | 구역 이전 |
| 통로 노출(expose) 호출 | 15 | 64 | 등록 안 된 이름·붙잡힌 이름의 getter — 상태 이전·시험 변경 결심 뒤 |
| 상태 기관 호출(define·defineVar) | 50 | 55 | 구역 이전 |
| if 블록(그 밖, 3줄 이하) | 13 | 22 | 구역 이전 |
| window 대입(그런 줄만 담은 if 블록) | 8 | 14 | 구역 이전·시험 변경 결심 |
| 키트 손잡이 | 13 | 13 | 가져오기가 0 이 되면 X2 |
| try 문 | 2 | 8 | 구역 이전(테마 초기화 7줄 포함) |
| window 대입(문) | 9 | 8 | 구역 이전 |
| 껍데기 | – | 3 | finalize |
| 주석 | – | 501 | sweep·구역 이전 |
| 빈 줄 | – | 224 | sweep·구역 이전 |

  4줄 이상 로드 중 문은 try 문 하나(테마 초기화 7줄)만 남았다. 공식 지표 inlineScriptLines 2,350 은 IIFE 2,328줄에 다른 인라인 블록 둘(22줄)을 더한 값이다.
- **PLAN 체크리스트**: [4단계: 심사 청구]까지만 기록한다(`.claude/plan-TASK-ES-648.md`).
