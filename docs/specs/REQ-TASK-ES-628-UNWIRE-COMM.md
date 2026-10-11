# REQ — 미분화 덩어리 해체 B7: 소통 키트(_commKit) 배선 철거 1차·2차

- Task ID: **TASK-ES-628** (L012: 오케스트레이터가 번호를 배정했고, `gh pr list --state all --limit 40` · `git ls-remote origin` 에서 628 이 비어 있음을 다시 확인한 뒤 빈 브랜치 `feat/2026-10-11-task-es-628-unwire-comm` 을 먼저 push 해 선점했다.)
- 상민님 지시 원문(2026-10-11, 커맨드센터 세션 309dca5d): 「남은 미분화작업 모두 진행해 병합도 스스로 진행해. 모든 작업 마칠때까지 멈추지 마.」
- 지시함(origin/main): **DIR-003**(「키트별 철거: settings → goals → ui → records → comm → …」 · 철거 PR 마다 기준선에 inlineScriptLines 기록 — 줄지 않으면 실패) · **DIR-004**((가) 생성기 줄 종류 닫힌 목록 · (다) 시험이 글자로 붙잡는 연결선 이름은 남긴다).
- 분류: INFRA · 작업 유형(SNOWBALL 분류): **(가) 표준 — 「배선 철거」 다섯째 사례**. 작업참고(기준 PR #897, 1ab4bc0b). 선례 #891·#894·#896·#898(넷 다 판정 「통과」·R1 동작 보존 확인)의 절차와 실행기를 그대로 따른다. 새로 쓰는 생성기 기능·도구 변경 없음.
- 착수 기준 main bc8af5bc(#898 병합) · push 전 합친 main 6d4cba9f(#899 생성 지도 갱신 · #901 무결성 게이트 단언 수정 — 그 사이 `index.html`·`js/**`·`tests/**`·`court/**`·기준선·도구 차이 0, `scripts/verify-integrity-gate.js` 만 #901 이 바꿨다. 합친 뒤 npm test·측정·로컬 법정을 다시 돌렸다).
- 설계 정본: docs/architecture/CELL-REGISTRY-DESIGN.md 3.1·3.2·4절·5.1(U1~U3)·6.2. 철거 계획 입력: `reports/TASK-ES-614/unwire-plan.json`.
- 측정은 전부 「작업자 측정, 판정 아님」이다. 판정은 GitHub 법정만 낸다.

## 0. 요구 (지시 항목)

| ID | 지시 | 출처 | 완료 기준 |
|---|---|---|---|
| R1 | index.html 인라인 IIFE 에서 `_commKit` 배선 두 실행을 생성기 unwire 로 지우고 앱 동작을 보존한다(손 편집 0): ① 1차(가져오기·getter·window) ② 2차(가져오기 줄은 남기고 getter) | DIR-003 「키트별 철거: comm」 · 오케스트레이터 지시 | 소통 탭 조작 시나리오와 게스트 여섯 탭 시나리오가 기준·작업 양쪽에서 통과 · 법정의 생성기 재실행 결과와 index.html 이 바이트 동일 |
| R2 | 지운 이름은 등록 기관(own)이 같은 값으로 내준다 | 설계 3.1·3.2 | 철거 전 이름 목록으로 대조해 불일치 0 · 통로에서 사라진 이름 0 · 이름별 값 지문 차이 0 |
| R3 | 지우는 대상은 설정이 허용한 줄 종류(U1~U3)뿐 · names 밖 이름·함수 본문·그 밖의 글자 불변 · 바뀐 제품 파일은 index.html 하나 | DIR-004 (가) · 설계 5.1 | 실행을 차례로 되짚어 만든 결과 == 작업 index.html · 허용 종류 밖 삭제 줄 0 |
| R4 | 증명 하한과 기준선 기록 | 설계 4절 「배선 철거」 · DIR-003 | inlineScriptLines 감소와 `module-guard --update` 기록 · 모듈 로드 새 회귀 0 · npm test 동일·폐기 0 · tests/·금고·생성기·등록 기관·도구 변경 0 |

원문에 있는데 이 PR 에 없는 것(목표 줄에 남긴다): 「남은 미분화작업 모두」 — 시험이 배선 글자를 붙잡는 이름(`toggleFeedPostPreview` 등), 손잡이 줄(X2), 나머지 키트(_calendarKit·기타·`_xp`)는 다음 PR 들이다.

### 구체 식별자

- 고친 제품 파일: `index.html` 하나 — 인라인 IIFE 의 `var X = _commKit.X;` 54줄 · `OurgoalAppScope.expose('index.html', { get X(){ return X; }, … })` 속성 56줄(빈 껍데기 5문) · `window.X = X;` 8줄 · 쉼표 6글자(생성기 산출 그대로)
- 기록: `docs/architecture/module-baseline.json`(`node scripts/module-guard.js --update` 가 54번째 항목을 더함) · `docs/rules/TICKETS.md` · `reports/TASK-ES-628/`
- 손대지 않은 것: `js/**` 전부 · 생성기 · 실행기(`unwire-run.js`) · tests/ · 금고 · 그 밖의 생성 지도(L009)
- 화면 식별자(시나리오): `.navbtn[data-tab=…]` · `.comm-subtab[data-sub="group"]` · `[data-sub="manito"]` · `[data-sub="share"]` · `[data-sub="feed"]`
- 지운 이름 57개의 목록은 `reports/TASK-ES-628/proof.json` `unwire[0..1].names`(예: `renderCommGroups` · `renderCommManito` · `renderCommShare` · `renderCommFeed` · `renderCommScreen` · `ensureFeedPostsLoaded` · `toggleFeedReaction` · `loadSharedGroups` · `manitoState` · `renderCrewPacingWidget` · `focusHomeCheckinInput` · `nudgeCrewMates`)

## 1. [원칙 ①] 문제를 정확히 파악한다

- #898 뒤 index.html 인라인 줄 수는 3,340(module-metrics, 기준 bc8af5bc)이다. 소통 키트의 배선은 계획상 1차 123줄 · 2차 3줄이었고, 현재 main 에서 실제로 돌리니 1차 125줄 · 2차 3줄이다(앞선 철거로 같은 expose 문의 다른 속성이 먼저 지워져 빈 껍데기 줄이 이번 실행 몫이 됐다 — 이름은 계획 57개 그대로).
- 소통 키트의 이름은 소통 탭의 네 구획 그리기(`renderCommGroups`·`renderCommManito`·`renderCommShare`·`renderCommFeed`), 피드 글·댓글·반응, 모임·마니또 상태, 공유 이미지 그리기다. 소통 화면 세포(`js/tabs/comm/render.js` `renderCommScreen`)가 구획을 누를 때마다 통로(`L.renderComm…`)로 부른다.
- 2차 대상 3개(`renderCommFeed`·`renderCommScreen`·`daysFromNow`)는 IIFE 안 남은 코드가 아직 맨이름으로 쓰는 이름이라 가져오기 줄은 남긴다.

## 2. [원칙 ②] 본질·원인·중심·핵심

- **본질**: 중계선을 걷어 낸다. 이름과 값은 그대로, 내주는 길만 등록 기관 하나로 줄인다.
- **원인**: 함수는 세포로 옮겨졌지만 index.html 이 다시 끌어와 통로와 window 로 내주는 줄이 남았다.
- **중심**: 생성기 unwire 한 번, 설정 `reports/TASK-ES-628/proof.json` 의 `unwire` 배열 두 칸.
- **핵심**: 지운 뒤에도 이름 하나하나가 같은 값으로 나가는지를 이름 전수 대조로 잰다. 화면 조작은 구획 네 개를 실제로 눌러 그 통로 호출이 예외 없이 도는지를 본다.

## 3. [원칙 ③] 해결 방식

1. `node docs/design/harness/module-split/unwire-run.js apply . --task TASK-ES-628 --runs _commKit:1,_commKit:2` — 계획의 이름 그대로(멈춘 이름 0).
2. `node scripts/module-guard.js --update`.
3. 시나리오 둘 — (가) 게스트 여섯 탭 (나) 소통 탭에서 하위 구획을 모임→마니또→공유→피드 순서로 누름: 누를 때마다 `renderCommScreen` 이 화면을 다시 그리며 통로의 `renderCommGroups`·`renderCommManito`·`renderCommShare`·`renderCommFeed` 를 부른다(넷 다 이번에 getter 줄을 지운 이름).
4. `unwire-run.js measure` · `claims` — 선례와 같다. 실행기 사용법은 docs/specs/REQ-TASK-ES-624-UNWIRE-UI.md 3절.

## 4. [원칙 ④] 재검토 (반례·부작용)

- **지운 이름이 사라지지 않는가** → 철거 전 이름 목록(통로 423 · window 199)으로 대조: 통로에서 사라진 이름 0, 지운 통로 이름 54개 중 54개·지운 window 이름 8개 중 8개가 철거 뒤에도 있고, 이름별 값 지문 차이 0.
- **`loadSharedGroups` 는 다른 파일도 window 에 대입하던 이름인가** → #889 의 겹침 이름 표에서 겹치는 것은 `SHARED_GROUPS_LOADED`(등록되지 않은 상태 이름 — 이번 대상 아님)였다. `loadSharedGroups` 의 window 값 지문은 철거 전후 같다.
- **`manitoState`·`manitoInbox` 같은 상태처럼 보이는 이름** → 값 지문으로 보면 함수다(`function:manitoState`·`function:manitoInbox`, `cell-registry-compare.json`). 등록 기관은 같은 함수 참조를 내준다 — 대조(`===`) 불일치 0. `SIM_PERSONAS` 같은 배열은 같은 객체 참조다(대조 불일치 0).
- **인라인 처리기가 부르는 window 이름**(`focusHomeCheckinInput`·`nudgeCrewMates`) → 홈의 크루 버튼(`#btnCrewStartCheckin` 등)의 onclick 이 부른다. 누르는 시나리오에는 넣지 않았다(게스트 화면에서 그 버튼에 닿는지는 재지 않았다). window 값 지문으로 쟀다.
- **2차 이름의 가져오기 줄** → 2차 실행의 가져오기 삭제 0줄. 게스트 부팅 예외 0.
- **허용 종류 밖의 줄** → 실행마다 지운 줄이 전부 세 종류에 든다(밖 0). 확장 종류(X1·X2·X3) 사용 0.

## 5. [원칙 ⑤] 절차

1. origin/main(bc8af5bc) 기준 worktree · 번호 선점.
2. `apply`(두 실행) → 지운 이름·줄 확인.
3. 시나리오를 기준·작업에서 로컬 실행.
4. `module-guard --update` → npm test 기준/작업 전경 실행(✓ 줄·ok 줄 수까지 비교) → `measure` → `claims`.
5. `verify-integrity-gate` → 커밋 → origin/main 확인(움직였으면 합치고 다시 측정) → 로컬 법정 전체 실행과 `recomputeSplit` 직접 호출(실제 커밋 대상) → push → PR.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1 「소통은 게스트로 거의 못 쓴다 — 화면 시나리오가 의미 없다」** → 게스트는 실제 모임·동료·피드 글이 없어 구획 안의 내용(글 카드·반응·댓글)은 그려지지 않는다. 그래도 구획 네 개를 누르면 그 구획을 그리는 함수 넷이 통로로 실제로 불린다 — 이름이 빠졌다면 `L.renderComm… is not a function` 예외가 나고 `noExceptions` 가 잡는다. 내용이 있는 화면은 측정불가로 적고, 중심 증거는 이름 전수 대조와 값 지문에 둔다.
- **반론 2 「구획을 누른 결과로 활성 표시만 보는 것은 약하다」** → 활성 표시(`active`)는 `renderCommScreen` 이 다시 그릴 때 붙는다 — 다시 그리기가 끝까지 돌았다는 표지다. 법정의 보존 대조는 그 위에 단계마다 화면 전체(DOM)·저장값·오류 수를 기준 2회와 맞댄다. 구획 내용이 기준과 한 글자라도 다르면 「상태 불일치」로 잡힌다.
- **재검증**: 계획의 예상 삭제 줄(123 + 3)과 실제(125 + 3)가 2줄 다르다 — 이름과 줄 종류는 같고, 앞선 키트 철거로 비게 된 expose 문 껍데기가 이번 실행에서 지워진 것이다(`unwire-meta.json` runs[0] `removed.exposeCalls` 5). 실행을 되짚어 만든 결과가 작업 index.html 과 같고 허용 종류 밖 삭제 0 이다.
- **재검증**: 구획 그리기가 시각·난수에 따라 달라져 법정의 기준 2회 화면이 다를 수 있다(공유 구획의 이미지 그리기 등) → push 전 로컬 법정 전체 실행으로 확인한다(7절).

## 7. [원칙 ⑦] 단계별 실행 (측정 산출물)

모두 `reports/TASK-ES-628/` 아래. 수치는 `measurement.json` 이 각 결과 파일에서 읽어 모은 것이다(L002).

| 파일 | 무엇 |
|---|---|
| `proof.json` | 생성기 설정: `unwire` 배열 2칸 — `_commKit` 세 종류 54개 · `_commKit` imports:false 3개 · cells `js/core/cell-registry.js` |
| `unwire-meta.json` | 실행별 생성기 산출: ① 125줄(가져오기 54 · 속성 53 · window 8 · 빈 expose 껍데기 5문) ② 3줄(속성 3) — 합 128줄 · 쉼표 6 · index.html 5610 → 5482줄 |
| `cell-registry-compare.before.json` · `cell-registry-compare.json` | 대조: 불일치 0 · 통로에서 사라진 이름 0 · 예외 0 · own 438 |
| `scenario-local.json` | 시나리오 2개 기준·작업 통과(비공허 단언 13 · 9), 예외 0/0 |
| `module-load.json` | 새 회귀 0 |
| `npm-test-compare.json` · `raw/` | npm test 기준/작업 종료 코드·✓ 줄·ok 줄 수·요약 비교(값은 측정 기록) |
| `measurement.json` | 위 전부 + 제품 파일 = index.html 하나 · 되짚기 결과 == 작업 index.html · inlineScriptLines 3340 → 3212(−128) · 기준선 마지막 기록 = 측정값 · module-guard 종료 0 |
| `claims.json` | 주장(보존 2 + 기록 17) |
| `court-local.json` | 로컬 법정 전체 실행 요약(작업자 PC — 판정 아님) |

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- **예상**: main 이 움직이면(지도 갱신 PR) 합친 뒤 npm test·측정·로컬 법정을 다시 돌린다.
- **예상**: 로컬 법정 실행이 도중에 끊기면 요약을 쓰지 않고 다시 돌린다.
- **측정불가**: 모임·동료·피드 글이 있는 계정에서의 소통 탭 화면(글 카드·반응·댓글·마니또 편지·초대·공유 이미지) · 홈의 크루 페이싱 위젯 버튼 · 로그인 뒤 동작 · 실시간 통신 · 운영 환경.
- **성과 측정**: inlineScriptLines 3340 → 3212(−128, 출처 `measurement.json` `summary.inlineScriptLines`). #891·#894·#896·#898 과 합쳐 4003 → 3212.
