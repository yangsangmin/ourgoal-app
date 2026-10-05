# REQ/PLAN — TASK-ES-415 헌법 K4 후속: 법령 전문 머리 관계 절 · 버전 대장 행 보충

> 상민님 결심 원문(2026-10-05, PR #727 댓글에 기록): "법정 안건 4건 모두 권장안으로 승인" — K4 A: 커널(`AGENTS.md`/`CLAUDE.md`/`01_OURGOAL_SUPREME_CONSTITUTION_FULL.md`)은 세션이 읽는 실행 정본, 법령 전문(`docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md`)은 상세. "이 개정 병합 뒤 같은 내용을 전문·버전 대장에 반영하는 후속 PR" (REQ-TASK-ES-413 결심 표 K4 A).
>
> 범위: 법령 전문 머리에 관계 절 하나(본문 0 수정) · 버전 대장 2행 · 아카이브 원문 2개 · 이 REQ · claims · dev_log · TICKETS. 커널 3사본·법정·워크플로·정적 린터·`package.json` scripts·`vercel.json` 0. 지시함 표는 별도 PR(TASK-ES-416, 상민님 병합).

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지와 층위

지시 요지: 헌법 커널 v2026.10.05-CELL 이 PR #727(병합 커밋 5330ec2)로 main 에 들어갔다. K4 A 에 따라 (1) 법령 전문에 "실행 정본은 커널, 이 문서는 상세" 관계와 이번 개정 요약·링크를 적고, (2) 버전 대장에 이번 개정 행을 더하며, (3) 커널 첫 배치(커밋 4fc1209, PR #649)가 대장에 빠진 것도 기록한다.

층위:

- 1층(드러난 현상): 법령 전문 머리는 지금도 "이 파일이 아워골 규칙의 유일한 최고 정본"이라 말하고 버전을 v2026.10.02-SHIPYARD 로 적는다. 버전 대장 마지막 행도 v2026.10.02-SHIPYARD(PR 599)다. 세션이 실제로 읽는 커널(v2026.10.05-CELL)은 어디에도 기록돼 있지 않다.
- 2층(구조 부재): 4fc1209 가 커널을 배치하면서 법령 전문·버전 대장을 함께 고치지 않았다 — 버전 대장 4대 원칙 1(아카이브)·2(두 파일 동일)가 그때부터 깨졌다.
- 3층(시스템 괴리): 정본이 둘이라 세션마다 어느 쪽을 따를지 다르게 판단할 수 있다(REQ-TASK-ES-413 4절 M9).

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 헌법 개정의 흔적이 "세션이 읽는 곳"과 "이력을 보는 곳" 양쪽에 남아야 다음 세션이 어느 문서를 따를지 헷갈리지 않는다. 이번 작업의 본질은 두 정본의 관계를 한 문장으로 못 박고, 빠진 이력을 채우는 것이다. 5대 축 귀속: INFRA. 3대 철학 점검: 제품 동작 변화 0 — 무공해성·RPG식 체감·동류 연대에 직접 영향 없음.
- **원인**: 커널 첫 배치(4fc1209)와 세포골격 개정(5330ec2)이 커널 3사본만 고쳤고, 법령 전문·버전 대장 반영은 K4 결심을 기다리느라 미뤄졌다.
- **중심**: 법령 전문 머리의 관계 절 하나와 버전 대장 2행. 법령 전문 본문 글자는 검사 도구(`scripts/verify-integrity-gate.js` 의 제2조·15개 조문·용어 검사, `scripts/smoke-test.js` 의 제10조 검사)가 읽으므로 손대지 않는다.
- **핵심**: (1) 대장 마지막 행 승인 근거 칸에 병합 기록(PR 번호)이 있어야 `node court/appendix.js --check` 가 통과한다. (2) 아카이브 원칙 1 — 머리를 고치기 전 법령 전문 원문, 커널 v2026.10 원문을 `docs/rules/archive/` 에 보존. (3) 삭제 0, 되돌림은 커밋 하나.

### 2-1. 측정한 현재 상태

| 항목 | 값 | 출처 |
| :-- | :-- | :-- |
| 대장 마지막 행 | v2026.10.02-SHIPYARD (PR 599) | `docs/rules/CONSTITUTION_VERSIONS.md` |
| 4fc1209 를 담은 PR | 649 (병합 커밋 7de38c5, 병합자 yangsangmin, 2026-10-04 02:16 KST) | `gh pr view 649 --json mergeCommit,mergedBy,mergedAt` |
| PR 727 병합 | 병합 커밋 5330ec2, 병합자 ourgoaltest, 2026-10-05 12:41 KST, 리뷰 0건 | `gh pr view 727 --json mergeCommit,mergedBy,mergedAt,reviews` |
| 커널 4fc1209 → a9e08ab 변경 | 없음 | `git diff --stat 4fc1209 a9e08ab -- AGENTS.md` 출력 0 |
| 4fc1209 직전 `AGENTS.md` = 법령 전문 | 같음 | `diff` (4fc1209^ 기준) |
| 법령 전문 4fc1209 직전 → origin/main 변경 | 없음 | `git diff --stat 4fc1209^ origin/main -- docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md` 출력 0 |
| 무결성 게이트(기준) | 38/38 | `node scripts/verify-integrity-gate.js` (5330ec2) |
| `court/appendix.js --check` 법령 전문(기준) | ok | 같은 커밋 |

## 3. [원칙 ③] 해결방식

| 파일 | 변경 | 근거 |
| :-- | :-- | :-- |
| `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md` | 머리 "법령 전문" 줄 다음에 절 「커널과 법령 전문의 관계」 3줄 추가(+5줄). 기존 줄 수정 0 | K4 A |
| `docs/rules/CONSTITUTION_VERSIONS.md` | SHIPYARD 행 다음에 `v2026.10-KERNEL-V4`(PR #649) · `v2026.10.05-CELL`(PR #727) 2행 | 4대 원칙 4, 지시 3 |
| `docs/rules/archive/AGENTS_KERNEL_v2026.10.md` | 직전 커널 원문(a9e08ab 의 `AGENTS.md` 와 같은 blob 4729f25) | 4대 원칙 1 |
| `docs/rules/archive/OURGOAL_ABSOLUTE_INTEGRITY_RULES_v2026.10.02_SHIPYARD_MODULAR_ARCHITECTURE.md` | 머리 고치기 전 법령 전문 원문(origin/main 과 바이트 동일) | 4대 원칙 1 |

하지 않은 것: 법령 전문 본문 정합(M1~M12), 머리의 "유일한 최고 정본" 문장 삭제 — 기존 문장은 지우지 않고 새 절에서 "이 관계 안에서 읽는다"로 해석을 정했다(삭제 0). 대장의 기존 행 순서·서식 정리(예: 09.30 행의 앞 칸 깨짐)도 손대지 않았다.

## 4. [원칙 ④] 재검토

- 관계 절이 기존 문장 "유일한 최고 정본"과 부딪히지 않나 → 새 절이 그 문장의 해석을 정하고, 차이는 다음 개정 초안으로 올린다고 명시. 문장을 지우는 것은 본문 수정이자 삭제라 이번 범위 밖.
- 4fc1209 행의 승인자 칸을 "상민님"으로 적어도 되나 → PR #649 의 병합자가 상민님 계정(yangsangmin)이다. 근거 칸은 병합 기록 주소.
- PR #727 은 AI 계정(ourgoaltest)이 병합했고 리뷰가 0건 → 4대 원칙 4 의 "상민님 계정 승인 리뷰 id" 가 없다는 사실을 근거 칸에 그대로 적었다(지어내지 않음). 결심 원문은 참고로만.

## 5. [원칙 ⑤] 절차

1. `git worktree add C:/dev/wt/const-k4-ledger -b docs/2026-10-05-task-es-415-constitution-ledger origin/main`(5330ec2).
2. 기준선 측정(게이트 38/38, appendix ok).
3. 아카이브 2개 → 법령 전문 머리 절(CRLF 유지) → 대장 2행.
4. REQ · `reports/TASK-ES-415/claims.json` · dev_log · TICKETS 각 1줄.
5. `NODE_PATH=C:/dev/ourgoal-app/node_modules npm test` · 게이트 · appendix → 커밋(훅 우회 없음) → PR(초안 아님, 병합하지 않음).

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1 "금고 파일(법령 전문·대장·archive)을 바꾸면 법정이 막는다" → 이번 PR 은 금고 + 중립 문서만 담는다(제품 0). 법정은 금고 변경을 "확인 부족 — 상민님 결심 필요"로 낼 것으로 예상되며, 결심은 이미 있다(K4 A 원문을 PR 본문에 인용). 우회하지 않는다.
- 반론 2 "법령 전문에 글을 더하면 게이트 글자 검사가 깨진다" → 추가 글은 머리에만 있고 검사가 찾는 문자열(제N조 제목·제2조 5항 문구·제10조 4·5항)은 그대로다. 금지 낱말(용어 헌법 대상, `anti_pattern_blacklist`)을 쓰지 않았고 "제16조 (" 형식도 없다. 게이트를 다시 돌려 38/38 을 잰다.
- 절차 재검증: `git diff` 로 법령 전문 변경이 추가 5줄뿐인지, 아카이브가 원본 blob 과 같은지(`git hash-object`), CRLF 가 유지됐는지(node 로 `\r\n` 수 = 줄 수) 확인.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 파일: `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md` · `docs/rules/CONSTITUTION_VERSIONS.md` · `docs/rules/archive/AGENTS_KERNEL_v2026.10.md` · `docs/rules/archive/OURGOAL_ABSOLUTE_INTEGRITY_RULES_v2026.10.02_SHIPYARD_MODULAR_ARCHITECTURE.md` · `docs/specs/REQ-TASK-ES-415-CONSTITUTION-LEDGER.md` · `reports/TASK-ES-415/claims.json` · `dev_log.md` · `docs/rules/TICKETS.md`.
- 문서 식별자: 절 「커널과 법령 전문의 관계」, 대장 행 `v2026.10-KERNEL-V4` · `v2026.10.05-CELL`.
- 검사 함수: `court/appendix.js` 의 `checkLedger`·`lastLedgerRow`(읽기만), `scripts/verify-integrity-gate.js`(읽기만).
- DOM ID·제품 함수: 없음(제품 코드 변경 0).
- 체크리스트: [1단계 REQ] [2단계 PLAN] [3단계 문서] [4단계: 심사 청구]까지만 표기한다.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정

| 측정 | 기대 | 실측 |
| :-- | :-- | :-- |
| 무결성 게이트 | 38/38 | 9절 |
| `node court/appendix.js --check docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md` | ok(마지막 행 PR #727) | 9절 |
| 법령 전문 diff | +5 / -0 | 9절 |
| `npm test` | 종료 코드 0 | 9절 |
| 법정 판정 | 확인 부족 — 금고 변경, 상민님 결심 필요 | PR 의 판정서 |

막히는 지점: 커밋 훅이 금고 변경을 막음 → 멈추고 보고. 본질감시자가 티켓을 못 찾음(TICKET_NOT_FOUND) → TICKETS.md 행을 같은 커밋에 넣는다.

## 9. 측정 기록 (작업자 실측 — 주장일 뿐, 판정은 법정)

| 측정 | 명령 | 결과 |
| :-- | :-- | :-- |
| 무결성 게이트 | `node scripts/verify-integrity-gate.js` | 38개 검사 중 38개 통과 |
| 버전 대장 근거 | `node court/appendix.js --check docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md` | ok, mismatches 0 |
| 법령 전문 변경 | `git diff --stat` | +5 / -0 |
| 아카이브 커널 | `git hash-object` vs `git rev-parse a9e08ab:AGENTS.md` | 4729f25 같음 |
| `npm test` | `NODE_PATH=C:/dev/ourgoal-app/node_modules npm test` | PR 본문에 기록 |

참고(이 PR 범위 밖): `node court/appendix.js --check AGENTS.md` 는 기준 커밋에서도 별표 마커가 없어 불일치를 낸다(커널에는 별표 2·3 마커 구간이 없다). 이 PR 전후 같음.
