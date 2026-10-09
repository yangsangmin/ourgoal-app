# REQ — #TASK-ES-605 양비스 아워골 지휘실 사용 안내서(비개발자용) + 재현 가능한 측정 코드

> **문서 ID**: REQ-TASK-ES-605-YANGVIS-GUIDE
> **티켓 연계**: #TASK-ES-605 (상위 작업 TASK-YANGVIS-OURGOAL-REBUILD-01a11bfe)
> **작성 일시**: 2026-10-09
> **작성자**: Claude native worker 세션 c8611dd5 (작업 트리 `C:/dev/wt/yangvis-ourgoal-guide-01a11bfe`, 브랜치 `codex/task-es-605-yangvis-operator-guide`, 입력 기준 커밋 `c8b8ddfb666a39bbae75b50da7f3b290e0701869`)
> **작업참고 기준**: PR #871 (c8b8ddfb) · 경험칙 55개 · 유형 분류 **(다) 탐색 · 새 유형**(아래 「유형 분류 근거」)
> **지시함**: origin/main `docs/directives/ACTIVE.md` 열린 지시 0 — 이 작업에 해당하는 지시 없음. 명령은 `.yangvis-inputs/request.json` 의 원 지시.
> **원시 측정**: `reports/TASK-ES-605/measurement.json` (스크립트 `reports/TASK-ES-605/measure-guide.cjs` 산출, 작업자 측정이며 판정 아님. 이 문서의 수치는 그 파일의 칸 이름으로 가리키고 손으로 옮겨 적지 않는다)

- 지시 원문: "새 양비스를 비개발자가 직접 쓰는 아워골 지휘 안내서를 만들어줘. 지시하기, 도구·모델·노력 선택, 진행과 다음 행동 읽기, 보류·중단·재개, 지도와 근거 확인, 법정 확인까지 실제 화면과 관측 근거에 맞춰 쉽게 설명하고 재현 가능한 측정 기록을 남겨줘. 기존 기능·지도·제품은 바꾸지 마."
- 범위(허용 쓰기, request.json `allowedWrites`): `docs/agents/YANGVIS-OURGOAL-OPERATOR-GUIDE.md` · 이 REQ · `reports/TASK-ES-605/measure-guide.cjs` · `reports/TASK-ES-605/measurement.json` · `reports/TASK-ES-605/claims.json` · `reports/TASK-ES-605/raw/measure.stdout.json` · `.claude/plan-TASK-ES-605.md`. **제품(index.html·js·css)·지도·설명·modules·scripts·tests·court·금고·헌법·지시함·Git 설정·생산 양비스 변경 0.**
- 바깥(이 세션 밖, root 별도 후속): 커밋 · push · PR · 법정 판정 · 병합 · task-link sync · 세포지도 · 경험칙(lessons.json 에 새 유형 등록) 갱신 · Telegram · 외부 전송 · 추가 모델 호출.

## 요구사항 식별자

- **R1**: 여섯 단계(지시하기 · 도구/모델/노력 선택 · 진행과 다음 행동 읽기 · 보류/중단/재개/지시 변경 · 지도와 근거 확인 · 법정과 완료 확인)의 화면 위치·행동·확인 방법을 비개발자가 한국어로 따라갈 수 있는 안내서를 쓰고, request.json `stages[*].mustExplain` 항목을 하나도 빠짐없이 담는다(건수는 손으로 적지 않고 `measurement.json` → `summary.mustExplainTotal` 이 센다). 명령·JSON 편집·토큰 붙여넣기를 상민님께 넘기지 않고, 식별자는 안내서 끝 근거표에만 둔다.
- **R2**: 실제 화면 소스(app.js · index.html)의 네 제어(pause · stop · resume · change) selector · label · 상태 제약 · 이벤트/피드백 배선과 여섯 단계 식별자를 대조하는 재현 가능한 측정 코드(node 내장 모듈만)를 쓰고, 명령 · cwd · measuredAt · sourceCommit · exitCode · 원시 stdout · 입력/소스/산출 SHA 를 기록에 남긴다.
- **R3**: 제품 · 지도 · 공통 원문 · 시험 · 금고 · Git 설정을 보존하고(추적 파일 SHA 전수 대조), 검사하지 않은 것(실제 제어 단추 E2E · 실계정 · Telegram 왕복 · Windows 전체 재부팅 · Claude artifact 되읽기 · 장기 효과 · Court 판정 · 준비 당시 native 605 산출물)은 미검증/null 로 남긴다.

