# REQ/PLAN — TASK-ES-416 지시함 표의 헌법 칸을 커널 실행 정본으로 [상민님 병합]

> 상민님 결심 원문(2026-10-05, PR #727 댓글에 기록): "법정 안건 4건 모두 권장안으로 승인" — K4 A: 커널(`AGENTS.md`/`CLAUDE.md`/`01_OURGOAL_SUPREME_CONSTITUTION_FULL.md`)은 세션이 읽는 실행 정본, 법령 전문(`docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md`)은 상세. "지시함 표의 '헌법' 칸에 두 파일을 함께 적는 PR(상민님 병합)" (REQ-TASK-ES-413 결심 표 K4 A).
>
> 범위: `docs/directives/ACTIVE.md` 표 한 줄 · 이 REQ · claims · dev_log · TICKETS. 지시함은 상민님이 병합한다 — 이 PR 은 열기만 한다.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지와 층위

- 지시 요지: 지시함 「다른 문서와의 관계」 표의 **헌법** 행이 `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md`(법령 전문) 하나만 지목한다. K4 A 에 따라 커널 세 사본을 실행 정본으로, 법령 전문을 상세로 함께 적는다.
- 1층(현상): 모든 AI 도구가 첫 턴에 읽는 지시함이 세션이 실제로 따르는 커널을 가리키지 않는다.
- 2층(구조): 커널 v2026.10.05-CELL 의 `document_hierarchy` 는 "헌법 > 지시함 > AI 서류"를 정하지만, 지시함 표의 헌법 칸은 커널 배치(4fc1209) 이전 그대로다.
- 3층(괴리): 정본이 둘로 읽혀 세션마다 다른 문서를 헌법으로 삼을 수 있다(REQ-TASK-ES-413 4절 M9).

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 지시함은 "헷갈릴 때 이 표만 보면 된다"는 문서다. 그 표가 실행 정본을 가리켜야 새 세션이 헌법을 잘못 고르지 않는다. 5대 축 귀속: INFRA. 3대 철학 점검: 제품 동작 변화 0.
- **원인**: 지시함은 상민님 병합 전용이라 커널 개정 PR(#727)이 함께 고치지 않았다.
- **중심**: 표의 헌법 행 한 줄. 다른 행·지시·완료 기록은 그대로.
- **핵심**: 지시함은 상민님 계정이 병합한다(CODEOWNERS `/docs/directives/`). 작업 세션은 병합하지 않는다. 삭제 0, 되돌림은 커밋 하나.

## 3. [원칙 ③] 해결방식

| 위치 | 현행 | 바꿈 |
| :-- | :-- | :-- |
| `docs/directives/ACTIVE.md` 「다른 문서와의 관계」 표, 헌법 행 1칸 | `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md` | 실행 정본: 커널 세 사본 · 상세: 법령 전문 · 이력: 버전 대장 |
| 같은 행 2칸 | 일하는 법 | + 세션은 커널을 읽고 따르며, 둘이 다르면 커널을 따른다(K4 A, PR #727) |

## 4. [원칙 ④] 재검토

- 법령 전문 쪽 기록(관계 절·버전 대장)은 TASK-ES-415 PR 이 따로 한다. 이 PR 만 먼저 병합돼도 지시함 문장은 이미 병합된 커널(#727)과 결심에 기대므로 사실과 어긋나지 않는다.
- 우선순위 문장("헌법 > 지시함 > AI 서류")·헌법 개정 절차 문장은 그대로 맞으므로 고치지 않는다.

## 5. [원칙 ⑤] 절차

1. `git worktree add C:/dev/wt/const-k4-directive -b docs/2026-10-05-task-es-416-directive-constitution-row origin/main`.
2. 표 한 줄 교체(CRLF 유지).
3. REQ · `reports/TASK-ES-416/claims.json` · dev_log · TICKETS.
4. `NODE_PATH=C:/dev/ourgoal-app/node_modules npm test` · 무결성 게이트 → 커밋(훅 우회 없음) → PR 제목에 [상민님 병합], 병합하지 않음.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1 "지시함은 AI 가 쓰면 안 된다" → 지시함 규칙은 "상민님이 승인해 병합한 내용만 효력"이다. AI 는 PR 을 열 수 있고 효력은 상민님 병합 때 생긴다. 이 변경은 상민님 결심 K4 A 가 명시한 PR 이다.
- 반론 2 "법정이 지시함 변경을 제품으로 볼 수 있다" → `court/vault.json` neutral 에 `docs/**` 가 있어 중립 문서다. 그래도 주장 파일을 붙여 심사를 청구한다.
- 절차 재검증: `git diff` 가 표 한 줄(+1/-1)뿐인지, 줄 끝 CRLF 수 = 줄 수인지 확인.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 파일: `docs/directives/ACTIVE.md` · `docs/specs/REQ-TASK-ES-416-DIRECTIVE-CONSTITUTION-ROW.md` · `reports/TASK-ES-416/claims.json` · `dev_log.md` · `docs/rules/TICKETS.md`.
- 문서 식별자: 지시함 절 「다른 문서와의 관계 (헷갈릴 때 — 이 표만 보면 된다)」의 헌법 행.
- DOM ID·함수: 없음(제품 코드 변경 0).
- 체크리스트: [4단계: 심사 청구]까지만 표기한다. 병합은 상민님.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정

| 측정 | 기대 | 실측(작업자 주장) |
| :-- | :-- | :-- |
| `git diff --stat docs/directives/ACTIVE.md` | +1 / -1 | +1 / -1 |
| 무결성 게이트 | 38/38 | PR 본문 |
| `npm test` | 종료 코드 0 | PR 본문 |
| 법정 판정 | 판정서 | PR 의 판정서 |

막히는 지점: 본질감시자 TICKET_NOT_FOUND → TICKETS.md 행을 같은 커밋에 넣는다. 다른 세션이 같은 표를 고치는 PR 을 먼저 냄 → 병합 충돌은 상민님 병합 전에 이 브랜치에서 해소.
