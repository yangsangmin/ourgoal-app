# 작업계획서 — TASK-ES-605 양비스 아워골 지휘실 사용 안내서 + 재현 가능한 측정

목표(본질): 비개발자(상민님)가 새 양비스 「아워골 지휘실」의 여섯 단계를 화면만 보고 따라갈 수 있는 한국어 안내서를, 실제 화면 코드·준비 관측과 글자 단위로 대조한 측정 기록과 함께 남긴다. 제품·지도·공통 원문·시험·금고·Git 설정은 바꾸지 않는다.

- 작업참고 기준: PR #871 (c8b8ddfb) · 경험칙 55개 · 로컬 정본 C:/dev/agent-knowledge/WORK-REFERENCE.md 끝까지 읽음
- 지시함(origin/main `docs/directives/ACTIVE.md`): 열린 지시 0 — 이 작업에 해당하는 지시 없음(명령은 request.json 의 원 지시)
- 입력 기준 커밋: c8b8ddfb666a39bbae75b50da7f3b290e0701869 (HEAD = origin/main, 측정 스크립트가 git rev-parse 로 다시 잰다)
- 세션: Claude c8611dd5 · 작업 트리 C:/dev/wt/yangvis-ourgoal-guide-01a11bfe · 브랜치 codex/task-es-605-yangvis-operator-guide
- 쓰기 범위: request.json `allowedWrites` 7개뿐. inputs 는 읽기만. 생산 양비스 폴더는 읽기만.
- 세포 구조: 이 작업은 아워골 앱 세포(modules.json 351개)를 하나도 고치지 않는다. 대상은 저장소 밖 커맨드센터 화면(app.js·index.html)이며 읽기만 한다.

## 5단 추론 요약 (이해 · 분류 · 예측 · 반론 · 선택)

