# 에이전트 공통 작업참고 (아워골)

> **기준 PR #975** (3a02bec793ec8e99d58ce7dccaa0703671d2c8c8) · 생성 2026-10-14 01:14 KST · 경험칙 131개
> 대상: Claude · 안티그래비티 · 코덱스 — 작업을 시작하기 전에 이 파일을 끝까지 읽고 따른다.
> 정본: C:/dev/agent-knowledge/lessons.json (경험칙 원장) → 이 파일은 생성물이다. 손으로 고치지 않는다.

## 0. 이 프로젝트에서 일하는 사람과 원칙

- **결정권자는 상민님**이다. 코드·터미널을 직접 만지지 않는다. 답은 짧게 온다("진행", "승인", "1").
- **묻는 것은 다섯 가지뿐**(승인선): ① 돈 ② 개인정보 수집 확대 ③ 기존 기능의 실제 삭제 ④ 되돌릴 수 없는 바깥 행위(발행·외부 전송·영구 삭제) ⑤ 규범·승인선 자체 변경(헌법·금고). 이때만 `[결심 필요]` 로 멈춘다. 나머지는 가장 합리적인 것을 고르고 `[기본값]` 으로 표시한 뒤 계속한다.
- **판정은 법정만 낸다**: 작업자는 `reports/TASK-ES-xxx/claims.json` 에 주장만 적는다. 합격은 GitHub 법정(`node court/chat.js <PR>`) 판정서뿐이다. 자기 결과를 「통과」라고 부르지 않는다 — 「작업자 측정, 판정 아님」.
- **상태는 측정이다**: 수치는 스크립트 산출(예: `node scripts/module-metrics.js`)을 출처와 함께 인용한다. 못 쟀으면 `null`·「측정불가」. 손으로 옮긴 숫자 금지. 한글은 리터럴(`\uXXXX` 조립 금지), 파일은 utf8.
- **금고(동결)**: `court/**`, `AGENTS.md`/`CLAUDE.md`/`GEMINI.md`, `.githooks/**`, `.github/workflows/**`, `scripts/essence-gate.js`, `scripts/verify-integrity-gate.js`, `.claude/settings.json`, `package.json` scripts, `vercel.json` 일부 — 고치지 않는다.

## 0-1. 작업 유형 분류 — 표준 · 이탈 · 탐색 (헌법 SNOWBALL, v2026.10.06)

일을 받으면 5단 추론의 「분류」에서 먼저 이 일이 아래 경험칙·절차의 어느 유형인지 대조한다. 목표는 속도가 아니라 **품질** — 추론의 깊이를 그 작업의 성격에 맞춘다.

| 판정 | 언제 | 해야 할 것 |
|---|---|---|
| **(가) 표준** | 이 파일에 그 유형의 방식이 있다 | 그대로 따른다. 설명 불필요 |
| **(나) 이탈** | 방식은 있는데 이 작업에 맞지 않는다 | 벗어나도 된다. 단 작업 기록(REQ·보고)에 ① 어느 규칙이 ② 왜 맞지 않는지(사실 근거) ③ 대신 무엇을 했는지 ④ 검증이 같은 수준 이상인지 — **네 가지를 적는다**. 안 적으면 위반 |
| **(다) 탐색 · 새 유형** | 이 파일에 그 유형이 없다 | 「새 유형」이라고 선언한다 → 가까운 유형 2~3개를 빌리고 안 맞는 점을 구분 → 5단 추론을 평소보다 깊게(8원칙 전부·자기 반론 2개 격파·실패 지점 예측) → **결과를 증명할 검증 방법을 먼저 설계**하고 측정 → 끝나면 그 유형과 방식을 lessons.json 에 올린다(다음엔 표준) |

**불변층 — 어떤 유형에도 예외 없음**: 승인선 다섯 가지 · 판정 분리(자기 채점 금지) · 상태는 측정 · 데이터 무손실 · 금지문(훅 우회 · 금고 수정 · 가짜 데이터 · CSS 은폐).

**면죄부 금지**
- 유연함은 **방법**에만. 검증을 줄이거나 증명을 약하게 하는 쪽으로 쓸 수 없다. 「참고에 없어서」·「표준이 안 맞아서」는 불변층·품질 기준의 면제 사유가 아니다.
- 입증 책임은 벗어난 쪽에 있다. 기존 유형이 있는데 「새 유형」이라고 하거나, 이탈하며 검증이 약해지거나, 같은 이탈을 반복하면 오용 — 발견한 사람은 경험칙으로 올린다.
- 결과는 유형과 관계없이 같은 법정 · 같은 기준으로 판정받는다.

**질의**(「어때?」·「이해했어?」·검토)는 코드를 건드리지 않고, 근거를 들어 깊게 추론해 답한다. 불확실한 것은 불확실하다고 쓴다.

## 1. 착수 전 5단 추론 (Claude 가 실제로 하는 방식)

일을 받으면 코드를 만지기 전에 머릿속(또는 계획서)에 다섯 칸을 채운다.

| 단계 | 질문 | 예시 (어려움 묶음 하나를 세포로 옮기기) |
|---|---|---|
| 이해 | 무엇을, 왜? 완료는 무엇으로 재나? | 인라인 묶음 X 를 동작 그대로 세포로. 완료 = 토큰 동일·화면 차이 0·법정 판정 병합 기준 |
| 분류 | 고치기인가 옮기기인가? 승인선에 닿나? 시험지 선행이 필요한가? | 옮기기(버그도 그대로). 돈 이름 없음. 시험지 `inline-hard-test-probe` 로 확인 |
| 예측 | 어디서 막히나? | main 이 움직여 충돌(L010) · 시험지가 원본만 읽음(L021) · 숨김 든 묶음(L017) |
| 반론 | 내 계획의 가장 강한 반대 2개는? | "생성 지도까지 커밋해야 정확하다" → 아니다, 병렬 충돌의 원인(L009). "전체 줄 수를 주장하면 설득력 있다" → main 합치면 거짓(L002) |
| 선택 | 그래서 무엇을 어떤 순서로? | 시험지 선행 PR → 생성기 이동 → verify → 시나리오 → main 합치기 → PR → 판정 |

## 2. 문제해결 8원칙 (막혔을 때 이 순서로)

① 문제를 정확히 파악한다(증상·재현·측정값) → ② 본질·원인·중심·핵심을 구분한다(증상이 아니라 배선) → ③ 해결 방식 후보 → ④ 재검토(반례·부작용) → ⑤ 절차를 적는다 → ⑥ 절차를 다시 검증하고 반론을 격파한다 → ⑦ 단계별로 실행한다 → ⑧ 막힐 지점을 미리 예상하고 성과를 측정한다.
같은 마찰이 3번이면 개별 사고가 아니라 규칙·구조 문제다 — 이 파일의 경험칙으로 올린다.

## 3. 작업 흐름

`REQ(docs/specs/REQ-TASK-ES-xxx.md, 8원칙 섹션·구체 식별자)` → `작업계획서(작업 트리 안 .claude/plan-xxx.md)` → `코드(새 worktree, origin/main 기준)` → `주장(claims.json)+시나리오` → `push 직전 origin/main 합치기` → `PR` → `법정 판정` → `병합(오케스트레이터)` → `세포지도·이 파일 갱신`.

- 작업마다 별도 worktree: `git -C C:/dev/ourgoal-app worktree add C:/dev/wt/<이름> -b <브랜치> origin/main`. 다른 세션의 worktree·본 체크아웃은 건드리지 않는다.
- 커밋 훅은 `NODE_PATH=C:/dev/ourgoal-app/node_modules` 가 필요하다(같은 셸에서 export).
- 커밋 메시지: `[INFRA|FIX|E1..] #TASK-ES-xxx <type>: <한글 요약>`.

## 4. 병합 기준 (MERGE_GATE 요약)

- 판정 「통과」 → 병합.
- 「확인 부족」 → 부족 사유가 전부 법정 도구 한계(진짜 계정·진짜 폰) 또는 옮기기 PR 의 「고칠 게 없었음」뿐이면 병합. 주장 없는 제품 파일·잴 수 있는데 안 잰 항목이 있으면 고친다.
- 「돌려보냄」·「심사 못 함」 → 병합하지 않는다(심사 못 함이 도구 고장이면 재push, L007).
- 시험지 선행 PR → `gh pr diff` 로 tests/ 의 지운 줄에 단언이 없음을 확인한 뒤 병합.
- 금고·헌법·지시함·승인선 변경 → 위임 병합 대상 아님(상민님 문구 필요).

## 5. 보고 형식

- 결심 불필요: 「한 것 / 측정으로 검증한 것 / 다음에 열리는 것」. 질문으로 끝내지 않는다.
- 결심 필요: `[결심 필요]` + 권장 결정 하나 + 승인 시 즉시 하는 것과 그 다음 열리는 것 + 선택지별 장점·단점·예상 결과 + 기타 최대 3.


<!-- TASK-ES-584 shared-learning-entry -->
공통 작업학습 도구 안내: C:/dev/agent-knowledge/shared-learning.js (출처 병합 66ce3a630d1c7dfc81550901f6356b2c0fb8b6b9)를 어느 작업 폴더에서든 사용할 수 있다. 사용법: C:/dev/agent-knowledge/shared-learning-runtime/66ce3a630d1c7dfc81550901f6356b2c0fb8b6b9/docs/agents/shared-learning/README.md
기존 WORK-REFERENCE 전체 읽기를 유지한다. 명시한 참여자의 역할·담당 파일·허용 행위로 bootstrap 브리프를 만든다. node C:/dev/agent-knowledge/shared-learning.js bootstrap --repo-root <실제전용작업폴더> --participants <참여계약.json> --task-id <TASK> --task-kind <유형> --out <작업폴더/학습진입.json> --brief <작업폴더/학습지침.md>
작업별 원시/게시 증거와 실제 제품 입력을 validate한 뒤 collect로 C:/dev/agent-learning-events 공유 저장소에 보완 후보를 남긴다. 다음 bootstrap에서 최근 보완 후보를 읽는다. 실행하지 않은 것은 미측정, 작업자 측정과 독립 법정 판정을 구분한다. 도구명으로 권한을 넓히지 않으며 원장/규칙 자동 승격은 없다.
<!-- /TASK-ES-584 shared-learning-entry -->

## 경험칙 — 분야별 (확인 횟수가 많을수록 자주 부딪힌 것)

### 법정·주장 (14)

**L005. 옮기기(분열) PR 의 「확인 부족 — 고칠 게 없었음」은 정상 판정으로 받아들이고 병합 기준에 넣어라.**
- 왜: 동작 0 변경 이동은 기준에서도 시나리오가 통과하므로 법정이 「고치기 전엔 안 됨」을 볼 수 없다. #764·#772·#773·#775·#781·#785·#786·#788 모두 이 형태로 병합됐다.
- 어떻게: 판정 부족 목록이 「고칠 게 없었음」과 실계정·실기기 한계뿐이면 병합. 다른 사유(주장 없는 제품 파일, 잴 수 있는데 안 잼)가 섞이면 병합하지 않고 고친다.
- 출처: #764 #772 #773 #775 #781 #785 #786 #788 #840 #911 · 처음 2026-10-05 · 확인 10회 · 대상 claude·codex