## 5단 추론 요약 (이해 · 분류 · 예측 · 반론 · 선택)

| 단계 | 내용 |
| :-- | :-- |
| 이해 | 무엇: 상민님이 코드 없이 양비스 화면만 보고 아워골을 지휘하도록 여섯 단계 안내서를 쓰고, 그 안내서가 실제 화면 코드·준비 관측과 맞는지를 재는 코드와 기록을 남긴다. 왜: "말로 지휘"의 전제는 화면을 읽는 법이다. 완료를 무엇으로 재나: `measurement.json` 의 `stages[*].missing` 네 배열이 모두 빈 배열, `productionSources.*` SHA 가 입력 3종(`ui-source-excerpts` · `public-observation` · `preservation-before`)과 일치, `preservation.tracked.mismatchedCount = 0` |
| 분류 | **(다) 탐색 · 새 유형** — 아래 「유형 분류 근거」 |
| 예측 | 생산 폴더 읽기·자식 git 차단(L055) → 원시 실패 보존 + snapshot 모드 · Git config 해시 산출 방법 미상 → 후보별 해시만 · mustExplain 문구 누락 → 안내서 보강 후 재측정 · REQ 린터(② 네 낱말 · ⑥ 재검증) → 헤더 표준 고정 |
| 반론 | 반론1 "안내서는 글이라 측정이 필요 없다" → 글이 화면과 어긋나면 없는 단추를 찾게 된다. 라벨·selector·함수·필수 사실을 단계마다 개별 대조해 누락 배열로 남겨야 "맞다"를 말할 수 있다. 반론2 "실제 단추를 눌러 E2E 로 재야 진짜다" → 제어 단추 실제 클릭은 운영 작업의 상태를 바꾸는 바깥 행위라 금지됐다(브리프). 대신 화면 코드의 제어 규칙(`controlAllowed`)을 Node vm 으로 격리 로드해 상태 행렬을 재고 준비 담당의 DOM 관측과 대조한다. 이것이 소스/부품 측정이지 E2E 가 아님을 기록·주장에 명시한다 |
| 선택 | 계획서 → 안내서 → 이 REQ → `measure-guide.cjs` → 전경 실행(stdout 원문 보존) → `measurement.json` 조립(stdout SHA 는 stdout 바깥) → `claims.json`(R1 · R2 · R3) → 문서 형식 검사 전경 실행 → 보고 후 종료 |

### 유형 분류 근거 (SNOWBALL 제2항)

