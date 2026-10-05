# REQ — #TASK-ES-414 아워골 세포지도 실시간(노션·웹) 데이터 생성기

- 근거: 상민님 지시(2026-10-05, 코디네이터 경유) — "전체적인 구조와 각 세부적인 기능까지 알 수 있는 것이 가장 중요", "지속 업그레이드, 지속 실시간 연동". 아워골 프로젝트 컨트롤타워 허브 맨 위에서 바로 열린다.
- 번호: TASK-ES-412(#726 components 시험지)·413(헌법 초안) 사용 중 → 414 [기본값].
- 범위: 새 파일 `scripts/cell-map-export.js`·`scripts/cell-map-publish.js`·`scripts/cell-map-sync.md`·`docs/architecture/cell-map.json`·`docs/architecture/cell-descriptions.json`·`tests/cell-map-export-es414.test.js`, `scripts/test-shipyard-modular.js`(runNode 1줄), `reports/TASK-ES-414/claims.json`, dev_log·TICKETS 각 1줄. **제품 코드(index.html, js/**) 변경 0.** 동결 파일 변경 0.
- 바깥 화면(이 PR 밖, 세션이 이미 적재): 웹페이지 https://claude.ai/artifact/VvfYJf37tYgRGwKezpHW2J (v5), 노션 「아워골 세포지도 (실시간)」 https://app.notion.com/p/3f0598db9096810aa8ace3e2e6dcf2aa, 허브 맨 위 링크.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. 앱 전체 구조(탭/영역 → 세포 → 세부 기능)와 세포마다 하는 일·파일·줄 수·노출 이름·의존(무엇을 부르고 누가 부르는지)·관련 REQ/PR 를 한 곳에서 본다.
2. 노션과 웹페이지 두 곳, 허브 맨 위에서 열린다.
3. 코드가 바뀌면 지도도 따라 바뀐다(손으로 옮긴 숫자 0, 같은 입력 → 같은 출력).
4. 분열 진행률(800줄 초과 처음 12 → 지금 N)과 갱신 시각·기준 커밋을 보인다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 비개발자 결정권자가 "지금 앱이 어떤 부품으로 되어 있고 각 부품이 무슨 일을 하는지"를 코드를 열지 않고 안다.
- **원인**: 기존 세포 지도(v4)는 2026-10-04 숫자를 손으로 박은 정적 페이지라, 하루 만에 세포 59 → 150, 800줄 초과 12 → 4 로 바뀐 현실과 어긋났다. 신고서(`modules.json`)는 매 PR 갱신되지만 사람이 읽는 말("이 세포가 하는 일")과 의존·PR 연결이 없다.
- **중심**: 하나의 결정적 생성기 → 하나의 JSON → 두 화면. 화면은 데이터를 갖지 않고 읽기만 한다.
- **핵심**: 「하는 일」 한 줄은 함수 이름이 아니라 사용자가 보는 기능 말(`docs/architecture/cell-descriptions.json`, 150/150). 의존은 코드에서 뽑는다(노출 `window.X =` ↔ 읽는 `window.X`·`require`).

## 3. [원칙 ③] 해결방식

- `scripts/cell-map-export.js` `build(root)` — 입력: `modules.json`·`module-baseline.json`·`cell-descriptions.json`·`js/**` 실제 파일·`index.html`·`js/core/slots.js`·`docs/specs/REQ-TASK-ES-*.md`·git 첫 부모 줄기 병합 PR. 출력 `docs/architecture/cell-map.json`(`schema: ourgoal.cell-map/1`): `source`(기준 커밋 = 입력 경로를 마지막으로 바꾼 커밋·그 시각), `summary`(종류별 수·800줄 초과 처음/지금·미분화 줄·건강 지표), `kinds`(4종), `areas`(탭 6 + 여러 탭 기능 묶음 7 + 골격·기관·미래), `slots`(15곳·지금/계획 기여 세포), `splits`(기준선 첫 기록의 800줄 초과 12개 → 줄 수 흐름·떼어 낸 부품), `cells[]`(does·header·lines·over800·exposes·calls·calledBy·readsFromIndexHtml·usedByIndexHtml·emits/listens·provides/requires·contributes/planned·tasks·reqs·prs).
- 현재 시각을 쓰지 않는다 → 결정적. `--check` 로 저장본이 낡았는지 본다.
- `scripts/cell-map-publish.js` — `dbDocs()`(웹페이지 db: meta 1 + 세포 묶음, 문서당 150KB 이하), `notionParts()`(노션 마크다운: 머리·구조 표·분열 표·자리 표 + 영역별 토글), `verifyNotion()`(되읽기 대조).
- 웹페이지: jsDelivr `@main` 먼저, 안 되면 artifact db 저장본. 상태바에 출처·기준 커밋·시각·출처별 실패 이유.

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- claude.ai artifact 안의 `fetch` 는 jsDelivr 를 「Failed to fetch」로 막는다(측정: 같은 페이지 로컬 파일에서는 HTTP 404 응답까지 감 — 보안 규칙 차단으로 판단). 웹의 실제 실시간 경로는 세션이 갱신하는 db 저장본이다.
- `cell-map.json` 은 다른 PR 이 갱신하지 않는다(모든 PR 이 같은 파일을 고치면 충돌). PR 병합 뒤 세션 절차(`scripts/cell-map-sync.md`)로 갱신.
- 의존은 전역 이름·require 기준이다. index.html 인라인 IIFE 안 지역 호출, 문자열로 부르는 이벤트 처리기는 잡히지 않는다. 여러 세포가 같이 채우는 키트(`OurgoalUniversalStatsKit` 등)는 그 부품 모두를 "부르는 세포"로 센다.
- 분열 「떼어 낸 부품」은 부품 파일 머리 주석에 원본 경로와 "옮" 이 같이 적힌 것만 센다.

## 5. [원칙 ⑤] 절차

1. worktree `C:/dev/wt/cell-map`(`feat/2026-10-05-task-es-414-cell-map-live`, origin/main a9e08ab).
2. 설명 150줄 → 생성기 → 부품 시험 → npm test 등록.
3. 웹페이지 v5 게시 + db 적재 + 되읽기 비교, 노션 페이지 생성·되읽기 대조, 허브 맨 위 삽입·되읽기.
4. jsDelivr 접근·purge 측정, 절차 문서.
5. 커밋·PR(초안 아님) → 법정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1 "npm test 가 cell-map.json 최신 여부를 검사해야 진짜 실시간이다" → 검사하면 js 를 바꾸는 모든 PR 이 같은 생성 파일을 고쳐야 하고, 병렬 PR 끼리 매번 충돌한다(오늘만 PR 10여 개). 신고서·기준선은 이미 가드가 강제하므로, 지도는 병합 뒤 한 번 다시 만들면 된다. `--check` 로 낡음 여부는 언제든 잰다.
- 반론 2 "웹페이지가 jsDelivr 를 못 읽으면 실시간이 아니다" → 맞다. 그래서 db 저장본을 두고, 페이지는 저장본이 바뀌면(onSnapshot) 스스로 다시 읽는다. 세션이 절차 3단계를 하면 열린 화면까지 바로 바뀐다. jsDelivr 는 규칙이 풀리면 바로 살아나도록 시도를 남긴다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 함수: `build`·`serialize`·`headerLines`·`mergedPrs`·`basisCommit`·`splitHistory`(cell-map-export.js), `dbDocs`·`notionParts`·`notionHead`·`verifyNotion`(cell-map-publish.js).
- 파일: 위 범위 목록. 시험: `tests/cell-map-export-es414.test.js`(10건) — `scripts/test-shipyard-modular.js` [Test 6] runNode.
- 웹 DOM: `#status`·`#stSrc`·`#stTry`·`#reloadBtn`·`#stats`·`#q`·`#filters`·`#areas`·`.cell[data-id]`·`#panel`·`#panelBody [data-go]`·`#splits`·`#slots`.
- db: `cellmap/meta`, `cellchunks/c0`·`c1`(읽기 view, 쓰기 admin).

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

- 생성기: 세포 150 · 영역 16 · 800줄 초과 처음 12 → 지금 4 · 기준 커밋 31e5703 · 「하는 일」 손 설명 150/150. 두 번 생성 바이트 같음.
- 부품 시험 10/10(종료 코드 0).
- db 적재 3문서, view 수준 되읽기 → 세포 150 `deepStrictEqual` 같음.
- 노션 되읽기 대조: 세포 펼침 150/150 · 「하는 일」 150/150 · 영역 제목 16/16 · 깨진 글자 0 · 기준 커밋 있음.
- 웹페이지(로컬 헤드리스, db 흉내): 1280px·375px 둘 다 세포 150·상세 열림·의존 이동·검색 「DM」 8개·가로 넘침 0·스크립트 오류 0. claude.ai 실화면: 상태바 「페이지 저장본」, jsDelivr 「Failed to fetch」.
- jsDelivr: modules.json 200(main 과 같은 150세포), cell-map.json 404(병합 전), purge API 200 `finished` 1.1초.