**L002. main 이 움직이면 값이 바뀌는 전체 수치(인라인 전체 줄 수·세포 수·기준선 현재값·main 커밋 해시)를 주장에 쓰지 마라.**
- 왜: #750 은 인라인 32,509줄, #749 는 기준선 history 수치를 주장했다가 main 을 합치자 거짓이 되었고, 철회하면 막다른 길이라 두 PR 모두 닫고 새 PR(#755·#754)로 다시 냈다.
- 어떻게: 옮긴 묶음 자체의 성질(토큰 동일·새 파일 줄 수·원래 구간 사라짐)만 주장한다. 전체 수치가 꼭 필요하면 이 PR 이 소유한 reports/TASK-ES-xxx/snapshot-*.json 을 가리키게 한다(#762 C17·C28·C29).
- 출처: #749 #750 #754 #755 #762 #814 · 처음 2026-10-05 · 확인 5회 · 대상 claude·antigravity·codex

**L001. 화면 파일(index.html·js 화면 세포)의 동작 주장은 처음부터 게스트 화면 시나리오로 내고, 글자 확인(codeContains) 주장은 문서·설정·신고서에만 써라.**
- 왜: #745 성소 분열이 화면 파일에 글자 확인 주장을 냈다가 「분야 하향 표기」로 돌려보내졌고, 철회·종류 변경을 해도 법정이 옛 시험을 다시 돌려 같은 PR 에서 막다른 길이 됐다(judge.js REHEARD_OK).
- 어떻게: reports/TASK-ES-xxx/scenarios/ 에 세포마다 하나씩 게스트 시나리오를 둔다. push 전에 로컬 법정 실행기로 기준(origin/main)에서 실패·작업에서 통과(고치기) 또는 양쪽 통과(옮기기)를 확인한다. scenario 경로는 claims.json 디렉터리 기준 상대경로(scenarios/name.json)로 쓴다. push 전에 path.resolve(dirname(claimsFile), scenario)로 실제 파일 존재를 검사한다. #835는 파일이 제출되어도 저장소 기준 경로를 적으면 시험 미제출로 처리되는 것을 확인했다.
- 출처: #745 #747 #835 · 처음 2026-10-05 · 확인 4회 · 대상 claude·antigravity·codex

**L003. 같은 PR 에서 이미 「안 됨」을 받은 주장은 철회하거나 종류를 바꾸지 말고, 막혔으면 경위를 댓글로 남기고 PR 을 닫은 뒤 같은 코드로 새 PR 을 연다(A안 선례).**
- 왜: 법정은 한 번 안 됨을 받은 주장이 철회·변경되면 옛 시험을 재실행해 계속 돌려보낸다. 상민님이 #745 에 A안(닫고 새 PR)을 승인했다.
- 어떻게: gh pr close <번호> --comment "경위·대체 PR" → 새 브랜치·다음 빈 TASK 번호로 같은 코드 → 주장을 처음부터 올바른 종류로.
- 출처: #745 #747 #750 #755 · 처음 2026-10-05 · 확인 3회 · 대상 claude·codex

**L006. 법정 도구 한계 사유(needs-login·needs-real-device 등)는 정말로 법정이 잴 수 없는 것에만 쓰고, 게스트 화면으로 잴 수 있는 것을 한계로 돌리지 마라.**
- 왜: #767 첫 판정이 「잴 수 있는데 재지 않음」으로 돌려보냈다. 관리자 복구처럼 로그인 뒤에만 도는 경로만 needs-login 이 받아들여졌다.
- 어떻게: elementFromPoint·게스트 시나리오로 닿는지 먼저 실측하고, 닿지 않는 근거(로그인 필요·실기기 필요)를 cannotBecause 에 적는다.
- 출처: #767 #783 #833 · 처음 2026-10-05 · 확인 3회 · 대상 claude·codex

**L051. reports 아래 측정 보고 파일의 값 적재 주장은 등록된 config 분야로 쓰고, 제품 동작 주장은 별도 실제 화면 시나리오로 검증하라.**
- 왜: #829 첫 판정 B75440DD에서 미등록 architecture 분야의 보고서 주장 25개가 unknownDomainFloor L4로 올라 부족이 되었다. 동일 ID·종류·검사·기대값을 유지하고 config로 바로잡은 d8f60034의 재심 9003CA06은 보고서 기록을 L1 충분으로 확인했다.
- 어떻게: court/grade-floors.json의 등록 분야를 읽는다. reports-only jsonPath 주장은 config, 제품 파일은 해당 분야의 실제 시나리오. 보고값이 적혀 있음은 법정이 실제 UI·실계정 결과를 재측정했다는 뜻이 아니다. 분류를 교정할 때 주장 철회·종류·기대값 변경 없이 원문을 유지한다.
- 출처: #829 #831 #839 · 처음 2026-10-06 · 확인 3회 · 대상 claude·antigravity·codex

**L106. 로그인 뒤 실시간·상대방 화면 동작 주장은 분야 multi-user·사유 needs-live-server 로 사실대로 unverified 에 적고, 확인 방법을 단계로 남겨라.**
- 왜: PR #923 의 R3(로그인 뒤 세션 채널 구독·다른 기기의 원격 로그아웃 방송을 받아 로그아웃)은 법정이 외부 통신을 막아 로그인도 실시간 방송도 할 수 없어 「확인 못 함」이 됐다. 판정은 「확인 부족」(지시 5건 중 동작 보존 확인 1·글자 확인 3·확인 못 함 1)이고 도구 한계뿐이라 위임 병합 기준에 따라 병합됐다.
- 어떻게: claims.json 의 claim 을 kind unverified·domain multi-user·reason needs-live-server 로 쓰고 who(실서버에 실계정으로 두 기기에서 로그인할 수 있는 사람)와 how(기기 A·B 로그인 → A 에서 다른 기기 로그아웃 → B 가 안내와 함께 로그아웃되는지)를 적는다. 근거: docs/specs/REQ-TASK-ES-653-USER-SESSION-REALTIME-MOVE.md 및 reports/TASK-ES-653/claims.json C2.
- 출처: #923 #930 · 처음 2026-10-11 · 확인 2회 · 대상 claude·antigravity·codex

**L004. 「주장 없음 → 확인 못 함」이 뜨면, 코드를 바꾼 항목은 시나리오 주장을 붙이고, 보고만 한 항목은 지시 항목(requirements)에서 내려 outOfScopeReports 로 옮겨라.**
- 왜: #767 결함 PR 이 보고만 한 항목(챌린지 룸·위젯 시험 등)을 지시 항목에 남겨 「주장 없음」으로 병합 기준을 막았다. 내린 뒤 통과 기준을 충족했다.
- 어떻게: claims.json requirements 에는 이 PR 이 실제로 바꾼 것만. 판정받은 주장은 지우지 말고 철회 표시. 바꾸기 전 로컬 법정으로 재심 결과 확인.
- 출처: #767 · 처음 2026-10-05 · 확인 1회 · 대상 claude·codex

**L007. 법정 판정 「심사 못 함 — 부팅 탐침 도구 오류(Chrome 디버그 포트)」는 코드 문제가 아니니 main 을 합쳐 다시 push 해서 재심을 받아라.**
- 왜: #786 이 Chrome 디버그 포트 실패로 심사 못 함이 나왔고, main 합쳐 재push 하자 정상 판정이 나왔다.
- 어떻게: git merge origin/main → push. 같은 고장이 두 번 나면 오케스트레이터에 보고.
- 출처: #786 · 처음 2026-10-05 · 확인 1회 · 대상 claude·antigravity·codex

**L008. 시험 검사의 기대값을 바꾸는 PR 은 상민님의 정확한 문구 「금고 변경 승인」이 있어야 병합된다는 것을 미리 알리고 결심을 받아라.**
- 왜: #791(주간 집중 25분 삭제)은 기대값 25→0 변경을 법정이 기존 검사 폐기·수정으로 보고, 「A안으로 진행해」 승인으로는 칸이 풀리지 않아 「금고 변경 승인」 문구가 필요했다.
- 어떻게: 기대값 변경이 필요하면 결심 요청에 「승인 문구는 『금고 변경 승인』이어야 함」을 같이 적는다. claims retire 에 승인 원문 인용.
- 출처: #791 · 처음 2026-10-05 · 확인 1회 · 대상 claude·codex

**L045. 로그인 뒤 경로 묶음은 --guest --count 로 도달을 먼저 재고, 로그인 뒤 동작 지시 항목에는 needs-login 주장 하나만 건다. 실계정 결과 파일은 별도 기록 항목(config)으로 분리한다**
- 왜: #802 1차(71a0e79): 같은 항목에 needs-login + 결과 파일 static 4개를 걸자 항목 전체가 「코드만 확인」으로 부족 목록에 올랐다. 2차(d9cd3e9): 분리하니 needs-login 은 「도구 한계」, 기록 항목은 「글자만 확인(충분)」으로 찍혀 병합 기준 충족. 법정은 로그인 뒤 화면을 다시 돌릴 길이 없다
- 어떻게: docs/architecture/INLINE-STAGE3-DESIGN.md 3-1(도달 실측)·3-2(기준1→작업→기준2 읽기 전용 비교, 쓰기 차단)·3-4(두 주장 배치). 보고에서 「글자만 확인」을 로그인 뒤 화면 확인으로 적지 않는다
- 출처: #802 · 처음 2026-10-06 · 확인 1회 · 대상 claude·antigravity·codex

**L085. 법정 판정서의 retire 안내는 바뀐 단언 앞 20줄까지만 검사 제목과 맞대므로, 단언을 36줄 넘게 바꾼 시험지는 21번째 줄부터의 검사에 「폐기 신청했지만 깨지지 않은 검사」 알림이 뜰 수 있음을 REQ 에 적어라.**
- 왜: PR #900 의 판정서는 scripts/smoke-test.js 검사 12개에 「retire 에서 빼야 한다」는 알림을 실었다. court/vault-check.js 가 바뀐 단언 줄을 앞에서 20줄까지만(removed.slice(0, 20)) 제목과 함께 넘겨, 앞 20줄에 걸린 제목이 13개, 21번째 줄부터만 걸린 제목이 정확히 그 12개였다.
- 어떻게: 추측으로 retire 를 줄이지 말고 판정서 자료(verdict.json)와 법정 함수를 작업자 PC 에서 같게 돌려 원인을 확인한 뒤 REQ 에 표시 한계로 적는다. 이 PR 은 그 검사들을 없애지 않았고 단언을 넓혔다. 근거: docs/specs/REQ-TASK-ES-620-WIRING-TEXT-TESTS.md
- 출처: #900 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L129. 시나리오 입력 동사가 법정 실행기에 없으면 제품·주장·입력값·단언은 보존하고 지원되는 입력 동사로만 바꾼 뒤 기준과 작업에서 다시 실행하라.**
- 왜: PR #974는 fill/value 입력을 법정 실행기가 받지 못해 두 번 돌려보냈다. 세 시나리오의 해당 입력만 type/text+clear로 바꾸고 제품·주장·단계·단언을 보존한 세 번째 심사 2FBA05FF에서 R1/R2 화면이 확인됐다. R3 로그인 게시 경계는 needs-login으로 남았다.
- 어떻게: court 시나리오 실행기 지원 동사를 읽기 전용 확인한다. adapter diff를 입력 단계로 한정하고 원 실패·원 주장과 독립 바이트 대조를 보존한다. 실행기나 기대값을 수정하지 않는다.
- 출처: #974 · 처음 2026-10-13 · 확인 1회 · 대상 claude·antigravity·codex

**L130. 문서 codeContains 주장은 push 전에 법정 claims 파서의 문자열 길이와 실제 대상 문구를 함께 확인하라.**
- 왜: PR #976 준비 중 C6의 목표: 문구가 법정 파서 최소 길이에 미달해 로컬에서 거부됐다. 원 거부를 보존하고 동일 대상의 TASK-ES-704 문구로 교정한 뒤 주장 여덟 개의 스키마를 확인했다. 공식 24A6D679는 통과였다.
- 어떻게: 현재 court/claims.js 파서를 읽기 전용으로 실제 주장 파일에 적용하고 codeContains 대상 파일도 대조한다. 정책·파서를 바꾸지 않으며 로컬 스키마 확인과 공식 판정을 구분한다.
- 출처: #976 · 처음 2026-10-13 · 확인 1회 · 대상 claude·antigravity·codex

### 병합·충돌 (12)

**L009. 분열 PR 에서는 생성 지도 3종(docs/architecture/module-baseline.json·cell-map.json·inline-script-map.json·INLINE-SCRIPT-MAP.md)을 커밋하지 말고 main 판 그대로 두어라. 병합 3~5건마다 일괄 갱신 PR 을 따로 낸다.**
- 왜: 모든 분열 PR 이 이 3개를 고쳐 병렬 PR 끼리 끝없이 충돌했다. module-guard 는 값이 늘 때만 실패하므로 줄어든 기준선을 PR 마다 반영할 필요가 없다.
- 어떻게: 일괄 갱신: node scripts/module-guard.js --update(사유 없이, 낮아진 값만) → node scripts/cell-map-export.js → node scripts/inline-script-map.js --write → --check·module-guard·npm test → 한 커밋(#761·#787).
- 출처: #761 #787 #832 #838 #843 #884 #886 #890 #893 #895 #897 #899 #903 #905 #908 #910 #912 #915 #916 #918 #921 #924 #928 #931 #934 #942 #960 #963 · 처음 2026-10-05 · 확인 31회 · 대상 claude·antigravity·codex

**L010. 병합 하나가 나머지 열린 분열 PR 을 CONFLICTING 으로 만드는 것은 정상이다 — index.html 충돌은 손으로 풀지 말고 main 판 index.html 을 입력으로 생성기를 다시 돌려 해결하라.**
- 왜: #759·#760·#762·#773·#775·#782·#785·#788 등 거의 모든 분열 PR 이 다른 병합 뒤 충돌했다. 생성기 재실행이 손 충돌 0·verify ok 로 가장 안전했다.
- 어떻게: git -c core.attributesFile=C:/dev/ourgoal-app/.git/info/attributes merge origin/main → 충돌 시 git show origin/main:index.html > 입력 → 생성기 설정 그대로 재실행 → verify-inline-*.js ok → 시나리오 재실행 → push.
- 출처: #759 #760 #762 #773 #775 #782 #785 #788 #827 #824 #829 #830 #911 #913 · 처음 2026-10-05 · 확인 14회 · 대상 claude·antigravity·codex

**L012. TASK-ES 번호는 쓰기 직전에 gh pr list --state all 과 git ls-remote 로 비었는지 확인하고, 브랜치를 먼저 push 해 번호를 선점하라.**
- 왜: 병렬 빌더들이 같은 번호를 잡아 충돌했다(448: #760 vs G076 마무리, 462: #767 vs H2, 478: #777 vs #778). 늦게 쓴 쪽이 모든 서류의 번호를 바꿔야 했다. 번호가 겹치면 reports/TASK-ES-N/claims.json 까지 남의 것을 덮어쓴다(#828 이 #826 의 주장 파일을 덮었다가 되돌림).
- 어떻게: gh pr list --state all --limit 80 · git ls-remote origin | grep task-es-<번호> 가 비면 즉시 빈 브랜치 push. 충돌 시 나중에 쓴 쪽이 바꾼다.
- 출처: #760 #765 #767 #777 #778 #779 ##828 #883 #932 · 처음 2026-10-05 · 확인 6회 · 대상 claude·antigravity·codex

**L011. dev_log.md·docs/rules/TICKETS.md 는 끝줄 추가끼리 충돌하므로 합집합 합치기로 처리하라.**
- 왜: 병렬 PR 이 모두 두 파일 끝에 한 줄씩 더해 충돌했다. #779 는 오케스트레이터가 합집합으로 합쳐 바로 재심을 받았다.
- 어떻게: git -c core.attributesFile=C:/dev/ourgoal-app/.git/info/attributes merge origin/main (그 attributes 파일이 두 파일을 union 병합으로 지정).
- 출처: #758 #769 #779 #893 · 처음 2026-10-05 · 확인 4회 · 대상 claude·antigravity·codex

**L014. 여러 PR 이 동시에 판정 대기 중이면 계속 밀려 충돌하는 PR 을 먼저 병합한다고 약속하고 지켜라(직렬화).**
- 왜: #775 는 #774·#773·#779·#781 병합에 세 번 밀려 재합침을 반복했다. 다음 병합 1순위로 지정한 뒤 병합됐다.
- 어떻게: 충돌 재합침을 지시할 때 「재판정 나오면 1순위」를 함께 알리고, 그 사이 다른 PR 병합을 보류.
- 출처: #775 #785 · 처음 2026-10-05 · 확인 2회 · 대상 claude

**L049. index.html 을 바꾸는 PR 이 3개 이상 동시에 열리면 오케스트레이터가 병합 줄을 정해 한 번에 하나만 재생성·push 하게 한다 — 전원이 동시에 재합치면 병합 하나마다 전원이 다시 충돌해 10분씩 낭비된다**
- 왜: 2026-10-06 3단계: 빌더 5명이 각자 재생성 중에 다른 PR 이 병합돼 #814 가 세 번 재생성(각 10분). 줄을 세우면 재생성은 PR 당 1회
- 어떻게: 줄: 결심 PR → 가장 오래 기다린 PR 순. 선두만 push, 나머지는 측정 자료만 준비. 병합 즉시 다음 빌더에 알림. dev_log·TICKETS 만 충돌하는 PR 은 오케스트레이터가 합집합으로 바로 합침
- 출처: #814 #815 #819 #914 · 처음 2026-10-06 · 확인 2회 · 대상 claude·antigravity·codex

**L013. 병합은 판정 줄·부족 사유·단언 삭제 여부를 사람처럼 확인하는 단계로 남기고, 자동 병합 스크립트로 넘기지 마라.**
- 왜: 오케스트레이터가 자동 병합 감시 스크립트를 돌리려 하자 권한 분류기가 막았다(위임받은 판단을 스크립트에 넘기는 것). 병합마다 시험지 단언 삭제·금고 경로 확인이 필요했다.
- 어떻게: 판정 감시는 백그라운드 루프로 하되, 병합은 gh pr diff 로 tests/ 의 삭제 줄에 assert 가 없는지·금고 경로 변경이 없는지 본 뒤 직접 gh pr merge.
- 출처: #768 #769 #780 · 처음 2026-10-05 · 확인 1회 · 대상 claude

**L048. 검사를 강화하는 금고 단독 PR(「X 가 없다」 단언)은 그 X 를 지우는 본 PR 이 병합된 뒤에만 병합한다 — 순서가 바뀌면 main 의 npm test 가 깨져 모든 빌더의 측정이 오염된다. 자동 병합 훑기에서 금고·게이트 PR 은 제외하고 손으로 순서를 정한다**
- 왜: 2026-10-06 #818(verify-integrity-gate 「페이월 모달 없다」)이 #813(광고·구독 삭제)보다 먼저 병합돼 main 무결성 게이트 37/38 실패. 오케스트레이터의 pass 스크립트가 제목 필터에 「금고」를 안 넣어 자동 병합됨
- 어떻게: pass 스크립트 제목 필터에 금고·무결성 게이트 추가. 짝 PR(본 변경 → 게이트 강화)은 번호를 적어 두고 본 PR 병합 직후 연달아 병합. 깨진 창이 생기면 전 빌더에 「main 게이트 1건 실패는 알려진 상태」 공지
- 출처: #818 #813 · 처음 2026-10-06 · 확인 1회 · 대상 claude·antigravity·codex

**L050. 법정(court) 실행은 끝났는데 PR 에 판정 댓글이 안 붙으면 court-publish 워크플로(workflow_run)가 GitHub 대기열에서 취소·정체된 것이다 — 판정 정본은 court 실행의 artifact court-verdict/verdict.json(verdict·verdictId·head) 이므로 gh run download 로 받아 그 값으로 줄을 진행하고, PR 댓글에 실행 번호·artifact 출처를 적는다**
- 왜: 2026-10-06 #828: court 실행 37364990097 은 「통과」(C8DB8338)로 끝났지만 court-publish 37365862801 이 cancelled → rerun 도 queued 로 30분+ 정체. 댓글만 보는 줄 스크립트는 WAIT 만 찍어 줄 전체가 멈췄다
- 어떻게: gh run list --workflow court-publish 로 상태 확인 → gh run rerun 1회 → 그래도 queued 면 gh run download <court 실행> 으로 verdict.json 을 읽는다(head 가 PR 머리와 같은지 확인). 작업자 로컬 측정은 근거가 아니다 — artifact 만 근거
- 출처: #828 · 처음 2026-10-06 · 확인 1회 · 대상 claude·antigravity·codex

**L115. 하루에 PR 을 수십 건 병합하면 Vercel 배포 한도에 걸려 운영 배포가 24시간 막히므로, 대량 병합 전에 배포 횟수를 세고 부수 PR(지도 갱신 등)을 묶고 브랜치 push 를 줄여라.**
- 왜: GitHub 기록: 커밋 ed20750cc1d0079c4c185cca2afb8a6d1e3192a4 의 상태(gh api repos/yangsangmin/ourgoal-app/commits/ed20750c…/status)가 failure 이고 Vercel failure 설명이 「Deployment rate limited — retry in 24 hours.」다. 브랜치 push 마다 미리보기 배포가 시도되고 병합마다 운영 배포가 시도된다. (오케스트레이터가 deployments API 로 확인: 마지막 Production 배포 cc325e0a 2026-10-11T05:52:13Z, 상태 success.)
- 어떻게: push 는 번호 선점 1번 + 완성 뒤 1번으로 줄이고 지도 갱신은 병합 몇 건을 묶어 한다. PR 의 Vercel 검사 실패는 무시한다(법정은 자체 서버). 허브 「마지막 갱신」 줄에 운영 배포가 어느 커밋에 멈춰 있는지 사실 한 줄로 남긴다.
- 출처: #932 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L122. 생성기가 기준에 없던 새 폴더에 파일을 만들면 법정 재실행 대조가 폴더 한 줄로 읽어 멈추므로, 그 폴더에 설명 파일 한 장을 먼저 넣는 선행 PR 을 내라.**
- 왜: PR #958(REQ-TASK-ES-686): 법정의 생성기 재실행 대조(court/lib/preserve-source.js)는 git status --short 의 줄마다 마지막 낱말을 허용 목록과 맞대는데, 없던 폴더의 새 파일은 폴더 한 줄(?? js/app/)로 보여 허용 목록의 js/app/boot.js 와 글자로 달라 「Unexpected file modified by generator: js/app/」로 멈췄다. 선행 PR 없이 돌린 로컬 법정 전체 실행도 같은 자리에서 「확인 부족」(동작 주장 30건 확인 못 함)이었다.
- 어떻게: 재현은 reports/TASK-ES-686/court-newdir-repro.cjs(저장소 밖 임시 git 저장소: 이미 있는 폴더의 새 파일은 통과, 없던 폴더의 새 파일만 걸림, --untracked-files=all 이면 안 걸림). 법정은 금고라 고치지 않고 입력 쪽(폴더에 README.md 한 장)에서 비켜 간다. 근거: docs/specs/REQ-TASK-ES-686-APP-FOLDER.md 0·4·5절.
- 출처: #958 · 처음 2026-10-12 · 확인 1회 · 대상 claude·antigravity·codex

**L124. 시험·서류·설명 파일만 바뀐 병합이 끼면 index.html 빌더는 전부 다시 재지 말고 합친 뒤 재실행 대조와 npm test 한 번만 확인하라.**
- 왜: PR #955 는 재철거 4차(#956 — index.html 만)가 병합되자 빠른 판 88건과 npm test 만 다시 확인했고, PR #959 는 합친 #958 이 js/app/README.md 한 장뿐이라 재실행 대조와 npm test 만 다시 확인했다. PR #950 도 #952·#953 이 생성기·하네스·설계 문서를 바꾸지 않아 전체 재측정을 하지 않았다.
- 어떻게: 합친 뒤 index.html·js/**·scripts/**·tests/**·court/** 차이를 git diff 로 확인해, 제품·생성기가 안 바뀐 병합이면 그 사실을 REQ 에 적고 재실행 대조·npm test 만 돌린다(생성기나 index.html 이 바뀌었으면 apply 부터 다시 — L071). 근거: docs/specs/REQ-TASK-ES-681-GEN-FINALIZE-OPTIONS.md 및 REQ-TASK-ES-677 기준 main 설명.
- 출처: #955 · 처음 2026-10-12 · 확인 1회 · 대상 claude·antigravity·codex

### 분열·이음매 (31)

**L016. 어려운 인라인 묶음은 표준 이음매로 옮겨라: 재대입 상태는 선언을 원래 자리에 두고 L.getter/setter, window 노출·인라인 onclick 이름은 노출 줄을 원래 자리, 로드 중 문은 본문만 세포 함수로 하고 원래 자리에 부르는 한 줄.**
- 왜: #762 설계로 54묶음 중 대부분이 표준 이음매로 풀렸고, 실제로 막는 것은 시험지 선행·smoke FN_NAMES·800줄 초과·공용 부품뿐이었다.
- 어떻게: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md 2절·4-1 빌더 절차, gen-inline-hard.js 설정(take.names·keepRest·afterTag·headerPick). 묶음은 번호가 아니라 제목으로 찾는다(번호는 병합마다 밀림).
- 출처: #762 #834 #917 #923 · 처음 2026-10-05 · 확인 13회 · 대상 claude·antigravity·codex

**L072. 철거는 unwire-run.js 의 apply → measure → claims 순서로 하고, 대조 탐침의 이름 목록은 철거 전 기준 트리 결과로 고정하라.**
- 왜: PR #891 은 실행기로 계획 파일에서 키트 이름을 읽어 proof.json 을 쓰고 생성기를 돌렸다(생성기가 멈추면 그 이름만 빼고 다시 돌리며 사유를 남긴다). measure 는 기준 트리(origin/main 임시 worktree)와 맞대고 이름 목록은 --names-from 으로 고정한다.
- 어떻게: export NODE_PATH=C:/dev/ourgoal-app/node_modules 뒤 node docs/design/harness/module-split/unwire-run.js apply . --task TASK-ES-<번호> --kit <키트> --pass 1 → module-guard --update → npm test 기준·작업 전경 실행(raw/npm-test.{base,work}.{log,exit}) → measure . --base <임시 worktree> → claims . --req <REQ>. 근거: docs/specs/REQ-TASK-ES-618-UNWIRE-SETTINGS-1.md 5·7절.
- 출처: #891 #894 #896 #898 #902 #904 #907 #920 · 처음 2026-10-11 · 확인 8회 · 대상 claude·antigravity·codex

**L015. 분열(옮기기) PR 은 고치기가 아니다 — 동작 0 변경, 버그도 그대로 옮기고, 바꿀 수 있는 글자는 생성기가 붙이는 이름 접두(L. 등)뿐이다.**
- 왜: 헌법 CELL_SPLIT. 옮기면서 고치면 판정·회귀 원인이 섞인다. 빌더들은 발견 결함을 고치지 않고 목록으로 보고해 결함 PR(#767·#777)로 따로 고쳤다.
- 어떻게: docs/design/harness/module-split/gen-inline-*.js 생성기로만 옮기고 verify-inline-*.js 로 토큰 동일·누수 0·남은 글자 동일을 확인. 발견 결함은 REQ 와 보고에 적는다.
- 출처: #744 #762 #767 #777 · 처음 2026-10-05 · 확인 6회 · 대상 claude·antigravity·codex

**L067. 시험이 배선 글자(window.N = … 등)를 단언하는 이름은 시험을 고치지 말고 철거 계획에서 빼라.**
- 왜: PR #889 의 전 키트 모의 철거에서 smoke-test 25건·무결성 게이트 1건(금고 파일)·시험 파일 10개가 깨졌다. 시험을 고치지 않고 해당 이름 42개를 뺀 철거 계획(845줄·이름 383)을 만들었다. 목록은 넓게 잡은 것이라 글자가 있다고 반드시 깨지는 것은 아니며, 좁히는 것은 시험 변경 결심 때의 일이다.
- 어떻게: reports/TASK-ES-614/pinned-names.cjs 로 시험 소스의 배선 글자를 찾아 제외 목록을 만들고, 그 이름을 뺀 모의 철거를 다시 돌려 unwire-plan.json 을 만든다. 근거: docs/specs/REQ-TASK-ES-614-CELL-REGISTRY-OWN.md 3·7·8절.
- 출처: #889 #900 #907 #909 · 처음 2026-10-11 · 확인 4회 · 대상 claude·antigravity·codex

**L093. 철거 뒤에 감싸기 이전을 하면 생성기가 감싼 코드가 읽는 이름의 통로 getter 를 index.html 머리에 다시 달므로, 손으로 빼지 말고 줄 수 계산에 넣고 값이 정해지는 시점을 확인하라.**
- 왜: PR #911 에서 감싼 코드가 읽는 인라인 이름 31개 중 27개는 index.html 머리에 getter 가 없어 생성기가 get X(){ return X; } 를 새로 달았다(29줄: 속성 27 + 껍데기 2). 손으로 빼면 법정의 바이트 대조가 깨지고 생성기를 고치면 「생성기 변경 0」을 어긴다. 다시 단 getter 는 같은 값을 돌려준다(지문 차이 0).
- 어떻게: reports/TASK-ES-<번호>/expose-window.json 처럼 새 getter 의 값이 정해지는 시점을 확인한다(22개는 getter 줄보다 먼저 정해지고, 뒤에 정해지는 5개는 그 사이 실행되는 문이 0 이거나 통로에 처음 생기는 이름이라 읽는 코드가 없었다). 성과는 순감소로 적는다(inlineScriptLines 2989→2921, −68). 근거: docs/specs/REQ-TASK-ES-638-WRAP-BOOT-1.md 4·6·8절. 구역 이전 뒤에도 같다 — #951 은 daysFromNow getter 가, #954 는 isoDate 가 다시 달려 뒤따르는 재철거(#943·#956)가 필요했다(REQ-TASK-ES-676·682·683).
- 출처: #911 #913 #951 #954 · 처음 2026-10-11 · 확인 4회 · 대상 claude·antigravity·codex

**L047. 옮긴 코드가 대입하는 이름(assignedL)마다 index.html 의 「마지막」 get X() 노출 줄에 set X(v) 가 있는지 확인하라 — 뒤쪽 P0 이음매 블록의 getter-only 노출이 생성기가 단 setter 를 덮어 부팅 때 「Cannot set property X … only a getter」 가 난다**
- 왜: 2026-10-06 Z2 빌더 실측(USER_SESSION_CHANNEL): gen-inline-hard.js 가 H 자리 머리에 getter+setter 를 다시 달지만 index.html ~3204·3240줄의 P0 expose 블록이 나중에 실행돼 덮음. verify-inline-hard 는 setter 빠짐 0 으로 통과 — 못 잡음. 게스트 시나리오 noExceptions 로만 발견
- 어떻게: 생성 뒤 이름마다 마지막 노출 줄 검사(검사기 ⑨ 추가 예정). 안 되면 그 대입 함수는 원래 자리에 둔다. 부팅 포함 게스트 시나리오·법정 모듈 로드 탐침 필수(L046 과 같은 꼴)
- 출처: #914 #922 · 처음 2026-10-06 · 확인 3회 · 대상 claude·antigravity·codex

**L069. 배선 철거 PR 의 제품 변경은 index.html 하나로 두어라 — 지울 대상은 세 종류와 쉼표 한 글자뿐이다.**
- 왜: PR #891(첫 실제 철거, index.html 143줄 삭제)에서 법정의 생성기 재실행 대조(court/lib/preserve-source.js recomputeSplit)는 기준 커밋의 생성기를 PR 의 proof.json 으로 다시 돌려 index.html 과 js/core/cell-registry.js 가 PR 의 것과 바이트 동일한지 보고, 설정 cells 밖의 js/** 변경은 거부한다.
- 어떻게: docs/design/harness/module-split/unwire-run.js apply 로 생성기를 돌려 만든 index.html 만 올리고, 세 종류 밖 삭제 줄 0·지운 줄과 쉼표 말고 0 을 measurement.json 에 남긴다. 근거: docs/specs/REQ-TASK-ES-618-UNWIRE-SETTINGS-1.md 0·3절.
- 출처: #891 #896 #920 · 처음 2026-10-11 · 확인 3회 · 대상 claude·antigravity·codex

**L019. 새 세포는 기존 탭 키트(OurgoalCalendarKit 등)에 함수를 달고, 새 window 전역을 만들지 마라.**
- 왜: G076 에서 안티그래비티가 새 전역 _calendarKit 에 등록해 페이지가 OurgoalCalendarKit 를 찾지 못하고 창이 아예 안 열렸다(#765 에서 수정).
- 어떻게: var K = global.OurgoalXxxKit = global.OurgoalXxxKit || {}; 형식. 덮어쓰는 키트(유형 M)는 afterTag 로 그 파일 태그 뒤에 넣는다.
- 출처: #765 #762 · 처음 2026-10-05 · 확인 2회 · 대상 claude·antigravity·codex

**L058. 배선을 지우는 새 기관은 대조(compare) 모드로 먼저 넣고 실제 철거는 0 으로 두며, 대조 탐침의 첫 측정을 가공 없이 저장해 다음 단계의 범위로 삼아라.**
- 왜: PR #883(B1)은 세포 등록 기관을 compare 모드로만 넣었다. 등록이 0 인 상태에서 「불일치 0」은 공허하므로 주장은 「측정 결과 파일이 있고 누락이 숫자로 적혀 있다」로 하고, 그 누락 목록(scope getter + window 이름)이 B2 의 등록 범위가 됐다.
- 어떻게: js/core/cell-registry.js(own 모드 요청은 오류로 막는다) · 로드 줄은 app-scope.js 태그 같은 줄 뒤에 붙여 index.html 순증가 0 · 탐침 scripts/probes/cell-registry-compare.js 결과를 reports/TASK-ES-<번호>/cell-registry-compare.json 에 가공 없이 저장 · 다음 단계 완료 기준은 탐침 --expect-zero. 근거: docs/specs/REQ-TASK-ES-610-CELL-REGISTRY-B1.md 2·3·6절.
- 출처: #883 #889 · 처음 2026-10-11 · 확인 2회 · 대상 claude·antigravity·codex

**L062. 등록 블록을 붙이면 800줄 상한을 넘는 세포는 생성기가 건너뛰게 하고, 블록 형식을 줄여 맞추지 말고 누락으로 보고하라.**
- 왜: PR #885 에서 js/tabs/goals/team-goals-screen.js 가 798줄에서 810줄이 되어, 생성기가 이 파일을 건너뛰고 그 이름(renderTeamGoalsScreen)을 누락으로 남겼다. 최소 형식도 800을 넘어 형식 축소는 소용이 없었다.
- 어떻게: 상한 검사를 생성기 규칙에 넣고 건너뛴 파일·이름을 provide-plan.json 의 skipped 에 사유와 함께 남긴다. 그 세포는 책임 단위로 나눈 뒤 등록하는 별도 작업으로 보고한다. 근거: docs/specs/REQ-TASK-ES-611-CELL-REGISTRY-B2.md 4절. 등록 블록을 한 줄로 이어 쓰는 생성기 옵션(--compact-over-limit)으로 800줄 상한에 맞추는 풀이는 오케스트레이터가 받아들이지 않았다 — 「줄 수 상한을 글자 배치로 맞추는 것은 잣대를 피해 가는 꼴」이라 그 옵션과 등록을 되돌렸다(PR #950, REQ-TASK-ES-677).
- 출처: #885 #950 · 처음 2026-10-11 · 확인 2회 · 대상 claude·antigravity·codex

**L071. 철거 PR 마다 module-guard --update 로 기준선(inlineScriptLines)을 기록하고, main 이 움직여 충돌하면 main 판 index.html 로 apply 를 다시 돌려라.**
- 왜: 지시함 DIR-003 이 철거 PR 마다 기준선 기록을 요구한다(지시함이 경험칙 L009 보다 위). PR #891 은 4003→3860(−143)을 기록했고, 철거 PR 은 한 번에 하나만 열리므로 충돌은 main 을 합칠 때 module-guard --update 를 다시 돌려 푼다.
- 어떻게: main 이 움직이면 손으로 충돌을 풀지 않고 main 판 index.html 로 unwire-run.js apply 를 다시 돌린 뒤 module-guard --update 를 돌린다(L010 과 같은 방식). 근거: docs/specs/REQ-TASK-ES-618-UNWIRE-SETTINGS-1.md 3·6·8절.
- 출처: #891 #920 · 처음 2026-10-11 · 확인 2회 · 대상 claude·antigravity·codex

**L076. 손잡이 이름을 1차로 돌려 생성기가 잔존 참조로 멈추면 그 이름만 빼 가져오기 줄을 남기는 2차(imports:false)로 따로 돌려라.**
- 왜: PR #896 의 _ui 손잡이는 등록된 이름이 둘이었다. download 는 IIFE 안 참조가 0 이라 1차로 지웠지만 escapeHtml 은 IIFE 안 남은 코드가 19곳에서 맨이름으로 써서 생성기가 멈췄고, 그 이름을 2차(getter 줄만 지움)로 돌렸다. _ui 와 _uiKit 은 같은 객체지만 손잡이 변수가 달라 실행을 나눴다.
- 어떻게: unwire-run.js apply --runs _uiKit:1,_uiKit:2,_ui:1,_ui:2 --names-for _ui:1=이름,_ui:2=이름 처럼 먼저 모든 이름을 1차에 주고 정지 메시지를 확인한 뒤 멈춘 이름을 2차에 옮긴다. 계획에 실행이 없는 손잡이(_xxxKit 꼴이 아닌 것)는 X1 으로 돌린다. 근거: docs/specs/REQ-TASK-ES-624-UNWIRE-UI.md
- 출처: #896 #904 · 처음 2026-10-11 · 확인 2회 · 대상 claude·antigravity·codex

**L103. 구역 이전의 경계는 줄 번호가 아니라 구획 주석 제목으로 지정하고, 제목만으로 가를 수 없는 문(노출된 var·함수 선언·돈 근처 줄)이 낀 구역에는 문 글자 닻(from·to)을 더하라.**
- 왜: PR #919(생성기 region 모드)의 설정에는 줄 번호 칸이 없다(있으면 멈춘다). 실제 묶음 안에는 구역에 못 넣는 문이 끼어 있어 제목만으로는 그 앞뒤를 가를 수 없고, 계획의 구역 19개 가운데 14개가 닻이 필요했다.
- 어떻게: 설정은 세포마다 regions(이름·구획 주석 제목·필요하면 문 글자 닻)로 쓰고, 문 종류 검사→겹침·구획 주석 행방→줄 경계→돈 근처→var 지역화→L. 접두 순으로 안전 검사를 한다. 근거: docs/specs/REQ-TASK-ES-643-GEN-REGION.md 0·6절.
- 출처: #919 #933 · 처음 2026-10-11 · 확인 2회 · 대상 claude·antigravity·codex

**L120. 한 스크립트 안에서 연달아 돌던 문을 두 스크립트로 가르면 문 차례가 같아도 동작이 달라질 수 있다 — 스크립트 경계에서 브라우저가 밀린 마이크로태스크를 먼저 돌리므로, 앞뒤 문이 비동기로 엮여 있으면 한 스크립트에 둬라.**
- 왜: (병합된 PR 이 아니라 병합 보류된 PR 의 측정이다.) PR #959(마지막 정리)는 「연결 만들기(createClient)」와 「인증 수신기 걸기」가 직전 main 에서는 한 스크립트였는데 연결 만들기는 인라인 블록, 수신기 걸기는 js/app/boot.js 로 갈렸다. 스크립트 경계에서 브라우저가 밀린 마이크로태스크를 먼저 돌려, 저장된 세션이 있는 사용자의 부팅에서 라이브러리 초기화와 SIGNED_IN 알림이 부팅 파일보다 먼저 끝나 앱의 수신기 둘이 SIGNED_IN 을 못 받고 INITIAL_SESSION 만 받았다. PR 은 법정 판정이 통과여도 병합 보류됐다.
- 어떻게: 이전 후보가 비동기 시작 호출(연결·구독)과 그 수신기 걸기 사이를 가르면 안 되는지 먼저 본다. 진짜 라이브러리(운영 CDN 판·node_modules 판)로 직전 main 과 이 머리를 여러 번 돌려 같은 줄이 나오는지 비교한다. 근거: PR #959 본문 맨 위 보류 줄. 결과: #959 는 병합하지 않고 닫혔고, 연결 만들기와 수신기 걸기를 같은 부팅 파일에 두는 P안(#961 keepGlobalConst → #962)으로 풀렸다. 독립 확인은 진짜 연결 라이브러리 두 판 × 세션 있음·없음·만료에서 인증 사건 줄이 직전 main 과 같고 세션이 있을 때 앱 수신기 둘이 SIGNED_IN 을 받음을 확인했다(PR #962 병합 근거).
- 출처: #959 #962 · 처음 2026-10-12 · 확인 2회 · 대상 claude·antigravity·codex

**L017. CSS 은폐(display:none !important)가 든 코드 묶음은 그대로 새 파일로 옮기면 법정이 「CSS 은폐 줄 새로 추가」로 돌려보내니, 숨김을 먼저 정리(삭제는 승인선 ③)한 뒤 옮겨라.**
- 왜: H4 「피드 상호소통 댓글」 묶음이 renderCommFeed 안 숨은 빠른 게시 띠 때문에 이동 불가였다(로컬 예비 점검 확인). 상민님 정리 4건 승인 뒤 처리.
- 어떻게: 묶음에 !important 숨김이 있으면 건너뛰고 결함 목록·결심 후보로 올린다.
- 출처: #785 · 처음 2026-10-05 · 확인 1회 · 대상 claude·antigravity·codex

**L018. 옮길 묶음이 로드 중에 아직 옮겨지지 않은 인라인 함수를 부르면 세포 로드가 깨지니, 그 초기값은 원래 자리에 남겨라.**
- 왜: P2 빌더가 예시 모임 MOCK_GROUPS 초기값(로드 중 daysFromNow → 인라인 pad)을 옮겼다면 L.pad is not a function 으로 앱이 망가졌을 것을 법정 모듈 로드 탐침이 잡았다.
- 어떻게: court/probes/module-load.js 로 기준 사본·작업 양쪽을 로컬 실행해 회귀 0 확인. 생성기에 로드 중 호출 검사를 둔다.
- 출처: #760 · 처음 2026-10-05 · 확인 1회 · 대상 claude·antigravity·codex

**L020. 이름 접두(L.)를 붙일 때 문자열·주석 안 글자는 절대 건드리지 마라.**
- 왜: G076 에서 class="empty-state" 가 empty-L.state 로 손상됐다. L. 를 지운 토큰 대조로는 잡히지 않았고 문자열 내용까지 비교하는 검사기·화면 시나리오가 잡았다.
- 어떻게: 스코프 분석 생성기만 쓰고 정규식 치환으로 접두를 붙이지 않는다. 검수는 문자열 포함 토큰 대조 + 기준·작업 화면 시나리오.
- 출처: #765 · 처음 2026-10-05 · 확인 1회 · 대상 claude·antigravity·codex

**L046. js/core 기관 키트(_uiKit 등)를 쓰는 세포는 자리 표지를 HO(기관)로 — 가져오기 줄이 키트 변수 선언보다 앞(H1~H4)에 들어가면 IIFE 머리에서 TypeError 로 앱 전체가 안 뜨는데 verify·node 시험은 통과한다**
- 왜: 2026-10-06 Z1 빌더 실측: gen-inline-hard.js 가 머리에 var _uiKit 가 있다고 보고 새로 만들지 않지만 가져오기 줄은 H1 자리(선언보다 앞)에 넣어 undefined. 실계정 하네스 pageerror 「Cannot read properties of undefined (reading getSupabaseAuthToken)」로만 발견
- 어떻게: 설정 slot 을 HO 기관 으로 쓰거나 생성 뒤 index.html 에서 가져오기 줄 위치 > 키트 변수 선언 위치를 확인. 법정 모듈 로드 탐침·게스트 시나리오(앱 부팅 포함)를 반드시 돌린다 — 토큰 대조만으로 부족(L0xx 안티그래비티 교훈과 같은 꼴)
- 출처: 운영 원칙 · 처음 2026-10-06 · 확인 1회 · 대상 claude·antigravity·codex

**L063. 통로(scope)와 window 가 서로 다른 값을 가리키는 이름은 한 이름으로 등록하지 말고 건너뛰어 철거 때 따로 다뤄라.**
- 왜: PR #885 에서 switchTab 은 통로에서는 switchTab 을, window 에서는 setTab 을 가리킨다(window.switchTab = setTab). 값이 달라 한 이름으로 등록할 수 없어 생성기가 건너뛰었고, 철거 단계에서 따로 다뤄야 하는 발견으로 보고됐다.
- 어떻게: 생성기 등록 대상 계산에서 통로 쪽 가져오기 이름과 window 쪽 가져오기 이름이 다르면 제외하고 누락 목록에 사유를 적는다. 불일치(등록했는데 값이 다름)와 누락(등록 안 함)을 섞어 보고하지 않는다. 근거: docs/specs/REQ-TASK-ES-611-CELL-REGISTRY-B2.md 3·6·8절.
- 출처: #885 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L065. 등록 기관의 own 적용은 세포가 등록할 때가 아니라 index.html 인라인 IIFE 바로 앞 commit 한 번으로 하라.**
- 왜: PR #889 에서 window 이름 199개 중 13개는 IIFE 밖 파일도 같은 이름을 대입한다. 지금은 맨 뒤 IIFE 가 다시 덮어 이기는데, 기관이 세포 로드 때 바로 내주면 뒤에 로드되는 js/components.js 가 이겨 5개의 승자가 뒤집힌다.
- 어떻게: js/core/cell-registry-commit.js 를 IIFE 바로 앞 태그 줄 끝에 같은 줄로 붙여(index.html 순증가 0) commit 과 IIFE 사이에 다른 태그를 두지 않는다. 겹침 이름은 reports/TASK-ES-614/overlap-names.json 방식으로 세 트리 지문을 대조한다. 근거: docs/specs/REQ-TASK-ES-614-CELL-REGISTRY-OWN.md 3·4·6절.
- 출처: #889 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L087. 계획의 1차·2차 철거가 끝나면 덩어리에 남은 배선을 이유별로 다시 재서 다음 철거의 입력으로 남겨라.**
- 왜: PR #904 로 지금 계획으로 지울 수 있는 것은 끝났다. 그래서 이유별 이름 수·줄 수와 손잡이 줄의 남은 참조 수를 reports/TASK-ES-630/remaining-wiring.json 에 재서 철거 2차(시험에서 풀린 이름 42개·X3 4개·IIFE 가 아직 쓰는 가져오기 줄·손잡이 줄 X2 등)의 입력으로 남겼다.
- 어떻게: reports/TASK-ES-630/remaining-wiring.cjs 로 남은 배선을 재고, 다음에 무엇을 풀어야 줄이 더 주는지를 숫자로 남긴다. 근거: docs/specs/REQ-TASK-ES-630-UNWIRE-CALENDAR-ETC.md
- 출처: #904 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L091. 기관만 넣는 PR 이라도 병합 전에 저장소 밖 모의 이전 사본에서 기관을 실제로 적용해 보고, 기관 태그만 뺀 대조군이 부팅에 실패함을 보여라.**
- 왜: PR #909(상태 기관 js/core/app-state.js)가 병합되면 다음 PR 은 index.html 만 바꿀 수 있다(법정 제약). 기관의 계약이 틀렸다면 그때는 기관을 고칠 수 없어 막다른 길이 된다. 그래서 병합 전에 사본에서 통로에 노출된 상태 이름 63개 중 옮길 수 있는 50개를 한 번에 적용해 보았다(금고 시험이 글자로 붙잡는 _promptEncyclopediaOpen 을 뺀 49개로 다시 쟀다).
- 어떻게: 기관은 로드될 때 아무것도 만지지 않게 하고 로드 줄은 기존 태그와 같은 줄에 덧붙인다(순증가 0). 모의 사본에서 시나리오·이름별 값 요약·window 복사 동일성·module-load·시험 전부가 기준과 같은지 재고 커밋하지 않는다. 근거: docs/specs/REQ-TASK-ES-636-APP-STATE-ORGAN.md
- 출처: #909 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L094. 철거·이전 계획 파일은 잰 시점의 main 기준이므로, 그 뒤 PR 이 index.html 을 바꿨다면 실행 전에 현재 main 에서 대상을 다시 재라.**
- 왜: PR #914 의 상태 이전 계획은 5e2fc92c 에서 잰 것인데 그 뒤 #909·#911 로 index.html 이 바뀌었다. 다시 재자 대상이 하나 늘었다(toggleAgentBtn). 계획을 그대로 썼다면 그 이름의 getter 줄이 남았을 것이다.
- 어떻게: 계획 파일을 입력으로 쓰기 전에 현재 main 의 index.html 에서 같은 도구로 대상 이름을 다시 재고, 달라진 이름은 REQ 에 적는다. 근거: docs/specs/REQ-TASK-ES-637-UNSTATE-1.md
- 출처: #914 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L096. 다른 이전 PR(상태 이전)이 먼저 병합돼 같은 설정을 다시 돌린 뒤에는 새 세포와 새로 단 getter 가 상태 기관 이름과 겹치는지 다시 확인하라.**
- 왜: PR #913 은 #914(상태 이전)가 먼저 병합돼 index.html 의 상태 이름 50개 선언이 기관 호출로 바뀌고 getter/setter 가 지워진 뒤 main 판 index.html 로 같은 proof.json 을 다시 돌렸다. accessor-probe.json 으로 재확인한 결과, 새 세포가 L. 로 읽는 이름 22개 중 기관이 주인인 이름 0, 새 세포가 대입하는 이름(pendingCapturePhoto) 중 기관 이름 0, 생성기가 새로 단 getter 10개 중 기관 이름과 겹치는 것 0 이었다.
- 어떻게: accessor-probe 로 겹침을 재고 REQ 4절에 적는다. 다시 단 getter 의 재철거는 철거 빌더 몫으로 남긴다(오케스트레이터 결정). 근거: docs/specs/REQ-TASK-ES-640-WRAP-BOOT-2.md
- 출처: #913 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L100. 새 세포 파일의 머리 설명(설정 title·desc)에는 돈 관련 낱말을 쓰지 마라.**
- 왜: PR #917 첫 생성에서 머리 설명 한 줄에 부품 이름이 들어가 「옮긴 구간 밖의 돈 관련 줄 1」로 잡혔다. 설명을 고쳐 다시 생성하니 0 이 됐다.
- 어떻게: 생성기 설정의 title·desc 를 사용자 말로 쓰되 돈 관련 낱말을 빼고, 생성 후 검사기의 돈 관련 줄 수가 0 인지 확인한다. 근거: docs/specs/REQ-TASK-ES-645-TEMPLATE-MARKET-MOVE.md
- 출처: #917 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L102. 다시 생긴 배선을 재철거할 때 「등록됐다」와 「기관이 통로에 내준다」를 구분해, window 전용으로 등록된 이름의 getter 는 지우지 마라.**
- 왜: PR #920 에서 감싸기·함수 이전(#911·#913·#917)이 IIFE 머리에 다시 단 getter 중 세포가 통로용으로 등록한 이름은 기관의 commit 이 이미 같은 값을 내주므로 겹친 줄이다. 그러나 window 전용으로 등록된 initDevDebugButtons 는 등록 목록에는 있어도 통로에는 index.html 의 getter 로만 나간다(#911 대조에서 「통로에 처음 생긴 이름」으로 잡혔던 이름). 지우면 대조의 「통로에서 사라진 이름 0」이 깨진다.
- 어떻게: 대상은 남은 배선 표(remaining-wiring.json)의 종류 칸이 통로(scope)를 포함하는 이름으로만 잡고, 철거 후 이름 목록을 철거 전 것으로 고정해 대조한다. 근거: docs/specs/REQ-TASK-ES-648-UNWIRE-REGROWN.md 3·6절.
- 출처: #920 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L105. 옮길 함수가 대입하는 이름의 마지막 통로 노출 줄이 getter 뿐이면, 옮기기 전에 그 줄에 setter 한 칸을 더하는 선행 한 줄 PR 을 먼저 내고 통로 쓰기 왕복을 브라우저에서 실측하라.**
- 왜: PR #922 는 setupUserSessionRealtime 이 USER_SESSION_CHANNEL 에 두 번 대입하는데, 생성기는 머리의 try{ 줄 앞까지만 보고 getter·setter 유무를 판단하고 이 이름의 노출 줄은 그 뒤에 있어 옮길 수 없었다(L047). 선행 PR 이 index.html 한 줄에 set USER_SESSION_CHANNEL(v){ USER_SESSION_CHANNEL = v; } 을 더했고(줄 수 그대로, 손 편집), 병합 뒤 #923 이 함수를 옮겼다.
- 어떻게: scope-write-probe.cjs 로 통로 쓰기 왕복(써 보고 되읽은 값이 같고 원래 값으로 복구)을 재고, 선행 PR 에는 쓰는 코드가 아직 없어 동작 0 변경임을 이름 지문·시나리오·시험으로 보인다. 병합 뒤 생성기가 머리에 get+set 줄을 하나 더 달아도 두 줄 모두 setter 가 있어 쓰기는 유지된다. 근거: docs/specs/REQ-TASK-ES-652-SESSION-CHANNEL-SETTER.md 0·3·4절, docs/specs/REQ-TASK-ES-653-USER-SESSION-REALTIME-MOVE.md 4·6절.
- 출처: #922 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L112. 구역 이전은 계획기를 지금 main 에서 다시 돌려 구역을 재고, 흩어진 시동 문을 「부르는 한 줄」로 접되 구역 함수가 원래 자리에서 불리게 해 실행 순서를 보존하라.**
- 왜: PR #933 은 로드 중 문 179개를 구역 15개로 묶어 새 세포 5개로 옮겼다(inlineScriptLines 2311→1904). 계획기를 다시 돌리니 구역에 넣을 수 있는 문이 연달아 있는 줄기가 #919 때 19개에서 15개로 줄었다(그 사이 감싸기 이전 2차와 상태 이전 2차가 구역을 끊던 var 를 치웠다). 순서는 구역 함수 본문의 줄에서 L. 접두만 걷으면 이전 전 구역의 줄과 같고 부르는 줄이 구역이 있던 자리에 있음으로 확인했다.
- 어떻게: region-plan.cjs --pins region-pins.json 으로 계획을 재고 설정은 실행기가 만들며(이름과 세포만 region-names.json 이 정함), 시험이 붙잡는 글자·가드의 셈·다른 작업의 입력은 계획에서 뺀다. 근거: docs/specs/REQ-TASK-ES-650-REGION-1.md 3·4절.
- 출처: #933 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L113. 여러 탭의 연결을 순서대로 거는 시동 구역 세포는 탭 폴더가 아니라 js/core 에 두라.**
- 왜: PR #933 에서 구역은 여러 탭의 연결을 순서대로 거는 시동 코드라 한 탭의 것이 아니다. 탭 폴더(js/tabs/…)에 두면 다른 탭의 이름을 읽는 줄이 모듈 가드의 탭 간 직접 참조로 잡힌다. #911 도 바깥 부품 연결을 js/core 에 두었다.
- 어떻게: 새 세포 이름은 core/boot-early-state·boot-entry-wiring·boot-home-wiring·boot-records-wiring·boot-finish 처럼 시동 순서를 드러내고, 설명 한 줄은 사용자 말로 cell-descriptions.json 에 더한다. 근거: docs/specs/REQ-TASK-ES-650-REGION-1.md 6절 반론 2.
- 출처: #933 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L117. 큰 함수를 조각 함수로 제자리에서 가를 때 경계를 넘는 안쪽 함수는 꾸러미(ctx)로 보내고, 그 함수를 등록하는 조각과 쓰는 조각의 실행 순서가 원래와 같은지 확인하라.**
- 왜: PR #936 에서 updateTrendChart 는 도구 조각이 2곳, 차트 조각이 1곳 쓰는 안쪽 함수라 경계를 넘는다. bindProRecTrendChart(ctx) 가 ctx.updateTrendChart = updateTrendChart 로 등록하고, 문의 실행 순서는 콜백이 조각을 원래 순서(표→도구→bindRowEvents→차트→스톱워치→저장)로 부르는 것으로 보존했다. 정리 전에 선언보다 먼저 읽어 undefined 에 기대던 콜백 지역은 없고 모두 처리기 안에서만 읽는다.
- 어떻게: 경계를 넘는 값은 읽기·쓰기 모두 ctx. 를 거치게 하고(지역 사본 0), 안 넘는 이름은 조각 밖에서 한 번도 쓰이지 않음을 기계로 보인다(verify-inplace.json). 근거: docs/specs/REQ-TASK-ES-646-PRO-MODAL-INPLACE.md 3·4·7절.
- 출처: #936 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L126. 인라인에 상수 선언만 남겨야 할 때는 그 상수를 읽는 연결 만들기를 수신기 걸기와 같은 부팅 파일 스크립트에 두라(keepGlobalConst).**
- 왜: PR #961 은 finalize 옵션 keepGlobalConst 를 더했다: 문자열 리터럴로 초기화하는 한 줄 var 선언만 껍데기 없는 최상위 스크립트에 줄 그대로 남기고, 그 이름을 읽는 선언(readers)과 나머지 문은 전부 부팅 파일로 옮긴다. 정지 조건은 문자열 상수가 아님·연달아 있지 않음·IIFE 안 대입·선언보다 앞서 읽음·다른 스크립트·세포에 같은 전역 이름 등이며, 멈추면 아무것도 쓰지 않고 사후 대조로 인라인에는 선언만 남는다.
- 어떻게: PR #962 에서 index.html 에는 서버 주소·공개 키 두 상수 선언만 남고 공개 키 글자는 부팅 파일에 없다. 단점은 두 상수가 전역 변수가 되는 것이다. 근거: docs/specs/REQ-TASK-ES-687-GEN-KEEP-GLOBAL-CONST.md R1·R2 및 REQ-TASK-ES-689.
- 출처: #961 · 처음 2026-10-12 · 확인 1회 · 대상 claude·antigravity·codex

### 시험지 (2)

**L021. 원본 index.html 만 읽어 이전 뒤 깨지는 시험지는 옮기기 전에 시험지 선행 PR 로 읽는 범위만 넓혀라 — 단언·기대값·검사 수는 0 변경.**
- 왜: #751·#753·#757·#758·#768·#769·#770·#771·#779·#780 이 각 구역 이동의 선행 조건이었다. 선행 없이 옮기면 시험이 실패해 법정이 막는다.
- 어떻게: const html = require('./helpers/inline-bundle').withInlineCells(fs.readFileSync(...)) 처럼 읽는 줄만 바꾼다. 병합 전 gh pr diff 로 tests/ 삭제 줄에 assert 가 없는지 확인. 실측 도구 scripts/inline-hard-test-probe.js 가 놓치는 시험지가 있으니 옮긴 뒤 tests 전부 종료 코드를 기준과 비교한다(#780 발견).
- 출처: #751 #753 #757 #758 #768 #769 #770 #771 #779 #780 · 처음 2026-10-05 · 확인 10회 · 대상 claude·antigravity·codex

**L022. 시험이 낡은 가짜 객체(픽스처) 때문에 실패하면 단언은 그대로 두고 픽스처 이름만 고쳐도 된다 — 단 기대값은 건드리지 마라.**
- 왜: desktop-widget-suite 가 main 에서도 실패(3 !== 4)했는데 원인은 가짜 window 가 renderCalendar 를 주고 제품은 renderCalendarScreen 을 부르는 것이었다. 픽스처 한 줄만 고쳐 통과(#777).
- 어떻게: court/README 규칙(검사를 약하게 하는 변경 금지)과 대조해, 검사를 강하게 하거나 그대로인 변경만 한다.
- 출처: #777 · 처음 2026-10-05 · 확인 1회 · 대상 claude·codex

### 생성 파일 (11)

**L068. 등록 블록 생성기(gen-cell-provide.js)는 배선 철거가 시작된 뒤에는 --write 로 다시 돌리지 마라.**
- 왜: 이 생성기는 index.html 의 배선을 읽어 등록 대상을 정한다. PR #889 REQ 에 따르면 철거 뒤에 다시 돌리면 지운 이름의 등록이 사라진다.
- 어떻게: 철거 시작 뒤에는 이 생성기를 돌리지 않거나, 철거 계획 파일을 입력으로 받게 고친 뒤에 돌린다(그 수정은 별도 작업으로 보고). 근거: docs/specs/REQ-TASK-ES-614-CELL-REGISTRY-OWN.md 4절. 이미 철거한 이름의 등록 블록을 걷지 않으려면 gen-cell-provide.js 를 --keep(기존 등록 보존)으로 돌린다 — --keep 은 모든 세포의 기존 블록을 읽어 그대로 두고 아직 어느 세포도 등록하지 않은 이름만 더하며, 두 번째 실행은 0 변경(멱등)이다(REQ-TASK-ES-664).
- 출처: #889 #911 #940 · 처음 2026-10-11 · 확인 3회 · 대상 claude·antigravity·codex

**L074. 생성기에 지우기 종류나 플래그를 더할 때는 실행마다 안전 검사를 유지하고 단일 객체 설정 출력은 바이트 동일하게 두며, 닫힌 목록 밖 줄은 어떤 플래그로도 지우지 말고 애매하면 멈춰라.**
- 왜: PR #892 는 DIR-004 (가)에 따라 X1(_xxxKit 꼴이 아닌 손잡이)·X2(참조 0 일 때만 손잡이 줄 삭제)·X3(한 줄을 나눠 쓰는 window 대입)를 더했다. 참조가 남는 손잡이를 지우거나 같은 줄의 다른 문이 쓰는 가져오기를 지우면 앱이 안 뜨거나 ReferenceError 가 나므로 잔존 참조를 글자 구간 단위로 보고 멈추게 했다.
- 어떻게: 단위 시험(X1a·X1b·X2a·X2b·X3a~X3d)으로 목록 밖 글자를 건드리지 않음을 증명하고, 지우는 대상은 문의 글자와 인접 빈칸뿐이며 사후 재파싱·주석 목록 대조가 어긋나면 멈춘다. 옮기기 경로는 글자 하나 지나지 않게 한다. 근거: docs/specs/REQ-TASK-ES-619-GEN-UNWIRE-EXT.md 0·4절.
- 출처: #892 #906 #929 · 처음 2026-10-11 · 확인 3회 · 대상 claude·antigravity·codex

**L023. 기준선(module-baseline.json)은 손으로 고치지 말고 module-guard --update 로만 바꾸며, 측정기가 오탐하면 기준선을 올리지 말고 측정기를 고쳐라.**
- 왜: H2 3차에서 옮긴 함수 안의 조건부 window 대입(if(!window.X) window.X=[]) 때문에 module-metrics 가 탭 간 직접 참조 0→25 로 오탐했다. 기준선을 올리면 지표가 거짓이 되므로 측정기 수정 PR(#792)을 먼저 냈다.
- 어떻게: 오탐 사례와 진짜 사례를 함께 고정하는 시험을 추가하고(기존 단언 0 변경), 현재 main 의 지표가 그대로인지 확인.
- 출처: #792 #794 · 처음 2026-10-05 · 확인 2회 · 대상 claude·antigravity·codex

**L024. main 의 생성 지도가 낡아 cell-map-publish 가 게시를 거부하면 버리는 worktree 에서 origin/main 으로 재생성한 값으로 게시하고, 다음 일괄 갱신 PR 로 저장본을 맞춰라.**
- 왜: 분열 PR 이 지도를 커밋하지 않게 되자 main 저장본이 뒤처져 게시가 거부됐다. 재계산 게시 뒤 #787 로 맞췄다.
- 어떻게: git worktree add --detach <tmp> origin/main → 생성기 3종 → cell-map-publish --root <tmp> → --verify-notion → worktree 제거.
- 출처: #761 #787 · 처음 2026-10-05 · 확인 2회 · 대상 claude·antigravity

**L059. 생성기에 지우기(unwire) 모드를 더할 때는 CFG.mode 가 unwire 일 때만 새 경로를 타게 하고, 지우는 대상을 세 종류(가져오기 줄·expose getter·오른쪽이 이름인 window 대입)로 제한하라.**
- 왜: PR #883 은 기존 분열 설정의 법정 재생성 대조(바이트 일치)를 깨지 않아야 했다. unwire 가 window.X = function(){…} 같은 정의문까지 지우면 함수가 사라지므로 오른쪽이 Identifier 일 때만 지우고 아니면 멈추게 했고, 철거한 이름을 IIFE 안에서 아직 쓰면 ReferenceError 가 되기 전에 생성기가 멈춘다.
- 어떻게: 단위 시험 T1~T8 로 고정하고, T8 은 A1 시범 PR 기준 트리(e8c34e42)에 수정된 생성기를 같은 설정으로 돌려 index.html·세포 파일이 그 커밋 blob 과 바이트 그대로인지 잰다. 세포 파일은 쓰지 않는다. 근거: docs/specs/REQ-TASK-ES-610-CELL-REGISTRY-B1.md 3·4·6절.
- 출처: #883 #889 · 처음 2026-10-11 · 확인 2회 · 대상 claude·antigravity·codex

**L073. 법정은 PR 하나에 생성기를 한 번만 돌리므로, 철거 실행 여러 개는 생성기 설정의 unwire 배열로 묶어 PR 하나로 올려라.**
- 왜: PR #892 이전에는 키트마다 1차(세 종류)와 2차(가져오기 줄 남김)가 따로라 철거 계획이 실행 16개, 철거 PR 이 16개가 됐다. 생성기가 한 설정에서 실행을 배열로 받게 했고 단일 객체 설정은 그대로 동작한다.
- 어떻게: 설정 unwire 를 배열로 쓰고 unwire-run.js apply --runs 로 실행들을 한 proof.json 에 담는다. 실행 사이 결과는 파일이 아니라 메모리에서 다시 파싱하며, 계획 16실행의 결과가 차례로 돌린 것과 바이트 동일함을 실측으로 확인했다. 근거: docs/specs/REQ-TASK-ES-619-GEN-UNWIRE-EXT.md 0·4절.
- 출처: #892 #920 · 처음 2026-10-11 · 확인 2회 · 대상 claude·antigravity·codex

**L061. 세포 수십 개에 같은 줄을 넣을 때는 손이 아니라 결정론 생성기로 넣고, 표지 사이를 걷어 내고 다시 붙이는 멱등 방식과 「원본 문장 수 + 1」 파서 확인을 둬라.**
- 왜: PR #885(B2)는 세포 167개의 맨 끝에 등록 블록을 덧붙였다. 앞 식에 붙어 호출로 읽히면 동작이 바뀌므로, 생성기가 덧붙인 뒤 파서로 문장 수가 정확히 +1인지 확인하고 원본이 ; 로 끝나지 않으면 ; 한 줄을 먼저 둔다(이번 167 파일은 모두 ; 로 끝나 해당 0).
- 어떻게: docs/design/harness/module-split/gen-cell-provide.js 방식: 표지 사이 제거 후 재부착, 두 번째 실행 changed 0 을 측정으로 남기고, 블록을 걷어 내면 기준 파일과 같음(appendOnly.allSame)을 보인다. 근거: docs/specs/REQ-TASK-ES-611-CELL-REGISTRY-B2.md 0·3절.
- 출처: #885 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L089. 생성기(gen-inline-hard.js)가 바뀐 main 을 합친 뒤에는 같은 proof.json 을 새 생성기로 기준 index.html 에 다시 돌려 커밋된 index.html 과 바이트 동일한지 확인하라.**
- 왜: PR #907 은 #906(생성기 unstate 모드)이 병합돼 법정이 새 생성기로 다시 돌리게 되자, 새 생성기로 같은 proof.json 을 기준 index.html 에 돌린 결과가 커밋된 index.html 과 바이트 동일(405,730바이트)임을 확인하고 합친 뒤 npm test·측정·로컬 법정을 다시 돌렸다.
- 어떻게: 합친 뒤 index.html·js/**·scripts/**·tests/**·court/**·기준선 차이 0 을 확인하고, git cat-file 원시 blob 으로 대조한다(L060). 근거: docs/specs/REQ-TASK-ES-632-UNWIRE-PINNED.md
- 출처: #907 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L109. 생성기의 this/arguments 허용은 함수 선언 전용 검사를 감싸기 판정과 따로 두고, 허용 범위를 조문 문장만큼만 두라.**
- 왜: PR #929 는 헌법 CELL_SPLIT 5호 개정(#925)을 생성기·검사기에 옮겼다. fnDeclThisArgs(새)는 this(그 함수 층, 화살표 안 포함)·자기 arguments(가장 가까운 함수 부모가 그 선언 자신)·화살표 안 arguments 를 따로 세고, 감싸기 판정 wrapSafe·var 함수식 판정이 쓰는 topThisArgs 는 그대로 두었다. 정지 문구는 「최상위 this/arguments(유형 K) — 옮기지 않는다: <이름>」 그대로다.
- 어떻게: 단위 시험(D1)이 unwire·unstate·region 구간의 글자는 기준과 같고 기준에서 사라진 줄은 함수 선언 검사 호출 한 줄뿐임을 잰다. 근거 절: 2·3절. 근거: docs/specs/REQ-TASK-ES-657-GEN-FN-ARGUMENTS.md
- 출처: #929 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L114. 생성기 sweep(문이 없는 구획의 주석·빈 줄 삭제)은 구획 주석 자체는 지우지 마라.**
- 왜: PR #932(REQ-TASK-ES-661)의 닫힌 목록 X8 정지 조건이 함수 이전 생성기가 기대는 자리 표지·구획 주석·1차 이음매 주석을 든다. 지도 도구(inline-script-map.js)도 묶음을 구획 주석으로 가르므로, 남기면 지도의 묶음 수·제목·순서가 그대로다.
- 어떻게: sweep 은 문이 0 인 구획의 주석 줄·빈 줄만 지우고 지운 뒤 다시 파싱해 토큰열이 그대로인지 스스로 본다. 대상은 적용 시점의 index.html 을 재서 정한다. 근거: docs/specs/REQ-TASK-ES-661-GEN-SWEEP.md 4절.
- 출처: #932 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L119. 생성기의 잠금(돈 근처·결심 대기 이름)을 푸는 허용은 조용히 풀리지 않게 하라 — 적은 이름만, 근거 글자가 있을 때만, 쓰일 때만 지나가고 출력·메타에 남긴다.**
- 왜: PR #938 의 region 모드 allowGuarded 는 설정 맨 위의 [{ name, approval }] 로 잠긴 이름을 명시적으로 허용한다. 적지 않으면 예전 글자 그대로 멈추고, 목록 밖 이름은 적어도 안 받고, 근거 글자가 없으면(10자 이상 한 줄) 안 받고, 쓰이지 않는 허용도 안 받으며, 적은 것은 출력·메타(guardedAllowed)에 남는다. 허용해도 바뀌는 글자는 이름 접두 L. 뿐이다.
- 어떻게: 단위 시험으로 위 다섯 경우를 잰다. 허용이 걸린 구역 이전(PR #939 의 OurgoalTemplateCredit·OURGOAL_CONFIG 초기화 블록)은 결심 승인 원문을 REQ 에 인용한다. 근거: docs/specs/REQ-TASK-ES-670-GEN-REGION-GUARDED.md R2·핵심 및 REQ-TASK-ES-671.
- 출처: #938 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

### 화면 검증 (6)

**L026. 조작 DOM 비교는 기준 대 기준도 함께 돌려 본질 변동(타이밍·난수·실행마다 다른 저장값)을 걸러낸 뒤 기준 대 작업 차이를 판단하라.**
- 왜: maxBaseCrafts·lastStreakAwarded 같은 저장값과 아바타 인사(22시 경계)·가이드 400ms 경쟁이 같은 기준 두 번에서도 달라졌다.
- 어떻게: Math.random 씨앗 고정, 실행마다 다른 키는 비교에서 빼고 그 사실을 REQ 에 기록. tab-check 는 기준 2회·후 1회.
- 출처: #764 #772 #773 #775 #836 #837 · 처음 2026-10-05 · 확인 6회 · 대상 claude·antigravity·codex

**L025. 닫힌 <details> 안의 단추가 「가려짐·죽은 클릭」으로 잡히면 결함으로 단정하지 말고, 바깥 details 를 펼친 뒤 elementFromPoint·진짜 마우스로 다시 눌러 확인하라.**
- 왜: #checkinFeedbackTierBar·#btnModeGamified·#customFeedbackBtn·#advancedSettingsSummary·#btnRestartGuide 모두 측정 착시였다(getBoundingClientRect 는 0 이 아니지만 elementFromPoint 는 뒤 요소를 돌려줌).
- 어떻게: court/lib/scenario.js 클릭 도구로 기준 커밋에서 375·1280 두 폭, 바깥 details 펼친 뒤 클릭.
- 출처: #767 · 처음 2026-10-05 · 확인 3회 · 대상 claude·antigravity·codex

**L042. 화면에 안 보이는 기능은 옮기지도 고치지도 말고 「CSS 숨김에 갇힌 기능」 목록에 올려 결심으로 넘겨라**
- 왜: 2026-10-05 분열 중 #recCalFuseSwitcher·#quickStopwatchBar·빠른 추가 입력칸·루틴 매트릭스 등이 ui.css display:none !important 에 갇혀 게스트 시나리오로 잴 수 없었음. 숨김을 풀지 지울지는 승인선 ③
- 어떻게: elementFromPoint·크기 0 으로 실측 → 숨긴 규칙 위치(파일:행) 기록 → 결함 목록·숨김 게이트 기준선과 대조 → 상민님 결심 표에 「실제로 하는 일」을 코드에서 읽어 적기
- 출처: #796 · 처음 2026-10-05 · 확인 3회 · 대상 claude·antigravity·codex

**L027. 숨김 규칙에 갇혀 보이는 진입로가 없는 살아 있는 기능을 찾으면 숨김을 좁혀 보이게 복원하고, 새 숨김은 hidden-entry-guard 가 막게 하라.**
- 왜: #763 이 알림 센터 죽은 종·보관함·위클리 리캡·앱 평가·오늘의 카드·3대 퀘스트를 복원했고, #766 숨김 게이트(증가 금지 기준선)가 재발을 막는다.
- 어떻게: scripts/hidden-entry-guard.js(npm test 안) + 느린 브라우저판 docs/design/harness/hidden-entry-sweep.js. 복원한 항목은 --update 로 허용 목록을 줄인다. 새 !important 숨김 0.
- 출처: #763 #766 · 처음 2026-10-05 · 확인 2회 · 대상 claude·antigravity·codex

**L053. UI 비교의 실행마다 다른 ID는 일대일 대응·키 개수·연결을 보존하고, 해시 차이는 실제 제품 계산식으로 입증하라.**
- 왜: PR837 첫 비교는 서로 다른 목표 ID를 같은 placeholder로 합쳐 미션·요약 키를 줄였다. 재검토에서1603항목·원래 제품 해시90개·실제 마우스 coverage를 독립 대조했다.
- 어떻게: 기준2회·작업1회 원시 보존. 정규화 ID bijection·키 개수·연결 불변식을 확인한다. 실제 제품 AST에서 계산식을 읽어 남은 해시 차이를 검증한다. page.evaluate 버튼.click·함수 직접호출·상태주입으로 실제 UI를 대체하지 않는다. 못 잰 것은 측정불가.
- 출처: #837 · 처음 2026-10-06 · 확인 1회 · 대상 claude·antigravity·codex

**L101. 쓰기가 일어나는 조작(복제 등)은 보존 시나리오에 넣지 말고, 기준에서 예외로 죽는 조작도 넣지 말고 발견으로 보고하라.**
- 왜: PR #917 의 복제를 누르면 내 템플릿 저장과 서버 복제 기록 호출이 일어나므로 지시대로 시나리오에 넣지 않고 복제 본체의 동일성은 생성기 재실행 바이트 대조·토큰 동일·줄 단위 비교로 보였다. 마켓 창의 「미리보기」 단추는 기준에서도 예외(Cannot set properties of null)로 죽어 시나리오에서 뺐고 고치지 않았다.
- 어떻게: 기준 트리에서 게스트로 눌러 실측해 발견으로 REQ 에 적고, 화면으로는 닿는 길(기록 탭 템플릿 카드 칩·맞춤기록 창 마켓 단추)만 재라. 근거: docs/specs/REQ-TASK-ES-645-TEMPLATE-MARKET-MOVE.md
- 출처: #917 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

### 데이터 무손실 (2)

**L028. 동기화 큐·저장 경로는 실패를 삼키고 비우지 마라 — 성공한 항목만 지우고 실패는 남겨 재시도하며 사용자에게 알려라.**
- 왜: 오프라인 큐가 동기화 오류를 삼키고 큐를 비워 기록이 사라질 수 있었다(GUARD_03). #783 이 성공 항목만 지우고 30초 뒤 재시도하게 고쳤다.
- 어떻게: 실패 재현 시나리오(오프라인 체크인 → 온라인 → 서버 실패)와 노드 시험(기준 실패·작업 통과)으로 입증.
- 출처: #783 · 처음 2026-10-05 · 확인 1회 · 대상 claude·antigravity·codex

**L029. 화면에서 바뀌는 사용자 데이터(마일스톤 체크 등)는 메모리만 바꾸지 말고 saveProfile 등 서버 원장 저장까지 연결하라.**
- 왜: 목표 상세 서랍의 마일스톤 토글이 메모리만 바꾸고 저장하지 않았다(#767 에서 saveProfile 추가).
- 어떻게: 게스트는 새로 고침 뒤 유지 시나리오, 로그인 서버 저장은 실계정 하네스로.
- 출처: #767 · 처음 2026-10-05 · 확인 1회 · 대상 claude·antigravity·codex

### 승인선 (12)

**L044. 헌법 개정은 커널 정본 하나(01_OURGOAL_SUPREME_CONSTITUTION_FULL.md)만 고친다 — 포인터(CLAUDE.md 가져오기 줄·AGENTS.md 요약 포인터)는 바뀌지 않는다. 버전 표기·이전 커널 archive 보관·법령 전문 머리 「현행 커널 버전」·버전 대장 행(PR 번호까지)을 **같은 PR 에** 넣고 상민님 직접 병합까지가 한 묶음이다. 병합 뒤 같은 턴에 홈 사본(C:/Users/HP/AGENTS.md)을 **정본 내용**으로 동기화하고 병합 커밋을 기입(대장 행·법령 머리)한다. 어긋나면 `node court/appendix.js --versions` 가 잡는다(정본 1 + 포인터 2 검사, 2026-10-10 CORE)**
- 왜: 2026-10-06 v2026.10.06-SNOWBALL 개정(PR #800)을 상민님이 직접 병합. 법정은 금고 PR 을 「확인 부족 — 상민님 결심」으로만 표시하므로 위임 병합이 아니다 / 2026-10-07 v2026.10.07-PRESERVATION(PR #850) 병합 뒤 대장 행·법령 머리 기재가 빠져 3일간 10.06 이 현행으로 안내됨 — 이 경험칙이 「병합 뒤 후속 PR」로 적혀 있어 사람 손에 맡겨진 것이 원인. v2026.10.10-OUTCOME(PR #875)에서 같은 PR 묶음으로 바꾸고 검사기를 넣었다
- 어떻게: PR 전: 멱등 적용 스크립트로 세 사본 동일 적용(치환문 존재를 먼저 검사, 앵커⊂치환문이면 앵커 검사만으로는 재실행 때 중복) → `node court/appendix.js --versions` problems 0 → 대장 10.xx 행(승인 근거 칸은 PR 생성 뒤 번호 기입) → archive 에 직전 커널 원문. PR 후: `git show origin/main:AGENTS.md > C:/Users/HP/AGENTS.md`(홈 사본은 LF) → 병합 커밋을 대장 행·법령 머리에 기입하는 후속 PR(금고라 상민님 병합) → gen-reference.js / 2026-10-10 SLIM 개정: 옮긴 뒤 뺀다 — 적용기는 대상 문서가 먼저 있어야 실행되게 만든다. 주장 파일의 unverified 는 reason(4종 중 하나)·who·how 가 모두 있어야 예비 점검을 통과한다 — 법정이 글자로 잴 수 있으면 static 으로 쓴다 / 2026-10-10 CORE 개정(PR #879): 세 사본 동일 → 정본 1 + 포인터 2. 적용 스크립트는 정본만 쓴다. 포인터에 커널 본문을 넣거나 가져오기 줄을 빼면 --versions 가 불일치로 알린다 / 2026-10-11 ALIGNED(PR #881): 법령 전문은 커널의 해설·상세·부록(커널 14.5) — 전문 개정도 ⑤, 전문을 읽는 기계(무결성 게이트·smoke-test·appendix) 문구는 먼저 세고 건드리지 않는다. 병합 기록 PR 과 다음 개정 PR 이 같은 머리 줄을 고치면 충돌 — 다음 개정 브랜치에 기록 PR 브랜치를 먼저 합치고 「#N 뒤에 병합」을 PR 제목에 적는다
- 출처: #800 #875 #877 #879 #881 #925 #926 · 처음 2026-10-06 · 확인 6회 · 대상 claude·antigravity·codex

**L030. 값이 없을 때 그럴듯한 숫자를 넣는 대체값(|| 3, || 25, 하드코딩 Lv.1)은 허상지표다 — 실제 값이 없으면 숫자를 그리지 마라.**
- 왜: 리캡 카드 「3일 연속」(|| 3)·하드코딩 Lv.1·통계 카드 || 3·리캡 durationMinutes || 25·주간 집중 endAt 없으면 25분이 모두 하지 않은 성과를 보여줬다(#767·#777·#791).
- 어떻게: 실제 계산 함수(computeStreakDays·levelProgress)를 쓰고 0·없음이면 그 줄/칸을 생략. 시험이 대체값을 정답으로 고정하면 결심(L008).
- 출처: #767 #777 #791 · 처음 2026-10-05 · 확인 4회 · 대상 claude·antigravity·codex

**L033. 돈(구독·광고·크레딧·결제) 근처 묶음은 옮기기조차 하지 말고 건너뛰어 보고하라.**
- 왜: P0 의 subscriptionState·OURGOAL_CONFIG, H3 의 「템플릿 복제 보상형 광고」는 커밋 훅 AL1(돈) 표시와 승인선 ①로 건너뛰었다.
- 어떻게: 묶음 제목·이름에 subscription·paywall·ad·credit 이 있으면 손대지 않고 보고.
- 출처: #764 #774 #917 · 처음 2026-10-05 · 확인 3회 · 대상 claude·antigravity·codex

**L031. 코드에 박힌 가짜 사람·가짜 인원·전송 없는 성공 토스트를 발견하면 고치지 말고 결심 후보로 올려라(삭제는 승인선 ③).**
- 왜: 챌린지 룸(가짜 방장 10명·가짜 인원), 무공해 응원 바(「응원을 전송했습니다」 전송 없음), DM 시트(「대화방이 연결되었습니다」 박힌 시트)가 GUARD_02·제13조 위반이었다. 상민님이 정리 4건을 승인.
- 어떻게: 결심 요청에 코드에서 읽은 실제 동작(문구·호출부·저장 칸)을 그대로 적고 권장안 하나와 선택지별 장단점.
- 출처: #767 #777 · 처음 2026-10-05 · 확인 2회 · 대상 claude·antigravity·codex

**L032. 기능 삭제 결심을 올리기 전에 그 기능이 실제로 무엇을 하는지 코드로 확인하라 — 동작하는 기능이면 삭제 대신 진입로 연결·문구 정정으로 풀 수 있다.**
- 왜: 목표 상세 서랍(#goalDetailDrawer)은 고아로 보였지만 진척·마일스톤 토글이 동작해 진입로를 붙였고, 레벨 배지 모순은 문구 정정으로 풀려 결심 3건 중 2건이 결심 없이 해결됐다.
- 어떻게: grep 으로 정의·호출부 전수 확인 → 동작 여부 → 삭제가 정말 필요할 때만 [결심 필요].
- 출처: #767 · 처음 2026-10-05 · 확인 2회 · 대상 claude·antigravity·codex

**L080. 금고 파일(scripts/verify-integrity-gate.js 등)의 변경은 금고만 담은 별도 PR 로 올리고 상민님 승인 원문을 인용하며, 위임 병합 대상으로 취급하지 마라.**
- 왜: PR #901 은 상민님 2026-10-11 사전 승인 문구 「철거 2차 사전 승인, 금고 변경 승인」을 근거로 옛 배선 글자 단언 한 줄을 「옛 글자 또는 세포 등록」으로 넓혔다. REQ 는 변경 파일을 금고 파일 하나와 서류뿐으로 한정했고(R2), 금고 변경이라 위임 병합 대상이 아님을 적었으며(헌법 MERGE_GATE 3), 상민님이 하지 않은 말을 승인으로 적지 않았다.
- 어떻게: REQ 에 승인 원문과 그것으로 하는 것/하지 않는 것을 적고, 바뀐 검사는 주장 파일 retire 에 검사 제목으로 사유를 적는다(검사 수 그대로·폐기 0). 근거: docs/specs/REQ-TASK-ES-623-GATE-WIRING-TEXT.md 0·R1~R3·이탈 절.
- 출처: #901 #925 · 처음 2026-10-11 · 확인 2회 · 대상 claude·antigravity·codex

**L123. 지시함 DIR-004 의 닫힌 목록 밖 줄 종류를 쓰는 옵션은 PR 이 법정 통과여도 결심 전에는 병합하지 말고, 결심 뒤 「쓸 수 있게 준비」까지로 범위를 적어라.**
- 왜: PR #955(생성기 옵션 relay·keepInline·dropDeadImport)는 지시함 DIR-004 (가) 「목록 밖의 줄 종류는 다시 결심이다」에 걸려 오케스트레이터가 병합을 미루고 [결심 필요] 로 여쭈었다. 상민님 2026-10-11 「권장대로 모두 진행」 세 종류 승인(오케스트레이터가 전한 글자) 뒤 병합됐다. 처음 올린 판에는 「결심 대기」로 적혀 있었다.
- 어떻게: REQ·PR 본문에 결심 기록(원문·전달 경로)을 적고, 옵션이 닫힌 목록 표가 아니라 5.3(이 목록으로 풀리지 않는 것)에 사안으로 적혔음을 밝히며, 옵션을 실제로 쓰는 PR 은 그 옵션에만 쓰고 그 밖의 문에는 쓰지 않았음을 proof.json 으로 보인다. 근거: docs/specs/REQ-TASK-ES-681-GEN-FINALIZE-OPTIONS.md 결심 기록·PR #955 본문.
- 출처: #955 #961 #962 · 처음 2026-10-12 · 확인 2회 · 대상 claude·antigravity·codex

**L097. 옮기는 코드가 마크업에 없는 요소를 다루고 있어도(아무 일도 하지 않음) 이전 PR 에서 지우지 말고 발견으로 보고만 하라.**
- 왜: PR #913 에서 퀵 루틴 칩 줄 #quickRoutineRow 는 지금 index.html 마크업에 없어 bindQuickRoutineChips 가 요소가 없어 아무 일도 하지 않는다(이전 전과 같다). 지울지는 승인선 ③(기존 기능의 실제 삭제)이라 고치지 않고 보고만 했다.
- 어떻게: REQ 6절 또는 발견 항목에 적고, 옮긴 동작은 이전 전과 같게 둔다. 근거 절: 4절 발견. 근거: docs/specs/REQ-TASK-ES-640-WRAP-BOOT-2.md
- 출처: #913 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L098. 돈 근처 코드를 옮길 때는 지시함 DIR-004 의 한도 문장을 origin/main 에서 읽은 글자 그대로 REQ 에 인용하고, 한도를 넘어야만 옮길 수 있으면 옮기지 말고 멈춰라.**
- 왜: PR #917 은 L033(돈 근처 묶음은 옮기지 말고 건너뛰어 보고)에서 (나) 이탈로 executeDirectTemplateClone·openTemplateMarketModal 을 옮겼다. 지킨 한도: 생성기가 붙이는 이름 접두(L.) 말고는 글자 0 변경 · 동작·문구·금액·조건 0 변경 · 광고·구독·결제 관련 줄을 새로 만들거나 지우지 않는다.
- 어떻게: REQ 0절에 한도 원문과 이탈 사유(어느 규칙·왜·대신 무엇·검증)를 적고, 옮긴 구간에서 돈 관련 줄의 수와 글자가 그대로임을 측정으로 보인다. 근거: docs/specs/REQ-TASK-ES-645-TEMPLATE-MARKET-MOVE.md
- 출처: #917 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L107. 상민님 사전 승인으로 세션이 헌법 개정 PR 을 병합한 경우, 병합 기록 기입에 「상민님 계정의 직접 병합이 아니다」(병합 계정)와 승인 근거를 사실대로 남겨라.**
- 왜: 앞선 개정 PR #875·#877·#879·#881 은 yangsangmin 계정이 병합했지만 PR #925 의 병합자는 ourgoaltest 계정이다. 상민님 2026-10-11 사전 승인 「헌법 개정 승인 및 병합 사전 승인」 범위로 오케스트레이터 세션이 판정 확인 뒤 병합했고, 후속 PR #926 이 대장 v2026.10.11-ARGUMENTS 행 승인 근거 칸과 법령 전문 머리 「현행 커널 버전」 줄에 그 사실을 한 줄씩 기입했다(조문 변경 0).
- 어떻게: 병합 사실은 gh pr view <번호> --json mergedAt,mergedBy,mergeCommit 으로 GitHub 에서 되읽은 값으로 적고, 기입 PR 은 멱등 스크립트로 각 1줄 치환한다. 법정은 금고 경로 변경을 「확인 부족 — 상민님 결심」으로만 표시하므로 위임 병합 근거는 사전 승인 원문이다. 근거: docs/specs/REQ-TASK-ES-654-CONSTITUTION-ARGUMENTS.md 및 PR #926 본문.
- 출처: #925 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L108. 헌법 개정에서 조문에 대응하는 법령 전문 조문이 없으면 전문 본문은 건드리지 말고 전문 머리의 현행/직전 꼬리표만 바꾸며, 전문 판은 올리지 마라.**
- 왜: PR #925 는 CELL_SPLIT 5호 arguments 한 문장 개정인데 법령 전문 docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md 에 대응하는 조문이 없었다(커널 조문 14.5). 그래서 전문 본문 변경 0, 머리 11~13행에서 현행을 새 줄로 더하고 옛 현행→직전, 옛 직전→그 전으로 꼬리표만 바꿨으며 「법령 전문 판」 줄은 그대로 두었다.
- 어떻게: 버전 표기는 커널 1·5·12행과 직전 커널 archive(docs/rules/archive/AGENTS_KERNEL_v2026.10.11-ALIGNED.md)·버전 대장 새 행까지 한 묶음으로 하고(조문 14.3), court/appendix.js --versions problems 0 으로 확인한다. 헌법 PR 은 금고만 담고 함수 이전 같은 제품 변경은 별도 PR 로 한다. 근거: docs/specs/REQ-TASK-ES-654-CONSTITUTION-ARGUMENTS.md 및 PR #926 본문.
- 출처: #925 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L125. 승인받은 꼴이 독립 확인에서 동작을 보존하지 못하면 병합하지 말고 대안을 재서 다시 여쭈어라 — 승인은 꼴이 아니라 보존을 전제로 한 것이다.**
- 왜: 상민님이 승인했던 꼴(서버 연결 세 줄을 인라인에 남김 — PR #959)이 독립 확인에서 로그인 사용자 부팅 차이를 보여 병합하지 않고 닫았다. 오케스트레이터가 [결심 필요] 로 다시 여쭈었고 2026-10-12 상민님 「p안 승인」(서버 주소·공개 키 선언 두 줄만 index.html 에, 연결 만들기와 나머지는 부팅 파일로)으로 옵션 keepGlobalConst(#961)와 마지막 정리 PR #962 가 병합됐다(inlineScriptLines 442 → 24, 덩어리 0줄).
- 어떻게: 닫은 PR 의 측정을 후속 PR 의 REQ 에 근거로 옮기고, 새 꼴이 닫힌 목록 밖이면 결심 기록(원문·전달 경로)과 한도(옵션을 쓴 자리)를 적는다. 근거: docs/specs/REQ-TASK-ES-689-FINALIZE-P.md 결심 기록 및 PR #962 본문·병합 근거 기록.
- 출처: #962 · 처음 2026-10-12 · 확인 1회 · 대상 claude·antigravity·codex

### 안티그래비티 (5)

**L054. 검증 수치를 원시 기록에서 자동 추출하고 제출 전에 증거 목록·입력 해시·필수 측정·참조 경로를 기계 검사하라.**
- 왜: #838 로그 인코딩 혼용, #839 복사한 미측정 값과 실행별 원시 없는 집계, #840 부분 비교·click true 고정·기준 해시 오기·npm과 개별 시험 혼동을 Codex가 보완했다. 기록 DB에 보완점이 남아도 플레이북과 기본 지시서로 승격하지 않아 반복했다. #847은 로컬 origin push를 GitHub 제출로 오인했고 정확 head·raw 실패/성공·Court R2 주장 누락을 독립 대조해 보완 후 59BAC901 판정으로 병합했다. 제품 분열 품질 효과는 아직 미측정이다.
- 어떻게: C:/dev/agy-collab/TEMPLATE.md의 반복 누락 예방 항목을 지시서마다 유지한다. evidence-manifest.json에 측정/미측정/차단, 입력 커밋·SHA256·명령·종료코드·원시/게시 경로를 남기고 제출자료 검사기로 누락·파일 부재·파싱 실패·입력 불일치를 차단한다. 전체DOM/저장값/토스트/console 내용과 실제 click을 비교하고 npm과 개별 시험 결과를 구분한다. 원시 실패/성공을 보존한다. 검사기 도입의 효과는 TASK581부터 별도 측정하며 법정 판정을 대체하지 않는다. push 뒤 gh pr view로 실제 PR URL·head를 되읽고 git remote/rev-parse와 대조한다. Court 요구마다 자기 주장을 연결하며 작업자 설치 로그 기록과 법정의 실제 재측정을 구별한다. 원시 로그 실패를 성공 계약으로 기록하지 않는다.
- 출처: #838 #839 #840 #841 #842 #844 #846 #847 · 처음 2026-10-06 · 확인 8회 · 대상 claude·antigravity·codex

**L034. 안티그래비티에는 결과를 기계로 검사할 수 있는 반복 실행(스크립트 재생성·결정론 재실행·시험)을 맡기고, 판단이 필요한 코드 이동은 맡기지 마라.**
- 왜: 생성 지도 일괄 갱신은 결함 0·Claude 마무리 15분으로 한 번에 성공(#787). G076 코드 이동은 결함 3건·Claude 마무리 62분(#765).
- 어떻게: C:\dev\agy-collab\TEMPLATE.md 로 지시서를 쓰고, 노션 「안티그래비티 작업 기록」 최근 5건 보완점을 반영.
- 출처: #765 #787 · 처음 2026-10-05 · 확인 2회 · 대상 claude·antigravity

**L035. 안티그래비티 지시서에는 git config 변경 금지·tests 수정 금지·본 체크아웃 실행 금지·임시 파일 저장소 밖·지시 밖 명령 금지·npm test 전경 실행을 반드시 넣어라.**
- 왜: 실측 버릇: user.name 을 Antigravity 로 바꿈, 시험 하드코딩, 임시 파일 방치, 본 폴더 실행, 지시 밖 tri-sync 실행, npm test 를 뒤로 돌리고 멈춤.
- 어떻게: TEMPLATE.md 의 Hard rules 를 지우지 않는다. 검수 첫 줄: git -C C:/dev/ourgoal-app config user.name 확인.
- 출처: #765 #787 · 처음 2026-10-05 · 확인 2회 · 대상 claude·antigravity

**L036. 안티그래비티는 「안전한 방법이 없으면 멈추고 보고하라」를 잘 지키니, 지시서에 멈춤 조건을 구체적으로 적어라.**
- 왜: G086(공유 상태 통로 없음)·관리자 복구(노출 안 된 이름) 두 번 모두 정당하게 멈췄고, 원본 결함(renderHomeScreen 오타)까지 찾아 보고했다.
- 어떻게: 「X 가 필요하면 STOP and report」 형식으로 조건을 나열.
- 출처: #767 · 처음 2026-10-05 · 확인 2회 · 대상 claude·antigravity

**L037. 안티그래비티에 묶음을 맡기기 직전에 origin/main 에 그 묶음이 아직 있는지와 다른 빌더 배정과 겹치지 않는지 Claude 가 확인하라.**
- 왜: 배치3 의 3묶음 중 2개가 이미 P1 빌더가 옮긴 뒤라 취소됐다(Claude 배정 실수).
- 어떻게: 설계 문서 배정 칸에 「안티그래비티 몫」을 먼저 적고, inline-script-map 에서 제목으로 존재 확인.
- 출처: #756 · 처음 2026-10-05 · 확인 1회 · 대상 claude

### 보고 (9)

**L038. 상민님 보고는 쉬운 한국어로 「한 것 / 측정으로 검증한 것 / 다음에 열리는 것」, 결심이 필요하면 [결심 필요] + 권장안 하나 + 승인 시 하는 일·그 다음 + 선택지별 장단점·예상 결과로 써라.**
- 왜: 상민님은 코드를 보지 않는 결정권자이고 답은 짧게 온다. 세부 설명을 요구한 적이 있다(25분 결심).
- 어떻게: 수치는 스크립트 산출(module-metrics 등)만 인용하고 출처 커밋을 붙인다. 질문으로 끝내지 않는다.
- 출처: 운영 원칙 · 처음 2026-10-05 · 확인 5회 · 대상 claude·antigravity·codex

**L039. 병합한 세션은 같은 턴에 세포지도(웹·노션)와 허브 최상단 갱신 시각을 갱신하고, 노션 제목 줄은 {toggle="true"} 를 유지하라.**
- 왜: 헌법 CELL_MAP. 접기 제목이 일반 제목으로 바뀌면 세포가 페이지 바닥으로 흩어진다(3영역 53세포 사고).
- 어떻게: cell-map-publish --root . → 웹 db 원자 갱신·되읽기 deepStrictEqual → 노션 줄 단위 편집 → --verify-notion 「세포 펼침 N/N·영역 제목 16/16」 → jsDelivr 퍼지.
- 출처: #761 #787 · 처음 2026-10-05 · 확인 3회 · 대상 claude·antigravity

**L040. 빌더·에이전트에게 일을 줄 때 작업계획서 경로를 그 작업 트리 안(.claude/plan-작업번호.md)으로 지정하고, 커밋 훅이 쓰는 NODE_PATH 를 git commit 과 같은 셸에 export 하게 하라.**
- 왜: 경로를 안 주면 같은 세션 번호라 상위 계획서를 덮어쓴다. NODE_PATH 없이 커밋하면 훅 smoke 가 @supabase/supabase-js 를 못 찾아 실패했다.
- 어떻게: export NODE_PATH=C:/dev/ourgoal-app/node_modules; git commit ...
- 출처: #761 · 처음 2026-10-05 · 확인 3회 · 대상 claude·antigravity·codex

**L052. REQ의 표준 8원칙 서식을 먼저 기존 무결성 게이트로 검사한 뒤 전체 npm 검증을 실행하라.**
- 왜: #830의 표준 헤더 교정, #832의 구형 원칙 헤더, #835의 원칙② 원인·중심·핵심 누락으로 문서 형식이 첫 검증을 막았다. 제품을 바꾸지 않고 서식을 보강해 검증을 완료했다. 같은 작성 마찰은 문서 작성 직후 검사로 먼저 잡는다.
- 어떻게: REQ에 독립된 ## N. [원칙 ①]~[원칙 ⑧] 헤더, 원칙②의 본질·원인·중심·핵심, 원칙⑥ 재검증과 반론을 적는다. node scripts/verify-integrity-gate.js를 먼저 실행하고 문서 오류를 고친 뒤 npm test를 실행한다. 금고 검사 코드·기대값은 변경하지 않는다.
- 출처: #830 #832 #835 · 처음 2026-10-06 · 확인 3회 · 대상 claude·antigravity·codex

**L041. git 훅을 건너뛰지 마라(--no-verify 금지) — 이름 바꾸기만 든 커밋이어도 예외 없음**
- 왜: 2026-10-05 H2 빌더가 번호 바꾸기 커밋 1건을 --no-verify 로 커밋(다음 커밋에서 훅이 다시 돌아 실해는 없었음). 전역 지침·헌법 모두 훅 우회 금지
- 어떻게: 훅이 막으면 원인(대개 NODE_PATH 미설정·티켓 태그 누락)을 고친 뒤 다시 커밋. NODE_PATH=C:/dev/ourgoal-app/node_modules 를 git commit 과 같은 셸에서 export
- 출처: #779 · 처음 2026-10-05 · 확인 1회 · 대상 claude·antigravity·codex

**L043. 작업 유형을 표준·이탈·탐색으로 분류하고, 이탈하면 사유 네 가지를, 새 유형이면 깊은 추론과 자체 검증 설계를 기록으로 남겨라**
- 왜: 2026-10-06 상민님: 참고파일에 없는 유형도 유연하게 깊게 추론하되, 그 유연함이 기존 방식의 면죄부가 되면 안 된다 → 헌법 v2026.10.06-SNOWBALL(SNOWBALL 제2·3항, PR #800)
- 어떻게: 추론 블록 「분류」에 판정(가/나/다)과 근거. 이탈: ①어느 규칙 ②왜(사실) ③대신 무엇 ④검증 동급 이상 — REQ·보고에. 새 유형: 가까운 유형 차용·8원칙 전부·반론 2개·실패 예측·검증 설계 → 끝나면 lessons.json 에 유형 추가. 불변층은 예외 없음
- 출처: #800 · 처음 2026-10-06 · 확인 1회 · 대상 claude·antigravity·codex

**L055. 중첩 실행의 권한 오류와 제품 실패를 구분하고 원시 실패를 보존한 뒤 독립 실행 결과를 별도 증거로 연결하라.**
- 왜: PR #870의 native 실행 안에서 Windows 자식 Git 실행이 EPERM으로 막혀 npm 원시 결과에 실패가 남았다. 원시 기록을 성공으로 바꾸지 않고 동일 산출물의 독립 전체 검사 및 실제 Court 판정·병합을 별도 연결했다. 생성기 history의 lastCommit null도 원문으로 보존하고 실제 입력 HEAD는 외부 증거에 기록했다.
- 어떻게: reports/TASK-ES-603의 native 원시 기록과 root-assembly.json·measurement.json을 구분한다. 동일 입력·파일 SHA를 대조해 별도 실행의 명령·종료코드·원시 경로를 기록한다. 금고·시험·생성 history를 손으로 고쳐 성공을 만들지 않는다. 문서 범위 Court 통과를 모든 제품 주장 검증으로 확대하지 않는다.
- 출처: #870 · 처음 2026-10-09 · 확인 1회 · 대상 claude·antigravity·codex

**L056. 작업 중 측정과 종료 훅 이후의 파일 상태를 구분하고 자동 요약 파일을 성공 기록으로 숨기지 마라.**
- 왜: PR #872의 작업자 측정은 원본 그대로 보존했다. 실제 종료 전에 기존 Stop 훅이 비공개 세션 요약을 추가해 독립 재현의 C49 footprint가 false였다. 제품·보호 파일과 입력은 같았고 정확한 훅 원인을 확인한 뒤 비공개 요약은 보존하며 PR에서 제외했다.
- 어떻게: 원시 측정 시각·native 종료 시각·독립 재현 시각을 연결한다. 저장소 변화와 기존 훅 자동 메타데이터를 실제 경로·SHA·코드 원인으로 대조하고 원시 false를 true로 바꾸지 않는다. 요청 effort와 실제 보고된 effort를 구분하며 미보고 값은 null로 둔다. 문서 Court 통과를 제어 버튼 E2E나 장기 품질 효과로 확대하지 않는다.
- 출처: #872 · 처음 2026-10-09 · 확인 1회 · 대상 claude·antigravity·codex

**L128. 새 부팅 파일을 더하는 PR 은 「부팅 파일이 오지 않으면 예외 없이 앱이 뜨지 않는다」를 알고 병합하는 차이로 기록하라.**
- 왜: PR #962 병합 근거 기록(독립 확인): 알고 병합하는 차이로 전역 이름 둘(SUPABASE_URL·SUPABASE_ANON_KEY — 지금도 페이지에 공개된 값)·script 태그 +1·시동 문의 실행 위치가 인라인 → 부팅 파일·테마 적용이 부팅 파일을 받은 뒤라는 것과 함께, 부팅 파일이 오지 않으면 예외 없이 앱이 뜨지 않음(직전 main 에도 같은 종류의 파일이 있었고 하나 늘어남)을 적었다. 못 잰 것: 실서버 로그인 뒤 끝 화면·OAuth 복귀·캐시가 낀 배포 전환·실기기 그리기 시각.
- 어떻게: 병합 근거 댓글에 알고 병합하는 차이와 못 잰 것을 나눠 쓰고, 병합 뒤 운영 배포본의 게스트 확인과 로그인 확인([손 필요])을 후속으로 올린다. 근거: PR #962 병합 근거 기록(독립 확인).
- 출처: #962 · 처음 2026-10-12 · 확인 1회 · 대상 claude·antigravity·codex

### 검증 (26)

**L060. 이 PC 에서 git 원문 바이트를 대조할 때는 git show·git archive 대신 git cat-file 이나 -c core.autocrlf=false -c core.eol=lf 로 원시 blob 을 읽어라.**
- 왜: PR #883 작업 중 core.autocrlf=true 가 git show·git archive 출력을 CRLF 로 바꿔 바이트 대조(T8)가 어긋났다. 같은 때 cell-map-export 시험은 git 추적 파일만 읽어, 미추적 새 파일에서는 실패하고 스테이징하면 17/17 로 돌아왔다(커밋 뒤에는 무관). PR #974의 원 캡처 도구는 작업 바이트 CRLF와 Git blob LF가 달랐다. 원 manifest를 보존하고 별도 successor seal에서 두 바이트의 SHA를 나눠 기록했다.
- 어떻게: git cat-file -p <blob> 또는 git -c core.autocrlf=false -c core.eol=lf show <커밋>:<경로>. 새 파일을 만든 직후 cell-map-export 시험이 실패하면 git add 한 뒤 다시 돌리고, 미추적 때문이었다는 사실을 measurement.json 에 그대로 남긴다. 근거: docs/specs/REQ-TASK-ES-610-CELL-REGISTRY-B1.md 6·8절.
- 출처: #883 #892 #906 #909 #974 · 처음 2026-10-11 · 확인 5회 · 대상 claude·antigravity·codex

**L078. 로컬 법정 전체 실행(judge.js)이 도중에 끊기면 그 요약을 커밋하지 말고 다시 돌려, 끝까지 돈 결과로 court-local.json 을 정정하라.**
- 왜: PR #896 은 로컬 법정 전체 실행 요약 커밋 뒤 「앞 실행이 도중에 끊겨 다시 돌린 결과」로 요약을 정정하는 커밋을 따로 냈다(커밋 22257d1a). 요약은 작업자 PC 예비 점검이며 판정이 아니다.
- 어떻게: node court/judge.js --repo . --head HEAD --out <임시 폴더> 를 끝까지 돌리고, 끊겼다면 그 사실과 다시 돌린 결과를 reports/TASK-ES-<번호>/court-local.json 에 적는다. 근거: docs/specs/REQ-TASK-ES-624-UNWIRE-UI.md
- 출처: #896 #902 #904 #907 · 처음 2026-10-11 · 확인 4회 · 대상 claude·antigravity·codex

**L092. 값 요약(typeof·길이·해시)이 같다는 것만으로 동작이 같다고 하지 말고, 쓰기 왕복·window 복사 동일성·화면 시나리오를 더해 재고 못 잰 범위를 측정불가로 적어라.**
- 왜: PR #909 의 모의 이전은 값 요약이 「같은 값이 같은 종류의 접근자로 통로에 있다」까지만 보장한다. 그래서 쓰기 가능한 이름 전부의 쓰기 왕복(쓴 값이 그대로 읽히고 되돌려지는가), window[n] === scope[n] 의 동일성, 화면 시나리오 둘, 시험 전부를 더했고 로그인 뒤 화면과 숨겨진 진입로는 측정불가로 적었다.
- 어떻게: reports/TASK-ES-<번호>/ 에 상태 탐침·시나리오·기관 단위 시험 결과를 남기고, REQ 6·8절에 한계를 적는다. 근거: docs/specs/REQ-TASK-ES-636-APP-STATE-ORGAN.md
- 출처: #909 #911 #914 #930 · 처음 2026-10-11 · 확인 4회 · 대상 claude·antigravity·codex

**L079. 게스트 화면이 닿는 범위가 좁은 키트의 철거는 이름 전수 대조와 값 지문을 중심 증거로 쓰고, 화면 시나리오가 재는 범위와 측정불가를 REQ 에 적어라.**
- 왜: PR #898(기록 키트)에서 게스트는 기록 0건이라 카드·히트맵 내용이 그려지지 않는다. 그래서 중심 증거를 화면이 아니라 이름 전수 대조와 값 지문에 두고, 화면 시나리오는 부팅·기록 탭 그리기·구획 전환·검색 다시 그리기가 예외 없이 같게 도는지만 쟀다. 기록이 있는 계정에서의 화면은 측정불가로 적었다.
- 어떻게: 철거 전 이름 목록으로 대조(통로에서 사라진 이름 0·이름별 지문 차이 0)하고, 시점에 따라 흔들리는 토스트 조작(toggleRecordArchive)은 시나리오에 넣지 않는다. 근거: docs/specs/REQ-TASK-ES-626-UNWIRE-RECORDS.md 3·4·6·8절.
- 출처: #898 #902 #913 · 처음 2026-10-11 · 확인 3회 · 대상 claude·antigravity·codex

**L088. node_modules 가 없는 작업 폴더에서 로컬 법정을 돌리면 넓힌 시험 단언의 도우미가 @babel/parser 를 못 불러 거짓 실패가 나므로, 의존성이 있는 저장소를 --repo 로 주고 같은 커밋을 다시 돌려라.**
- 왜: PR #907 작업 폴더에는 node_modules 가 없어 court/judge.js 가 <repo>/node_modules 를 찾지 못했고, 로컬 법정이 「돌려보냄 — 있던 검사가 깨졌는데 말이 없음 외 25건」(예비 점검 E7ED37FE)을 냈다. 원인은 코드가 아니라 환경이었다(기준에서도 4건·작업에서 29건 실패). 의존성이 있는 본 저장소를 --repo 로 주고 같은 커밋을 다시 돌리자 새로 깨진 검사 0 이었다(056A17F0). GitHub 법정은 잣대 쪽에 npm ci 로 의존성을 설치한다.
- 어떻게: 로컬 법정 결과가 이상하면 먼저 <repo>/node_modules 유무를 확인하고, 훅을 우회하지 말고 의존성이 있는 저장소를 --repo 로 줘 같은 커밋을 다시 돌려 환경 탓임을 보인다. 근거: docs/specs/REQ-TASK-ES-632-UNWIRE-PINNED.md 작업 폴더에 npm ci --ignore-scripts 로 의존성을 설치하는 방법도 쓴다(node_modules 는 커밋되지 않는다 — REQ-TASK-ES-636 8절).
- 출처: #907 #909 #914 · 처음 2026-10-11 · 확인 3회 · 대상 claude·antigravity·codex

**L099. 「접두 말고 글자 0 변경」은 생성기의 말이 아니라 생성기와 따로 만든 줄 단위 바이트 비교로 재라.**
- 왜: PR #917 의 prefix-only-check.json 은 기준 index.html 의 옮긴 구간 230줄과 세포 파일의 생성기 표지 아래 230줄을 1:1 로 맞댔다: 바이트 동일 203줄 · L. 접두만 다른 줄 27줄 · 그 밖의 차이 0줄(접두 38 = 생성기 바꿔 쓰기 38, 돈 관련 줄 4 = 4).
- 어떻게: 세포 줄에서 통로 이름 앞의 L. 만 지우면 기준 줄과 바이트 단위로 같아야 한다. 이름 지문(name-fingerprints.json)으로 통로 이름 중 달라진 것이 본문 접두 하나뿐인지도 확인한다. 근거: docs/specs/REQ-TASK-ES-645-TEMPLATE-MARKET-MOVE.md
- 출처: #917 #923 #930 · 처음 2026-10-11 · 확인 3회 · 대상 claude·antigravity·codex

**L066. 철거 전 단계의 충분성은 "지금 통과"가 아니라 옛 배선을 지운 저장소 밖 모의 철거 사본과, commit 태그만 뺀 대조군으로 증명하고, 대조 탐침의 이름 목록은 철거 전 것으로 고정하라.**
- 왜: PR #889 에서 own 을 켠 트리는 IIFE 가 다시 덮어 own 이 틀려도 티가 나지 않는다. 모의 철거 사본에서는 대조·시나리오·module-load·npm test 가 기준과 같았고, commit 태그만 뺀 대조군은 부팅 실패(TypeError: L.pad is not a function)였다. 사본 IIFE 에 남은 window 이름은 28개지만 이름 목록을 고정해 199개 전부 검사했다.
- 어떻게: reports/TASK-ES-614/mock-unwire.cjs 처럼 현행 생성기 unwire 를 변경 없이 사본에 돌리고, 탐침은 --names-from(철거 전 결과 파일)·--fingerprints 로 트리 사이 값을 이름 단위로 맞댄다. 실제 철거는 0 으로 둔다. 근거: docs/specs/REQ-TASK-ES-614-CELL-REGISTRY-OWN.md 4·6절.
- 출처: #889 #909 · 처음 2026-10-11 · 확인 2회 · 대상 claude·antigravity·codex

**L070. 철거 PR 은 push 전에 로컬 법정을 실제 커밋 대상으로 전체 실행해 생성기 재실행 대조가 성립하는지 먼저 확인하라.**
- 왜: PR #891 작업 PC 는 core.autocrlf=true 라 작업 트리 index.html 은 CRLF 이고 법정은 저장소 글자(LF)로 대조한다. 줄바꿈 때문에 생성기 재실행 대조가 어긋날 수 있어, 어긋나면 push 하지 않고 원인을 고치는 것으로 정했다.
- 어떻게: 커밋 뒤 로컬 법정 전체 실행(보존 주장의 기준 2회·작업 1회 화면 대조 포함)을 돌려 요약을 reports/TASK-ES-<번호>/court-local.json 에 남긴다(작업자 PC 예비 점검 — 판정 아님). 근거: docs/specs/REQ-TASK-ES-618-UNWIRE-SETTINGS-1.md 4·6·7절.
- 출처: #891 #894 · 처음 2026-10-11 · 확인 2회 · 대상 claude·antigravity·codex

**L075. 여러 실행을 한 번에 돌린 철거의 측정은 실행 순서대로 줄 번호를 되짚고, 실행마다 「되짚기 직전 줄 수 == 생성기가 적은 htmlLinesBefore」를 확인하라.**
- 왜: PR #894(목표 키트 1차·2차 + 설정 2차 철거)에서 여러 실행의 줄 번호는 실행마다 밀린다. 실행 n 의 줄 번호는 실행 n−1 까지 반영한 글자에 적용되므로 측정이 그 순서로 되짚어야 한다.
- 어떻게: unwire-run.js measure 가 실행 순서대로 되짚어 지운 줄이 가져오기 줄·expose 속성 줄·window 대입 줄(과 빈 껍데기)에 드는지, 세 종류 밖 줄 0 인지 확인하고 unwire-meta.json 에 남긴다. 배열 설정은 첫 사용이라 push 전에 recomputeSplit 을 실제 커밋 대상으로 직접 부르고 로컬 법정 전체를 돌린다. 근거: docs/specs/REQ-TASK-ES-622-UNWIRE-GOALS.md 4·8절.
- 출처: #894 #920 · 처음 2026-10-11 · 확인 2회 · 대상 claude·antigravity·codex

**L077. 2.2초 뒤 사라지는 토스트가 뜨는 조작은 철거 보존 주장의 시나리오에 넣지 말고 이름 대조와 값 지문으로 재라.**
- 왜: PR #896 에서 토스트는 법정이 기준을 두 번 돌려 화면을 맞댈 때 시점에 따라 달라질 수 있어 기준 2회 불일치(「확인 못 함」)가 된다. 단언을 약하게 한 것이 아니라 흔들리는 단계를 넣지 않았고, toast 는 이름 대조와 지문으로 쟀다.
- 어떻게: 보존 주장 시나리오는 시점에 흔들리지 않는 단계로만 쓰고, 토스트가 실제로 뜨는 화면 동작은 측정불가로 REQ 8절에 적는다. 근거: docs/specs/REQ-TASK-ES-624-UNWIRE-UI.md
- 출처: #896 #898 · 처음 2026-10-11 · 확인 2회 · 대상 claude·antigravity·codex

**L083. 철거가 배선 글자를 정답으로 붙잡던 시험 단언은 지우지 말고 원래 목적 그대로 「옛 배선 글자 또는 세포 등록」 둘 다 받게 넓히되, 검사 수와 단언 수는 그대로 두라.**
- 왜: PR #900 은 상민님 2026-10-11 사전 승인 문구 「금고 변경 승인」을 근거로 단언 56줄을 넓혔다(지운 줄 0·폐기 0). 등록 갈래는 글자 찾기가 아니라 파서로 다섯 조건을 모두 보게 했다.
- 어떻게: 공용 도우미 tests/helpers/wiring-exposed.js 의 windowExposed(source, legacyText) 를 쓰고, 바뀐 단언 목록은 reports/TASK-ES-<번호>/changed-assertions.json 의 summary.removedOnly 로 0 임을 보인다. 폐기가 아니라 넓힘이라는 것과 승인 원문을 주장 파일 retire 에 검사 제목별로 적는다. 근거: docs/specs/REQ-TASK-ES-620-WIRING-TEXT-TESTS.md
- 출처: #900 #907 · 처음 2026-10-11 · 확인 2회 · 대상 claude·antigravity·codex

**L104. 구역 이전 PR 마다 저장소 밖 모의 사본에서 시험 전부를 돌려 시험이 붙잡는 글자를 찾고, 시험·가드는 고치지 말고 그 구역을 계획에서 빼라.**
- 왜: PR #919 의 모의 사본에서 시험이 깨지는 건이 실제로 두 건 나왔고 계획에서 뺐다. 시험·가드는 고치지 않았다.
- 어떻게: 구역 계획·모의 적용 수치에는 기준 커밋을 적은 스냅샷임을 밝히고, main 이 움직이면 계획기를 다시 돌린다. 근거: docs/specs/REQ-TASK-ES-643-GEN-REGION.md 6·8절.
- 출처: #919 #933 · 처음 2026-10-11 · 확인 2회 · 대상 claude·antigravity·codex

**L121. 법정·게스트 시나리오·동기 가짜 연결 탐침은 로그인 세션이 있는 부팅을 못 보므로, 연결·인증 부팅을 건드리는 PR 은 진짜 라이브러리 + 저장된 세션으로 재는 독립 확인을 병합 전에 붙여라.**
- 왜: (병합 보류된 PR 의 측정.) PR #959 의 시나리오 30개와 시점 탐침(외부 통신 차단·동기 가짜 연결)은 돌아온 로그인 사용자 부팅의 차이를 보지 못했다. 게스트·세션 없음은 차이가 없었고, 「차례가 같다」는 문장은 게스트 부팅 범위에서만 참이었다. 이 차이는 다른 담당의 전 구간 대조(독립 확인)가 찾았다.
- 어떻게: REQ·PR 본문에 측정불가(로그인 뒤 동작·진짜 서버 연결)를 적고, 병합 전에 저장된 세션이 있는 부팅에서 직전 main 과 새 머리를 같은 방식으로 맞댄다. 근거: PR #959 본문 및 reports 측정불가 항목.
- 출처: #959 #962 · 처음 2026-10-12 · 확인 2회 · 대상 claude·antigravity·codex

**L057. 보존 여부는 전후 실측과 출처에 연결하고, 성공 상수나 실행하지 않은 공개 코드 사본을 실측으로 채택하지 마라.**
- 왜: PR #873의 원 작업자 측정 C34–C38은 저장한 상수를 읽었다. 원자료는 그대로 보존하고 별도 실제 생성기 stdout 재현·19입력·5139보호 파일·설정 전후 대조와 독립35개 검사를 추가했다. 공개 사본은 비공개 경로를 치환한 비실행 문서이며 실제 실행 코드와 SHA를 구분했다.
- 어떻게: 원본 실패와 상수 주장은 고치거나 덮지 않는다. 실제 실행 명령·종료 코드·원시 stdout·전후 파일 SHA·입력 개정·독립 검토를 묶고, 공개 코드 projection과 실제 실행 source의 해시를 각각 적는다. 이전 문맥의 exact replay가 최신 정본 변경으로 더는 유효하지 않으면 새 문맥을 측정하기 전까지 재사용 가능으로 표시하지 않는다. 실제 모델·노력이 미보고이면 null이다.
- 출처: #873 · 처음 2026-10-09 · 확인 1회 · 대상 claude·antigravity·codex

**L064. 새 REQ 를 쓸 때는 8원칙 독립 헤더(## n. [원칙 ①] …)를 8개 모두 두고, 서류를 다 쓴 뒤 npm test 를 마지막에 한 번 더 돌려라.**
- 왜: PR #886 작업에서 서류 없이 돌린 npm test 는 통과했지만, 8원칙 헤더 없는 REQ 를 쓴 뒤 다시 돌리자 검증 5/5 의 린터가 「원칙 1~8 독립 헤더 누락」으로 실패했다. 헤더를 갖춘 REQ 로 고친 뒤 종료 코드 0 이 됐다.
- 어떻게: REQ-TASK-ES-563 같은 선례의 헤더 형식을 따라 쓰고, REQ·claims·dev_log·TICKETS 를 모두 쓴 다음 npm test 를 전경으로 돌려 종료 코드를 기록한다. 근거: PR #886 작업의 npm test 출력(검증 5/5).
- 출처: #886 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L081. 금고 파일이 금고 밖 도우미에 기댈 때는 도우미가 없으면 고치기 전 식 그대로 판정하게 해 짝 PR 병합 순서에 묶이지 않게 하고, 도우미가 있는데 고장 났으면 조용히 내려가지 말고 시끄럽게 실패하게 하라.**
- 왜: PR #901 의 게이트는 windowExposed(source, legacyText) 를 두고 tests/helpers/wiring-exposed.js 가 있으면 그 판정(옛 글자 또는 등록 — 다섯 조건)을, 없으면 source.includes(legacyText)(고치기 전 식)만 쓴다. 짝 PR(TASK-ES-620)과 병합 순서가 바뀌어도 main 의 게이트가 죽거나 느슨해지지 않게 한 것이다(R3, 경험칙 L048).
- 어떻게: 도우미는 있는지만 보고 읽는다(require 오류는 던져 게이트가 실패). 도우미가 금고 밖이라 판정이 바뀔 수 있는 부작용은 PR 본문에 숨기지 않고 적고, 도우미를 금고 목록에 넣을지는 상민님 결정 사안으로 둔다. 근거: docs/specs/REQ-TASK-ES-623-GATE-WIRING-TEXT.md 3·4절.
- 출처: #901 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L082. 철거 계획의 예상 삭제 줄과 실제가 다르면 같은 이름·줄 종류인지 확인하고 앞선 철거로 비게 된 expose 문 껍데기가 지워진 차이인지 unwire-meta.json 으로 설명하라.**
- 왜: PR #902 에서 소통 키트 계획은 1차 123줄·2차 3줄이었는데 현재 main 에서 실제로 돌리니 1차 125줄·2차 3줄이었다. 이름과 줄 종류는 같고 앞선 키트 철거로 비게 된 expose 문 껍데기가 이번 실행에서 지워진 것이다(unwire-meta.json runs[0] removed.exposeCalls 5).
- 어떻게: 계획 수치를 그대로 믿지 말고 실행을 되짚어 줄 번호·종류를 확인하며, 차이가 나면 REQ 에 이유를 적는다. 근거: docs/specs/REQ-TASK-ES-628-UNWIRE-COMM.md 4·6절.
- 출처: #902 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L084. 넓힌 단언이 가짜로 통과하지 않음은 등록을 일부러 깨뜨린 대조군과 도우미 자체 시험으로 보여라.**
- 왜: PR #900 에서 「둘 중 하나」로 넓힌 단언은 둘 다 없으면 반드시 실패해야 한다. 대조군 다섯 변형(예: V5 index.html 에서 commit 태그를 뺌 → 넓힌 이름 전부 39개 거짓)으로 쟀고, 도우미 자체 시험(tests/wiring-exposed.test.js, 검사 16개)은 같은 반례를 가짜 트리에서 쟀다.
- 어떻게: reports/TASK-ES-<번호>/control-group.cjs 로 등록 블록의 window 목록 누락·commit 뒤 로드·commit 태그 제거·등록만 있고 값 없음 변형을 만들어 넓힌 단언이 거짓이 되는지 쟀다. 근거: docs/specs/REQ-TASK-ES-620-WIRING-TEXT-TESTS.md
- 출처: #900 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L086. 시험이 붙잡던 이름이 시험지 수정 뒤 풀렸는지는 글자 검색으로 가리지 말고, 저장소 밖 사본에서 그 이름들을 모의 철거하고 npm test 를 돌려 재라.**
- 왜: PR #904 는 시험지 수정(#900·#901) 뒤 시험에서 풀렸을 것으로 보이는 이름 42개를 글자 검색으로는 가릴 수 없어, 저장소 밖 사본에서 모의 철거하고 npm test 를 돌려 쟀다(pinned-release-mock.json — 실제 철거 0).
- 어떻게: reports/TASK-ES-<번호>/pinned-names-now.json 과 pinned-release-mock.json 처럼 현재 붙잡힌 이름 목록과 모의 철거 결과를 남기고, 실제 철거는 다음 PR 로 미룬다. 근거: docs/specs/REQ-TASK-ES-630-UNWIRE-CALENDAR-ETC.md
- 출처: #904 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L090. X3(한 줄 안 삭제) 철거는 측정이 실행을 되짚을 때 「고치기 직전 줄 글자 == 생성기가 적은 before」를 확인하고 after 로 바꿔 넣어라.**
- 왜: PR #907 은 한 줄을 나눠 쓰는 window 대입 이름 4개(defaultProfile·loadProfile·saveProfile·setTab)를 X3 로 처음 실사용했다. 줄 안 글자 일부를 지우므로 남는 글자가 온전한 문이어야 하고 같은 줄의 다른 대입(window.switchTab = setTab;)이 그대로여야 한다.
- 어떻게: 세 건의 전·후 글자는 unwire-meta.json runs[].inlineEdits 에 있고, 생성기 자신도 지운 뒤 다시 파싱해 토큰열이 예상과 같은지 본다. push 전 recomputeSplit 직접 호출과 로컬 법정 전체 실행을 한다. 근거: docs/specs/REQ-TASK-ES-632-UNWIRE-PINNED.md
- 출처: #907 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L095. 상태 이전은 이름마다 접근자 종류 전이(읽기 전용↔읽기쓰기)가 없음을 확인하고, 기준을 두 번 재도 달라지는 이름은 옮기지 말고 비교에서 빼라.**
- 왜: PR #914 는 통로에 노출된 상태 이름 64개의 값 요약·접근자 종류·window 값·쓰기 왕복을 기준 2회·작업 1회로 맞댔다. 종류 전이는 읽기 전용 그대로·읽기쓰기 그대로·옮기지 않아 그대로 셋뿐이었고 읽기 전용이 읽기쓰기가 되거나 그 반대인 이름은 0이었다. 기준을 두 번 재도 달라지는 이름은 state(시각이 든 객체) 하나였고 옮기지 않았다.
- 어떻게: reports/TASK-ES-<번호>/ 의 상태 탐침 결과로 종류 전이 표를 만들고, 비교에서 뺀 이름과 사유를 REQ 에 적는다. 근거: docs/specs/REQ-TASK-ES-637-UNSTATE-1.md
- 출처: #914 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L110. 차이의 모양을 검사하는 옛 하네스 항목은 생성기를 다시 고치면 구조적으로 거짓이 되므로, 출력을 재는 검사로 대체해 보고하고 그 시험 파일은 고치지 마라.**
- 왜: PR #929 에서 구역 감싸기 시험 묶음(region-check-643.js)을 고친 생성기로 다시 돌리니 67건 중 66건 통과, 실패 1건은 D0 였다. D0 는 「생성기와 #643 이전 생성기의 차이가 한 자리에 끼워 넣은 줄뿐」이라는 diff 모양 비교여서 생성기의 다른 자리를 한 줄이라도 고치면 구조적으로 거짓이 된다(출력 비교가 아니다).
- 어떻게: 출력을 재는 나머지 66건(옮기기 재생성·상태 이전·unwire 확장·B1)이 통과함을 보이고, 이번 단위 시험 D1 로 기존 경로 무변화를 잰다. 실패 1건은 이유와 함께 REQ 6절에 적는다. 근거: docs/specs/REQ-TASK-ES-657-GEN-FN-ARGUMENTS.md 6절.
- 출처: #929 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L111. 게스트 화면에서 불리지 않는 함수의 이전은 기준·작업 트리를 각각 띄워 가짜 값으로 직접 불러 저장 결과를 맞대는 탐침으로 재고, 그것이 작업자 측정이며 진짜 연동 동작이 아님을 적어라.**
- 왜: PR #930 의 saveGoogleToken 은 게스트 화면으로 불리지 않는다. save-token-probe.json 은 기준·작업 트리를 각각 게스트로 띄워 가짜 토큰 객체로 다섯 경우(토큰 없음·인자 둘 통로 호출·… )를 불러 저장 결과(둘째 인자가 email 로 저장, 예전 공용 키 4개 삭제 등)를 맞댔다. 진짜 토큰이 들어오는 길(연동 버튼 → 구글 동의 창 → 토큰 수신)은 법정 도구 한계(needs-live-server)로 재지 못했다.
- 어떻게: arguments-check.json 은 생성기·검사기와 따로 센다(세포의 arguments 1곳, 가장 가까운 함수 부모가 옮긴 함수 선언 자신, 화살표 0·안쪽 보통 함수 0·최상위 this 0). 판정 「확인 부족」의 부족 목록이 R3 하나뿐이면 위임 병합 기준에 해당한다. 근거: docs/specs/REQ-TASK-ES-659-SAVE-GOOGLE-TOKEN-MOVE.md 5·6절.
- 출처: #930 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L116. 생성기 재실행 대조가 없는 손으로 고친 제품 PR(제자리 정리 등)은 법정이 글자 동일을 다시 재지 못하므로, 병합 전에 독립 검토자를 붙이고 재현 방법을 PR 본문에 적어라.**
- 왜: PR #936(944줄 함수 제자리 정리)의 법정 판정서에는 「법정이 다시 재지 않는 것: 글자가 같다(정리 전후 토큰열 대조)」가 있고, 이것은 작업자 대조기·대조군과 병합 전 독립 검토에 기댄다. change: preserve 로 주장했지만 생성기 설정을 다시 돌려 바이트를 맞대는 길이 아니다.
- 어떻게: PR 본문의 「재현 방법(독립 검토용)」에 기준 트리(merge-base 를 분리 HEAD 로 꺼낸 작업 폴더)와 작업 트리(npm ci --ignore-scripts, NODE_PATH 지정)를 적고, 검토자가 전부 작업 트리에서 새로 돌려 확인하게 한다. 근거: PR #936 본문 블록 5 및 docs/specs/REQ-TASK-ES-646-PRO-MODAL-INPLACE.md.
- 출처: #936 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L118. 선언문(var X = function(){…})을 define(…) 인자로 바꾸는 이전은 익명 함수의 .name 이 빈 글자가 되므로, name 을 읽는 자리가 없는지 정적·동적으로 확인하라.**
- 왜: PR #941 R7 은 공유 함수 shareContent 의 var shareContent = function(opts){…} 가 define(…) 인자가 되면 함수의 .name 이 빈 글자가 되는 점을 동작에 영향이 있는지 실측하게 했다. 정적 검사로 제품 코드 375개 파일에서 이 함수 객체가 쓰이는 자리(부른다 5·있는지만 본다 2·딴 이름에 담아 부른다 2·같은 이름으로 window 에 단다 2)를 분류했다.
- 어떻게: name-readers-scan.cjs 같은 정적 검사에 덫(name 접근자)을 건 동적 읽기 0 과 호출 기록이 기준과 같음을 더한다. 근거: docs/specs/REQ-TASK-ES-673-UNSTATE-3.md R7·4절.
- 출처: #941 · 처음 2026-10-11 · 확인 1회 · 대상 claude·antigravity·codex

**L127. 독립 확인이 요청 밖에서 잰 도구(auth-race)는 글자 그대로 옮겨 보관하고 다음 PR 의 주장에 넣어라.**
- 왜: PR #959 의 차이는 다른 담당의 독립 확인(전 구간 대조 2회차)이 요청 밖에서 쟀다. 그 도구 tools/auth-race.cjs(만료 전 가짜 세션을 임시 브라우저 저장소에 넣고 진짜 연결 라이브러리로 돌려 인증 사건 줄을 비교)를 REQ-TASK-ES-687 이 글자 그대로 옮겨 두었고(reports/TASK-ES-687/evidence-959), PR #962 가 finalize-run.cjs authrace 단계로 같은 측정을 했다.
- 어떻게: 증거는 evidence-959 처럼 결과 파일을 글자 그대로 옮겨 두고, 도구는 작성자가 고치지 않은 채 다음 PR 의 주장으로 건다. 근거: docs/specs/REQ-TASK-ES-687-GEN-KEEP-GLOBAL-CONST.md 보고 목록·REQ-TASK-ES-689.
- 출처: #961 · 처음 2026-10-12 · 확인 1회 · 대상 claude·antigravity·codex

### 운영·검증 (1)

**L131. 운영 권한 변경은 원정의 CAS와 역할 검증, 읽기 전용 메타데이터 대조, 실제 화면 검증을 별도 증거로 남긴다.**
- 왜: PR #975는 추가 RPC overload와 계정 전환 캐시 결함을 독립 검토로 발견해 교정했다. 원 의견을 보존하고 모든 13개 함수 CAS, 실제 역할 template 및 적용 후 정의·ACL·정책을 대조했다. 공식 3035B079는 확인 부족이었다. 별도 운영 검증을 법정 판정 또는 사용자 흐름 완료로 바꾸지 않았다.
- 어떻게: 검토 소스 SHA와 적용 transport를 결박하고 단일 적용 뒤 역할·메타데이터 증거를 따로 봉인한다. 실제 화면 읽기는 양성 RPC·대상·DOM 일치가 있어야 확인하며 빈 결과나 오류 안내는 성공으로 세지 않는다. 도구 한계는 실제 실행기·네트워크 제한과 각 미확인 주장 경로를 대조한다.
- 출처: #975 · 처음 2026-10-14 · 확인 1회 · 대상 claude·antigravity·codex

## 이 파일을 키우는 법 (스노우볼)

1. 작업이 끝나면(PR 병합) 그 PR 의 판정서·보고에서 새로 배운 것을 찾는다: 돌려보냄 사유, 막다른 길, 측정 착시, 새 결함 유형, 더 빠른 절차.
2. 이미 있는 경험칙이면 lessons.json 의 확인횟수 +1, 출처PR 에 번호 추가. 새것이면 다음 id 로 한 항목 추가(규칙은 명령형 한 문장, 왜는 실제 사건, 어떻게는 명령·경로).
3. `node gen-reference.js --pr <번호>` 로 이 파일을 다시 만들고, 노션 「에이전트 공통 작업참고」 페이지의 「최신 작업참고」 섹션과 「경험칙」 DB 를 맞춘다.
4. 확인 3회 이상인 경험칙은 지시서 틀(C:/dev/agy-collab/TEMPLATE.md)·빌더 지시문의 기본 문구로 승격한다.