- 작업참고(PR #871, 경험칙 55개)에 "저장소 밖 운영 화면(양비스 커맨드센터)의 비개발자용 사용 안내서 + 문구 단위 대조 측정" 유형은 없다. 가장 가까운 유형 셋을 빌린다: ① 문서·보고 전용 PR 의 `config` 분야 주장(L051, #602 · #603) ② REQ 8원칙 서식을 무결성 게이트로 먼저 검사(L052) ③ 중첩 실행의 권한 오류와 제품 실패 구분 · 원시 실패 보존(L055).
- 안 맞는 점: 대상이 아워골 제품이 아니라 저장소 밖 화면이라 게스트 시나리오·법정 화면 시험(L001)이 없다. 그래서 검증을 스스로 설계했다 — 소스 SHA 대조 · 발췌 일치 · vm 격리 로드로 제어 규칙 행렬 측정 · 준비 DOM 관측과 대조 · 단계별 라벨/selector/함수/필수 사실 개별 대조 · 추적 파일 전수 SHA 대조. 검증 강도는 문서 PR 선례(#602 · #603)보다 낮지 않다(선례는 설명 파일 값 대조, 이 작업은 그 위에 소스 대조와 부품 실행을 더했다).
- 불변층 적용: 승인선 다섯 가지에 닿는 항목 없음(돈 · 개인정보 · 삭제 · 바깥 전송 · 규범 변경 모두 없음) · 판정 분리(이 문서와 measurement 는 주장) · 상태는 측정(수치는 스크립트 산출만) · 데이터 무손실(쓰기 7개 파일 뿐) · 금고 수정 0.
- 끝난 뒤: 병합한 세션이 이 유형("운영 화면 사용 안내서 + 문구 대조 측정")을 lessons.json 에 올린다(이 세션 범위 밖).

## 1. [원칙 ①] 문제 정확히 파악

- 새 양비스 「아워골 지휘실」은 화면이 바뀌었고(왼쪽 메뉴 5개 · 지시창 · 작업 상세 창 4탭 · 제어 단추 4개), 상민님이 이 화면만 보고 아워골을 지휘할 안내서가 없다. 기존 안내는 개발자용 문서(헌법 · 작업참고)뿐이다.
- 화면의 상태 낱말이 많다(`STATUS` 19개 · 사건 이름 20여 개 · 제어 이유 문구 5개 · 설정 지원 상태 3개). 뜻을 모르면 "실행 종료"를 "작업 완료"로, "지원 확인"을 "실행 성공"으로, "요청 노력 high"를 "실제 노력 high"로 잘못 읽는다.
- 준비 담당의 관측(`public-observation.json`, 2026-10-09T09:33:00.707Z)에서 작업 3개는 모두 `verification-pending` · `progress: null` · `eta: null` 이고, 한 작업은 `actual.effort: null`, 다른 작업은 `actual.model: null` · `actual.effort: null` 이다. 이 null 을 요청값으로 채워 읽는 것이 가장 흔한 오독이다.
- 네 제어 단추의 활성 규칙은 코드(`controlAllowed`)에만 있고 사람 말로 적힌 곳이 없다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질 축**: INFRA(문서 · 측정). 제품 동작 변경 없음.
- **[본질]**: 안내서는 "어디를 누르고, 무엇을 읽고, 어떤 확인을 기다리는가"를 화면의 실제 문구로 말해야 한다. 글이 화면과 다르면 안내서가 아니라 추측이다. 그래서 안내서와 측정 코드는 한 묶음이다.
- **[원인]**: ① 새 화면은 "요청 · 전달 · 실제 확인"을 칸으로 나누는데 옛 화면 습관은 하나로 읽는다 ② 상태 낱말이 19개 + 사건 이름 20여 개라 사전 없이는 구분할 수 없다 ③ 제어 규칙이 코드에만 있어 "왜 단추가 꺼졌는가"를 설명하는 글이 없다.
- **[중심]**: 단계별 필수 사실(request.json `mustExplain` 전부 — 건수는 `summary.mustExplainTotal`)을 화면 문구와 연결해 적고, 측정 코드가 그 항목 하나하나와 라벨 · selector · 함수를 단계마다 **개별** 대조해 누락 배열을 남기는 것. 문자열 전체 포함 하나로 여섯 단계를 뭉뚱그려 단언하지 않는다.
- **[핵심]**: 무너지지 않아야 할 것 — ① 제품 · 지도 · 공통 원문 · 시험 · 금고 · Git 설정 변경 0(추적 파일 SHA 전수 대조) ② null 을 요청값 · 추측으로 채우지 않음 ③ 소스/부품 측정을 실제 제어 단추 E2E · 실계정 · Court 판정으로 과장하지 않음 ④ 인증값 · 헤더 · 토큰 · Git 설정 원문 · 신원을 출력 · 저장하지 않음.
- 체감 가설: 상민님이 「아워골 지휘」 첫 화면에서 안내서 3단계를 옆에 두고 읽으면, 큰 상자의 「담당 · 막힌 이유 · 다음 행동 · 관측 시각」만으로 지금 무엇을 결정해야 하는지 알 수 있고, 「미확인」을 보고 불안해하지 않는다.
- 기존 전체 기능 영향도: 아워골 앱(계정 · 홈 · 기록 · 통계 · 캘린더) 영향 0 — 이 작업은 아워골 저장소의 제품 파일을 한 글자도 바꾸지 않는다. 양비스 생산 화면도 읽기만 한다.

## 3. [원칙 ③] 해결방식

- **하지 말아야 할 것**: 제품 · 지도 · modules · scripts · tests · court · 금고 · 헌법 · 지시함 · `.claude/settings.json` · Git 설정 · 생산 양비스 수정. 입력 폴더 수정. 실제 제어 단추 클릭(운영 작업 상태 변경). 추가 API 과금 · 구매 · extra usage 설정 변경. 인증값 출력. `configured` 를 화면에 없는 세 번째 칸처럼 꾸미기. 미검증 항목을 검증으로 적기. 명령 · JSON 편집 · 토큰 붙여넣기를 상민님께 넘기기.
- **해야 할 것**:
  1. 안내서 `docs/agents/YANGVIS-OURGOAL-OPERATOR-GUIDE.md` — 0절 화면 한눈에 → 1~6단계(어디를 누르나 / 무엇을 읽나 / 어떤 확인을 기다리나 / 꼭 알아둘 것) → 7절 상태 배지 사전(19개) → 8절 한계 · 미검증 → 9절 근거표(식별자는 여기만).
  2. 측정 코드 `reports/TASK-ES-605/measure-guide.cjs` — node 내장 모듈만(`fs` · `path` · `crypto` · `vm` · `child_process`). 생산 `app.js` · `index.html` · `styles.css` 를 읽기 전용으로 읽어 SHA-256 을 입력 3종과 대조, 발췌(`ui-source-excerpts.json`)의 줄 범위가 실제 파일과 같은지 확인, `app.js` 의 Node export(`controlAllowed` · `statusInfo` · `modelsFor` · `effortsFor`)를 vm 격리 컨텍스트(`document` 없음, 네트워크 없음)로 불러 상태 19개 × 실행 상태 3종 행렬과 완료 · readOnly · 개정 null · 보관 모드 제약을 측정, 네 제어의 selector · label · `data-control` 렌더 · 클릭 분기 · `#control-feedback` · `#change-box` · 토스트 · 요청 알림 · 이유 문구 5개 존재를 확인, 준비 DOM 관측의 네 단추 비활성 상태를 `controlAllowed` 결과와 대조(관측 시각 · 소스 SHA 와 묶음), 여섯 단계의 selector · 함수 정의 · 라벨 · 필수 사실 문구를 안내서와 개별 비교해 `missing` 배열을 남김, 추적 파일 전수 SHA 와 Git config 해시 후보를 `preservation-before.json` 과 대조.
  3. 전경 실행 `node reports/TASK-ES-605/measure-guide.cjs --assemble` — 측정 명령(`node reports/TASK-ES-605/measure-guide.cjs`)을 자식 프로세스로 전경 실행해 stdout 원문을 `raw/measure.stdout.json` 에 보존하고 `measurement.json` 에 command · cwd · measuredAt · sourceCommit · exitCode · raw SHA · 입력/소스/산출 SHA · 6단계/4제어 비교 · 미검증을 적는다. stdout 의 SHA 는 stdout 바깥(measurement.json)에만 둔다. `measurement.json` · `claims.json` 자기 SHA 는 자기 내용에 넣지 않는다(후속 manifest 범위는 커밋 트리 · PR diff).
  4. `claims.json` — 법정 `static` 주장(`jsonPath` · `fileExists` · `codeContains`, `config` 분야)만. R1(문서 여섯 단계) · R2(소스/측정 기록) · R3(보존/한계)에 각 주장을 연결하고 TASK-ES-605 산출물만 가리킨다.
- **왜 이 방식이어야 하나**: 실제 단추 클릭은 운영 상태를 바꾸므로 금지됐고, 법정 화면 시험은 저장소 밖 화면에 닿지 않는다. 남는 가장 강한 증명은 "소스 글자 · 부품 실행 · 준비 관측 · 안내서 문구"의 네 겹 대조이며, 그 한계(E2E 아님)를 함께 적는 것이다.

### 3-1. 스토리지 원장화 3대 명세 — 해당 없음
- 1호 원격 DB 스키마: 변경 없음(이 작업은 DB 를 만지지 않는다). 2호 스마트 스토리지 분기: 해당 없음. 3호 4대 뷰 전파: 해당 없음(아워골 화면 렌더러 호출 0).

### 3-2. 전수 인터랙션 명세표 — 이 작업이 새로 만드는 UI 요소 없음
| UI 요소 | 위치/화면 | 사용자 액션 | 기대 동작 | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| (없음) | — | — | — | 안내서는 기존 양비스 화면 요소를 설명만 한다. 설명 대상 요소의 식별자는 안내서 9절 근거표와 이 문서 7절 「구체 식별자」에 있다 |

### 3-3. 유저 데이터 100% 무손실 보존 규격
- 아바타 · 목표 · 기록 · 화면 세팅값: 이 작업은 아워골 제품 코드 · 데이터 경로를 건드리지 않으므로 영향 0. 보존 증명은 `measurement.json` → `preservation.tracked`(추적 파일 전수 SHA 대조, 불일치 · 누락 수).

## 4. [원칙 ④] 재검토 — 한계와 반례

- 소스/부품 측정은 "화면 코드가 그렇게 적혀 있고, 그 규칙 함수가 그렇게 계산한다"까지다. 서버(양비스 본체)가 요청을 어떻게 처리하는지, 실제 단추를 눌렀을 때 작업 상태가 어떻게 바뀌는지는 재지 않았다 → 안내서 8절과 `limitations.realControlButtonE2E = null` 로 적는다.
- 준비 담당의 DOM 관측은 이 세션의 재측정이 아니다 → 관측 시각 · 소스 SHA 와 묶어 "준비 관측"으로만 쓴다.
- Git config 해시는 준비 담당의 산출 방법을 모른다 → 후보 방법별 해시만 기록하고 일치가 없으면 `matched: null`(미확인). 원문은 출력하지 않는다.
- 반례 1(필수 사실을 뭉뚱그려 확인): 안내서 전체에 어떤 낱말이 한 번 있다고 필수 사실 전부를 설명했다고 볼 수 없다 → 항목마다 요구 문구 묶음을 두고 전부 있어야 `present` 로 센다. 요구 문구는 화면 소스에서 확인되는 문구 또는 그 항목의 핵심 문장이다.
- 반례 2(선택자 글자 확인의 착시): `[data-route="overview"]` 는 소스에 글자 그대로 없고 `data-route="${id}"` 템플릿 + `'overview'` 값으로 만들어진다 → 선택자 확인은 글자 그대로 · 템플릿+값 · `'#id'` 참조 세 길 중 하나로 해석 가능한지를 기록한다.
- 반례 3(수치 베끼기): 안내서 · REQ 에 추적 파일 건수 같은 수를 손으로 옮기면 main 이 움직이거나 재측정하면 거짓이 된다 → 수는 `measurement.json` 칸을 가리키고, 주장(claims)은 main 과 무관한 값(불일치 0 · 누락 배열 빈 값 · 고정 라벨)만 건다.

## 5. [원칙 ⑤] 절차

1. 작업참고(로컬 정본 끝까지) · AGENTS.md · 지시함(origin/main) · MODULE-BLUEPRINT.md · modules.json · 입력 6종(`request.json` · `prompt.md` · `ui-source-excerpts.json` · `public-observation.json` · `transport-support.json` · `preservation-before.json`) 정독. 생산 `app.js` · `index.html` 전문 읽기(읽기만).
2. `.claude/plan-TASK-ES-605.md`(목표 · 5단 요약 · 유형 분류 · 체크리스트 · 막힐 지점) 작성.
3. 안내서 집필(여섯 단계 · mustExplain 전부 · 상태 사전 · 한계 · 근거표).
4. 이 REQ 작성.
5. `measure-guide.cjs` 작성 → `node reports/TASK-ES-605/measure-guide.cjs --assemble` 전경 실행 → `raw/measure.stdout.json` · `measurement.json` 생성 → `stages[*].missing` 이 비지 않으면 안내서를 보강하고 재실행(측정 코드 기대값은 소스 문구로 고정, 안내서 쪽을 고친다).
6. `claims.json` 작성 → `court/claims.js` 의 `validateClaims` 로 형식 검사(로컬 예비 점검, 판정 아님).
7. `node scripts/verify-integrity-gate.js` 전경 실행(REQ 8원칙 린트 포함) — 제품 변경 0 이므로 fullUI · npm test 반복은 하지 않는다(브리프).
8. 보고(한 것 / 측정으로 검증한 것 / 미검증 / 다음에 열리는 것) 후 headless 종료. 커밋 · push · PR · 법정 · 병합 · sync 는 root 별도 후속.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- **재검증(단일 실패점)**: ① 생산 폴더 읽기가 막히면 전체가 멈추는가 → 아니다. `ui-source-excerpts.json` 발췌로 frozen snapshot 모드 측정을 하고 `mode` 와 원시 실패를 기록한다. ② 자식 git 이 막히면 보존 대조가 멈추는가 → 아니다. `preservation-before.json` 의 tracked 목록으로 전수 SHA 대조를 하고 git 결과는 null · 원시 실패로 남긴다. ③ 안내서를 고치면 측정이 낡는가 → 그래서 측정 실행은 안내서 · REQ 가 끝난 뒤 마지막에 하고, 조립 뒤 안내서를 다시 고치지 않는다(고치면 재실행).
- **가정의 타당성**: "준비 관측의 소스 SHA = 지금 생산 파일 SHA" 가정은 측정 코드가 직접 대조한다(`productionSources.*.matchesInputs`). 다르면 안내서 문구가 낡았을 수 있으므로 `notes` 에 적고 보고에 올린다.
- **반론1 (강한 반론) "선택자 · 함수 이름이 안내서에 있으면 비개발자용이 아니다"** → 맞다. 그래서 본문(1~8절)에는 식별자 0 을 측정으로 강제한다(`guide.identifiersOutsideEvidenceTable = 0`, 본문 코드 블록 0, 명령형 줄 0). 식별자는 9절 근거표와 measurement 에만 둔다. 근거표가 없으면 법정 · 다음 세션이 안내서와 소스를 잇지 못하므로 근거표는 필요하다.
- **반론2 (강한 반론) "vm 격리 로드는 실제 브라우저가 아니므로 제어 규칙 측정이 무의미하다"** → `controlAllowed` 는 DOM · 네트워크에 의존하지 않는 순수 함수이고, `app.js` 는 `document` 가 없으면 export 만 하고 멈추도록 짜여 있다(소스 43~45줄: `const api = …` · `module.exports = api` · `if (!global.document) return`). 같은 함수가 브라우저에서 단추의 `disabled` 를 정한다. 준비 담당이 실제 브라우저에서 읽은 네 단추의 `disabled` 값이 이 함수의 계산과 일치하는지를 함께 대조하므로(`controls.domObservation.consistentWithControlAllowed`), 부품 측정과 실제 DOM 관측이 서로를 받친다. 다만 "서버가 요청을 받아 상태를 바꾼다"는 재지 않았고 그렇게 적는다.
- **재검증 결과 절차 보완**: 측정 명령은 `--assemble` 모드가 자식 프로세스로 돌려 exitCode 를 실제로 받는다. 자식 생성이 막히면 같은 프로세스에서 측정해 stdout 파일을 쓰고 `exitCode: null` · `spawnError` 를 남긴다(원시 실패 보존, L055).

## 7. [원칙 ⑦] 단계별 실행 — 구체 식별자

- 파일: `docs/agents/YANGVIS-OURGOAL-OPERATOR-GUIDE.md`(안내서) · `reports/TASK-ES-605/measure-guide.cjs` · `reports/TASK-ES-605/raw/measure.stdout.json` · `reports/TASK-ES-605/measurement.json` · `reports/TASK-ES-605/claims.json` · `.claude/plan-TASK-ES-605.md`.
- 읽기 전용 출처: `C:\dev\command-center\hud\yangvis\app.js`(SHA-256 `0a21c2ee58ea3496d5f738819d371185cb8c305f6f81d639df0d9d65e65f912f`) · `index.html`(`dd520a115704c7405a2c7d3854443a041167a3f188c5495597b5df4bb1bd20b1`) · `styles.css`(`832f0232a71a5ae5f5f2484725ec402470477c84a775e90957c9c7bcc1e728ba`) — 입력 `ui-source-excerpts.json` · `public-observation.json` · `preservation-before.json` 이 기록한 값과 측정 코드가 대조한다.
- 1단계 DOM: `[data-action="focus-composer"]` · `#instruction` · `[data-mode="execute"]` · `[data-mode="query"]` · `[data-mode="plan"]` · `#send` · `#composer-project`(지시할 대상) · `#composer-feedback`. 함수: `submitInstruction` · `mutation` · `request` · `responseView` · `feedback` · `toast` · `openTask`.
- 2단계 DOM: `[data-action="toggle-settings"]` · `#composer-settings` · `#composer-tool` · `#composer-model` · `#composer-effort` · `[data-tab="settings"]` · `#selection-fields` · `#selection-tool` · `#selection-model` · `#selection-effort` · `[data-action="select-settings"]` · `#selection-feedback`. 함수: `selectionFields` · `renderComposerSettings` · `settingsView` · `selectSettings` · `modelsFor` · `effortsFor` · `verified` · `supportSource` · `recommendationView`.
- 3단계 DOM: `[data-route="overview"]` · `[data-route="flow"]` · `[data-route="tasks"]` · `.status` · `.action-callout` · `.measured-note` · `.focus-panel` · `.task-row` · `.flow-event` · `#task-search` · `[data-filter]` · `.sync-note`. 함수: `overviewView` · `flowView` · `tasksView` · `detailOverview` · `eventLabel` · `eventSummary` · `flowEvents` · `owner` · `next` · `humanDescription` · `statusInfo`(`STATUS` 19개) · `syncText`.
- 4단계 DOM: `[data-control="pause"]` · `[data-control="stop"]` · `[data-control="resume"]` · `[data-control="change"]` · `.control-reason` · `#control-feedback` · `#change-box` · `#change-instruction` · `[data-action="submit-change"]` · `.request-notice`. 함수: `controls` · `controlAllowed` · `control` · 클릭 분기 `target.dataset.control`. 요청 본문에 `expectedRevision: task.revision` 동봉.
- 5단계 DOM: `[data-route="structure"]` · `[data-node]` · `[data-node-link]` · `#structure-search` · `[data-action="search-structure"]` · `[data-action="graph-root"]` · `.cell-inspector` · `.cell-level` · `[data-tab="evidence"]` · `[data-tab="events"]` · `[data-action="load-history"]` · `[data-action="reload-history"]` · `[data-route="knowledge"]` · `#knowledge-search`. 함수: `structureView` · `mapBasis` · `nodeFacts` · `evidenceView` · `eventsView` · `loadEventHistory` · `knowledgeView` · `resourceLink`.
- 6단계 DOM: `[data-tab="evidence"]` · `.sync-note` · `.evidence-row`. 함수: `evidenceView` · `syncText` · `phaseLabel`(`independent-verification` → 「독립 검증 단계」).
- 측정 코드의 칸: `mode` · `sourceCommit` · `inputs` · `guidelines` · `productionSources` · `excerptConsistency` · `componentProbe`(`loaded` · `statusLabels` · `matrix` · `invariants` · `capabilityFilter`) · `controls`(`four` · `wiring` · `domObservation`) · `stages[6]`(`selectors` · `sourceFunctions` · `labels` · `mustExplain` · `missing`) · `guide` · `req` · `plan` · `preservation`(`tracked` · `gitConfig` · `status`) · `outputsAtMeasurement` · `limitations` · `summary`.

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)

- 측정 출처 `reports/TASK-ES-605/measurement.json`: `command` · `cwd` · `exitCode` · `raw.stdout.sha256` · `productionSources.*.matchesInputs` · `excerptConsistency.allEqual` · `componentProbe.invariants.*` · `controls.domObservation.consistentWithControlAllowed` · `summary.mustExplainMissingTotal` · `summary.labelsMissingTotal` · `summary.selectorsMissingTotal` · `summary.functionsMissingTotal` · `guide.identifiersOutsideEvidenceTable` · `guide.bodyFencedCodeBlocks` · `guide.commandLikeLines` · `req.lint8.issues` · `preservation.tracked.mismatchedCount` · `preservation.tracked.missingCount` · `preservation.gitConfig.matched` · `limitations.*`.
- 막힐 지점: ① 생산 폴더 읽기 차단 → snapshot 모드 ② 자식 git 차단 → 입력 tracked 목록 대조 ③ Git config 해시 방법 미상 → `matched: null` ④ mustExplain 문구 누락 → 안내서 보강 ⑤ 문서 린터 → 헤더 표준 · ② 절에 `#` 글자 금지 ⑥ 법정은 `docs/**` · `reports/**` 를 neutral(제품 아님)로 보므로 이 PR 의 주장은 전부 `config` 분야 글자 확인(L1)이다 — 그것이 실제 화면 · 실계정 · Court 판정을 뜻하지 않음을 보고에 적는다.
- 미완(이 세션이 완료로 선언하지 않는 것): 커밋 · push · PR · 법정 판정 · 독립 검토 · 병합 · task-link sync · 세포지도 · 경험칙 갱신 · 실제 제어 단추 E2E · 실계정 실행 성공 · Telegram 왕복 · Windows 전체 재부팅 · Claude artifact 되읽기 · 장기 효과.