| 단계 | 내용 |
| :-- | :-- |
| 이해 | 무엇: 여섯 단계(지시하기 · 도구/모델/노력 선택 · 진행과 다음 행동 읽기 · 보류/중단/재개/지시 변경 · 지도와 근거 확인 · 법정과 완료 확인) 사용 안내서 + 그 안내서가 실제 화면 코드와 맞는지를 재는 코드. 왜: 상민님이 코드 없이 말로 지휘하려면 화면을 읽는 법이 먼저다. 완료는 무엇으로: measurement.json 의 단계별 누락 배열이 모두 비고, 소스 SHA 가 입력 3종과 같고, 추적 파일 전수 SHA 불일치 0 |
| 분류 | **(다) 탐색 · 새 유형** — 작업참고에는 "제품 밖 화면의 비개발자용 운영 안내서 + 문구 단위 대조 측정" 유형이 없다. 빌려 온 표준: 문서·보고 전용 PR 의 config 주장(L051, #602·#603), REQ 8원칙 서식 선검사(L052), 원시 실패 보존·중첩 실행 구분(L055), 전체 수치 주장 금지(L002), 도구 한계 사유 남용 금지(L006). 안 맞는 점: 대상이 아워골 제품이 아니라 저장소 밖 양비스 화면이라 게스트 시나리오·법정 화면 시험이 없다 → 소스/부품 측정(vm 로드·문자열 대조)을 스스로 설계한다. 승인선 다섯 가지에 닿는 항목 없음(돈 X · 개인정보 X · 삭제 X · 바깥 전송 X · 규범 X) |
| 예측 | ① 생산 폴더 읽기나 자식 git 이 차단될 수 있다(L055) → 원시 실패 보존 + 입력 발췌 snapshot 모드 ② 준비 담당의 Git config 해시 산출 방법을 모른다 → 후보 방법별 해시만 기록, 일치 없으면 null ③ mustExplain 문구가 안내서에서 빠질 수 있다 → 측정 후 안내서 보강(측정 코드는 안 고침) ④ REQ 린터가 원칙 ② 네 낱말·⑥ 재검증을 요구 → 헤더 표준 고정 |
| 반론 | 반론1 "안내서는 글이니 측정이 필요 없다" → 글이 화면과 어긋나면 상민님이 없는 단추를 찾는다. 단계별 라벨·selector·함수·필수 사실을 개별 대조해 누락 배열로 남겨야 "맞다"를 말할 수 있다. 반론2 "실제로 단추를 눌러 E2E 로 재야 진짜다" → 제어 단추 실제 클릭은 운영 작업 상태를 바꾸는 바깥 행위라 이 작업에서 금지됐다. 대신 화면 코드의 제어 규칙(controlAllowed)을 Node 로 안전하게 불러 상태 행렬을 재고, 준비 담당의 DOM 관측과 일치하는지 대조한다. 그것이 "소스/부품 측정"이며 E2E 가 아님을 기록에 명시한다 |
| 선택 | 계획서 → 안내서 → REQ → measure-guide.cjs → 전경 실행(raw stdout 보존) → measurement.json 조립 → claims.json(R1·R2·R3) → 문서 형식 검사 전경 실행 → 보고 후 종료. 커밋·push·PR·법정·병합·sync 는 root 별도 후속 |

## 체크리스트 (심사 청구까지만 — 커밋·PR·법정·병합·sync 는 root 별도 후속)

- [x] 1. 작업참고 · AGENTS.md · 지시함 · MODULE-BLUEPRINT.md · modules.json · 입력 6종 정독 · 예상 20분 · 완료 기준: measurement.json `guidelines`·`inputs` 에 기준 PR 번호와 입력 SHA-256 이 기록됨 — 측정: `guidelines.workReferenceLocal.basis.pr = 871`, 입력 6종 `exists = true`
- [x] 2. 작업계획서 · 5단 요약 · 유형 분류 근거 기록 · 예상 10분 · 완료 기준: 이 파일과 REQ 에 이해·분류·예측·반론·선택 다섯 칸과 분류 근거가 있음(measure 의 `req.has5Stage = true`, `req.typeClassification` 이 비어 있지 않음) — 측정: `req.has5Stage = true` · `plan.has5Stage = true` · `req.typeClassification` 기록됨
- [x] 3. 안내서 집필(여섯 단계 · mustExplain 전부(건수는 `summary.mustExplainTotal`) · 상태 사전 · 한계 · 근거표) · 예상 90분 · 완료 기준: measure 의 `stages[*].missing` 네 배열이 모두 빈 배열, `guide.identifiersOutsideEvidenceTable = 0`, `guide.bodyFencedCodeBlocks = 0`, `guide.commandLikeLines = []` — 측정: `summary.stagesWithMissing = []` · 세 guide 칸 모두 0/빈 배열
- [x] 4. REQ 작성(독립 8원칙 · ② 본질/원인/중심/핵심 · ⑥ 재검증 · 강한 반론 2개 · 구체 식별자) · 예상 30분 · 완료 기준: measure 의 `req.lint8.issues = []` 이고 `node scripts/verify-integrity-gate.js` 의 REQ 린트 항목이 PASS — 측정: `req.lint8.issues = []`, 게이트 출력 「신규 및 변경 대상 REQ/PLAN 문서의 8원칙 기계적 무결성(린터)이 100% 통과한다」 PASS
- [x] 5. 측정 설계 · measure-guide.cjs 작성 · 전경 실행 · 예상 60분 · 완료 기준: `raw/measure.stdout.json` 존재, `exitCode = 0`, `productionSources.appJs/indexHtml/stylesCss` SHA 가 입력 3종과 일치(또는 차단 시 원시 실패 보존 + snapshot 모드), `componentProbe.loaded = true`, 네 제어 label·selector·배선 항목 전부 `present = true` — 측정: `mode = live-source`, `exitCode = 0`, `summary.productionSourcesMatchAllInputs = true`, `componentProbe.loaded = true`, `summary.controlsWiringAllPresent = true`, `summary.domObservationConsistent = true`
- [x] 6. measurement.json 조립 · 예상 10분 · 완료 기준: `command`·`cwd`·`measuredAt`·`sourceCommit`·`exitCode`·`raw.stdout.sha256`·입력/소스/산출 SHA·6단계/4제어 비교·`limitations` 칸이 있고 stdout 의 SHA 는 stdout 바깥(measurement.json)에만 있음 — 측정: `--assemble` 전경 실행, `command = [node, reports/TASK-ES-605/measure-guide.cjs]`, `raw.stdout.sha256` 기록, stdout 안에는 자기 SHA 없음
- [x] 7. claims.json(R1 문서 여섯 단계 · R2 소스/측정 기록 · R3 보존/한계) · 예상 20분 · 완료 기준: `court/claims.js` 의 validateClaims 오류 0, 모든 `check.file` 이 TASK-ES-605 산출물만 가리킴 — 측정: validateClaims 오류 0, static 검사 로컬 되돌림 notOk 0, 산출물 밖 touches 0(로컬 예비 점검이며 판정 아님)
- [x] 8. 보존 전수 대조 · 예상 5분 · 완료 기준: `preservation.tracked.mismatchedCount = 0` · `missingCount = 0`, Git config 후보 해시 기록(일치 없으면 `matched = null` 로 미확인 표기) — 측정: `mismatchedCount = 0` · `missingCount = 0` · `gitVsInput` 양방향 차이 0 · `gitConfig.matched = null`(산출 방법 미상, 미확인) · `nonAllowlistedChanges = []`
- [x] 9. 문서 형식 검사 전경 실행 · 예상 10분 · 완료 기준: `node scripts/verify-integrity-gate.js` 종료코드 0(실패 시 원인과 출력 보존, 금고·시험 불변) — 측정: 종료코드 0, 출력 「총 38개 검사 중 38개 통과 (0개 실패)」(게이트 스크립트 산출, 금고·시험 변경 0)
- [x] 10. 보고(한 것 / 측정으로 검증한 것 / 미검증 / 다음에 열리는 것) 후 headless 종료 · 예상 5분 — 측정: 이 세션의 마지막 메시지가 보고(측정 재조립 뒤 작성). root 후속 항목은 아래에 미완으로 남김
- [ ] (root 별도 후속 — 이 세션 범위 밖, 이 세션은 완료 표시하지 않음) 커밋 · push · PR · 법정 판정 · 병합 · task-link sync · 세포지도 · 경험칙(lessons.json 새 유형 등록) 갱신

## 막힐 지점 예상 (8원칙 ⑧)

- 생산 폴더 읽기 차단 → 원시 실패(code·message)를 보존하고 `.yangvis-inputs/ui-source-excerpts.json` 발췌로 frozen snapshot 모드 측정, `mode` 칸에 표기.
- 자식 git 차단(L055) → `preservation-before.json` 의 tracked 목록 5139건으로 전수 SHA 대조, git 결과는 null 과 원시 실패로 보존.
- Git config 해시 산출 방법 미상 → 후보 방법(공용 config 파일 바이트 · config --list 등) 해시만 기록, 원문·신원·토큰 출력 0.
- mustExplain 문구 누락 → 안내서 보강 후 재측정. 측정 코드의 기대 문구는 안내서가 아니라 화면 소스에서 확인되는 문구로 고정.
- 문서 린터(원칙 ② 네 낱말 · ⑥ 재검증 · 번호 합체 금지) → REQ 헤더를 `## N. [원칙 X]` 로 고정하고 ② 절 안에 `#` 글자를 쓰지 않는다(린터의 절 추출이 `#` 에서 끊긴다).
- 이 작업은 제품 변경 0 이라 fullUI·npm test 를 반복하지 않는다(브리프). 필요한 것은 문서 형식 검사와 자기 measure 명령의 전경 실행뿐.
