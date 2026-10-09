# REQ — #TASK-ES-602 세포지도 설명 대기 7개 세포의 이름·기능 설명 보완 (양비스 새 지휘 경로 첫 아워골 업무)

> **문서 ID**: REQ-TASK-ES-602-YANGVIS-MAP
> **티켓 연계**: #TASK-ES-602 (상위 작업 TASK-YANGVIS-OURGOAL-REBUILD-01a11bfe)
> **작성 일시**: 2026-10-09
> **작성자**: Claude builder 세션 3893c52b (작업 트리 `C:/dev/wt/yangvis-ourgoal-map-01a11bfe`, 입력 ref `4d906fd1`)
> **작업참고 기준**: PR #847 (eed37224) · 유형 분류 **(가) 표준** — 가장 가까운 선례 REQ-TASK-ES-418(짧은 이름 추가)·#593(지도 재생성). reports 값 주장은 `config` 분야(L051), 제품 코드 변경 0(L001 해당 없음).
> **원시 측정**: `reports/TASK-ES-602/measurement.json` (스크립트 산출. 이 문서의 수치는 그 파일에서 옮겨 적지 않고 칸 이름으로 가리킨다)

- 지시 원문: "아워골 세포지도에서 설명 대기인 실제 항목의 기능 설명과 이름을 실제 소스 기준으로 보완하고, 기존 생성기로 지도를 갱신해 새 양비스 화면에서 정확하게 읽을 수 있게 해줘."
- 범위(허용 수정): `docs/architecture/cell-descriptions.json`(names·cells 7건 추가), `docs/architecture/cell-map.json`(기존 생성기 재생성), 이 REQ, `reports/TASK-ES-602/**`, 빌더 계획서·작업 연계 기록. **제품 코드(index.html·js/**)·tests·금고·생성기 변경 0.**
- 바깥(이 PR 밖): 커맨드센터 `lib/yangvis-control/projection.js` 가 `origin/main:docs/architecture/cell-map.json` 의 세포 `name`(이름표)·`does`(역할) 칸을 읽는다 — 병합 뒤에야 새 화면에 보인다.

## 요구사항 식별자

- **R1**: 아워골 세포지도에서 설명 대기인 실제 항목의 기능 설명과 이름을 실제 소스 기준으로 보완한다(기존 이름·설명은 모두 보존).
- **R2**: 기존 생성기로 지도를 갱신해 새 양비스 화면에서 정확하게 읽을 수 있게 한다.

독립 검토 보정: 로그인 설명의 배타적 표현을 실제 소스에 맞게 고쳤다. C26은 원래 단일 검사 범위로 한정하고, C28~C41은 최종 생성 지도의 실제 세포 ID/인덱스로 7개 세포의 nameSource·doesSource를 각각 검사한다. 원래 측정과 npm test 실패 기록은 외부 원본 SHA로 보존한다. 원래 기준의 343개 보존과 603 병합 후 기준 항목 보존을 별도 대조한다. 이 자료 조립은 Court 판정·원격 화면 완료가 아니다.

> 보정 조립의 현재 기준 커밋: `76ac598ec35231a93619138dce98fec87fd8c509`. 현재 기준의 항목 수와 대상 인덱스는 `measurement.json`의 `descriptions.before/after`, `map.targetCells`로 재계산한다. 아래 원칙별 본문은 최초 작업 당시 관찰을 보존한 것이며, 최초 명령·npm test 실패와 수치는 `measurement.json.originalWorkerSnapshot` 및 외부 원본 사본을 가리킨다. 당시 343개/349세포/대상 밖 차이 기록을 603 병합 후 현재 수치로 해석하지 않는다.

## 1. [원칙 ①] 문제 정확히 파악

- 저장된 세포지도 `summary.descriptionsPending` 에 세포 7개가 남아 있다(`measurement.json` → `map.pendingBefore`, 입력 `request.json` → `missing` 과 같음): `auth-social` · `avatar/level-badge` · `core/modal-open` · `creator-templates-legacy` · `goals/curated-market-data` · `goals/template-encyclopedia-modal` · `records/vision-table-input`. 모두 실제 파일이 있는 세포다(`js/auth-social.js` 등, `sourceEvidence.*.file`).
- 이 7개는 손 설명이 없어 생성기가 파일 머리 주석(예: "Modal Open & Handlers", "Vision Table Input")을 대신 실었다(`doesSource: header`, `nameSource: derived`). 비개발자가 보는 지도에서 기능을 알 수 없다.
- 설명 파일에는 지도에 없는 고아 항목 `credits` 가 하나 있다(`descriptions.orphanEntriesKeptNotInMap`). 이 작업은 지우지 않는다(기존 항목 보존 지시).

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질 축**: INFRA(문서·지도 자료). 제품 동작 변경 없음.
- **[본질]**: 결정권자가 지도만 보고 "이 세포가 무엇을 하는지"를 안다. 함수 이름이 아니라 사용자가 보는 기능 말이어야 한다.
- **[원인]**: ① 인라인 어려움 묶음 분열(#591·#592·#593)로 생긴 세포 7개에 설명을 더하지 않았다 ② 설명 파일은 손 칸이라 생성기가 채워 주지 않는다 ③ 머리 주석은 영어 함수 설명이라 대체 문구로 부적합하다.
- **[중심]**: 설명은 생성기 입력 `cell-descriptions.json` 한 곳에 적고, 모든 화면(저장소 지도·노션·새 양비스 투영)이 같은 `name`·`does` 칸을 읽는다.
- **[핵심]**: 기존 343개 names·cells 항목을 한 글자도 바꾸지 않는다(`descriptions.preserved` 네 목록이 모두 빈 배열). 설명은 실제 소스에서 읽은 산 기능만 적고, 호출부가 없는 죽은 부분·결함은 산 기능처럼 적지 않는다.

## 3. [원칙 ③] 해결방식

- 세포마다 실제 파일·노출 함수·호출부(index.html 가져오기 줄, 다른 세포의 호출)를 읽고 한국어 짧은 이름(`names`)과 「하는 일」 한 줄(`cells`)을 적는다. 근거는 `measurement.json` → `sourceEvidence` 에 스크립트로 추출해 둔다.
- 기존 항목 뒤에 7건을 덧붙인다(최근 추가 관례와 같음: `core/all-view-render`·`settings/a11y-announce` 가 파일 끝에 있음). 파일 줄끝(CRLF)·들여쓰기(2칸) 그대로.
- 기존 생성기 `node scripts/cell-map-export.js` 로 지도를 다시 만들고 `--check` 로 저장본이 최신인지 본다. 생성기·검사 기준은 바꾸지 않는다.

### 세포별 근거(소스에서 읽은 것 — `sourceEvidence` 칸과 같은 사실)

| 세포 | 산 기능(호출부 있음) | 적지 않은 것 / 결함 후보(고치지 않음) |
| :-- | :-- | :-- |
| `auth-social` | 시작·로그인 화면 버튼 4개(`landKakaoBtn`·`authKakaoBtn`·`landGoogleBtn`·`authGoogleBtn`)에서 카카오·구글 로그인 시작. 구글은 원탭·토큰 확인 뒤 `OurgoalGoogleSessionGuard` 로 서버 확인 세션만 입장. 기존 로그인 계정을 유지하며 구글 계정·캘린더 연동 정보를 저장(토큰이 있으면 토큰 저장, 사진이 있고 기존 아바타가 없으면 아바타 저장). 소셜 로그인이 막히면 빠른 시작 안내 | — |
| `avatar/level-badge` | `#levelBadgeRow`(index.html 위젯 힌트: "홈 맨 위 아바타 카드에 들어 있어요")에 아바타·랭크 칭호·상황 말풍선·Lv.·XP 바를 그리고 아바타 설정 창을 연다 | — |
| `core/modal-open` | 공용 바텀시트 `openModal`: 큰 ✕ 닫기 자동 주입, 바깥 누름 닫기, 뒤로가기용 history 한 번 쌓기 | — |
| `creator-templates-legacy` | `cloneTemplate` 이 피드·백과사전·공유 링크에서 불려 템플릿을 마일스톤·할 일까지 내 목표로 복제하고 복제 수를 서버에 기록 | `templatesHtml` 은 index.html 호출 0 이고 강제 플래그 없이는 빈 문자열(#TASK-ES-315 영구 제거) — 설명에 "비어 있다"로 사실대로 적음 |
| `goals/curated-market-data` | 큐레이션 템플릿 자료(제목·열·기본 행) — index.html 마켓 화면이 7곳에서 읽음 | 자료에 고정 `downloads` 문자열(예: '2,480')이 있음 — 허상지표 후보(L030), 이 PR 밖 |
| `goals/template-encyclopedia-modal` | 백과사전 팝업 열기/닫기(머리글 버튼·ESC·바깥 누름), 실사용자/AI 추천 탭, 응원·내 목표로 담기·내 목표 공유 | 응원·공유 목록이 localStorage 전용(`ourgoal_tpl_likes`·`ourgoal_user_shared_templates`) — GUARD_03 후보; `REAL_USER_TEMPLATES` 는 코드에 박힌 "실유저" 자료 — L031 결심 후보. 설명에 "이 기기에만 저장"으로 사실대로 적음 |
| `records/vision-table-input` | 전문 템플릿 표의 사진 올리기 → 1024px 압축 → `/api/vision-table` → 행 선택 넣기. 하루 한도 10회(기기 저장) | 서버 실패 시 샘플 행("로컬 비전 분석")을 보여 줌 — GUARD_02 결함 후보. 설명에 "샘플 행을 대신 보여 준다"로 사실대로 적음 |

## 4. [원칙 ④] 재검토 — 한계와 반례

- 설명은 사람이 쓴 글이다. 기능이 바뀌면 설명도 고쳐야 한다(ES-418 과 같은 관리 방식).
- 생성기는 git 추적 파일만 읽으므로 미추적 입력 폴더 `.yangvis-inputs/` 는 지도에 들어가지 않는다(확인: 생성기 출력 세포 수가 저장본과 같음).
- 저장본 지도는 기준 커밋 `11c8e9dd` 에서 만든 것이라 재생성하면 대상 밖 세포 4개의 병합 이력 칸(`prs`·`tasks`·`header`·`lines` 등)도 바뀐다(`map.cellsChangedOther`). 이는 main 이 앞서 간 결과이며 이 PR 이 손댄 것이 아니다 — `--check` 는 그 칸을 비교에서 뺀다(#TASK-ES-427).
- 반례 1(잘못된 설명): `creator-templates-legacy` 를 머리 주석대로 "구형 템플릿 60선 창 렌더링"이라 쓰면 거짓이다 — 호출부 대조로 산 기능은 복제뿐임을 확인했다.
- 반례 2(선언을 측정으로 오인): "지도가 갱신됐다"는 생성기 exit 0·`--check` 출력·`pendingAfter: []` 로만 말한다. 새 양비스 화면 표시는 병합 뒤 origin/main 을 읽는 바깥 일이라 이 PR 에서는 확인하지 않았다(미완으로 보고).

## 5. [원칙 ⑤] 절차

1. 지시함(origin/main, 열린 지시 0)·작업참고(#847)·헌법·생성기·설명 스키마·소스 7개·호출부 정독.
2. `cell-descriptions.json` 에 names·cells 7건 추가(스크립트, 기존 항목 보존).
3. `node scripts/cell-map-export.js` → `--check`.
4. `reports/TASK-ES-602/measurement.json` 을 스크립트로 생성(입력 커밋·SHA256·누락 전/후·보존 대조·지도 차이 분류·소스 근거·명령/exit).
5. 이 REQ·`claims.json` → `node scripts/verify-integrity-gate.js` → `npm test`(작업자 측정).
6. 커밋·push·PR·법정·병합은 총괄이 독립 검토 뒤 담당(이 세션은 하지 않는다).

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- **재검증**: 보존 대조는 입력 사본(`.yangvis-inputs/cell-descriptions-before.json`, HEAD blob 과 동일 — `input.inputDescriptionsMatchesHeadBlob`)과 결과 파일을 항목 단위로 비교했다. 추가 집합이 `request.json` 의 `missing` 과 정확히 같다(`descriptions.addedMatchesRequestMissing`). 한글은 리터럴이며 `\uXXXX` 가 없다(`descriptions.escapedUnicodeInFile`).
- 반론 1 "머리 주석을 번역해 넣으면 충분하다" → 머리 주석은 함수 단위 설명이고 호출부가 없는 부분까지 산 것처럼 적는다. 호출부(index.html 가져오기 줄·다른 세포)를 읽어 산 기능만 적었다.
- 반론 2 "지도 전체 수치(세포 수 349 등)를 주장에 넣으면 설득력 있다" → main 이 움직이면 거짓이 된다(L002). 주장은 이 PR 이 소유한 설명 파일의 항목 값과 `summary.descriptionsPending = []`, 그리고 `measurement.json` 의 기록 값만 건다.

## 7. [원칙 ⑦] 단계별 실행 — 구체 식별자

- 파일: `docs/architecture/cell-descriptions.json`(`names.*`·`cells.*` 7건), `docs/architecture/cell-map.json`(생성), `reports/TASK-ES-602/measurement.json`, `reports/TASK-ES-602/claims.json`.
- 생성기: `scripts/cell-map-export.js`(`shortName`·`name`·`nameSource`·`does`·`doesSource`·`summary.descriptionsPending`).
- 소스 식별자: `js/auth-social.js`(`startOAuthLogin`·`startGoogleLogin`·`initGoogleOneTap`·`handleGoogleUserSuccess`) · `js/avatar/level-badge.js`(`renderLevelBadge`, DOM `#levelBadgeRow`·`#btnOpenAvatarModal`) · `js/core/modal-open.js`(`openModal`, DOM `#modalOverlay`·`#modalSheet`) · `js/creator-templates-legacy.js`(`cloneTemplate`·`templatesHtml`) · `js/tabs/goals/curated-market-data.js`(`CURATED_MARKET_TEMPLATES`) · `js/tabs/goals/template-encyclopedia-modal.js`(`openTemplateEncyclopediaModal`·`switchTemplateEncyclopediaTab`·`cheerRealUserTemplate`·`copyRealUserTemplate`·`shareMyActiveGoalAsTemplate`, DOM `#templateEncyclopediaModal`·`#tabTplRealUser`·`#tabTplOurgoalAi`) · `js/tabs/records/vision-table-input.js`(`openVisionTableModal`·`compressImageForVision`·`getVisionDailyQuota`, API `/api/vision-table`).
- 바깥 읽기: `C:/dev/command-center/lib/yangvis-control/projection.js`(세포 `name`→label, `does`→role).

## 8. [원칙 ⑧] 막히는 지점 예상 · 성과 측정 (작업자 측정, 판정 아님)

- 측정 출처 `reports/TASK-ES-602/measurement.json`: `descriptions.before/after`(names·cells 수), `descriptions.preserved`(손실·변경 목록), `map.pendingBefore/pendingAfter`, `map.targetCells`(7개의 `nameSource`·`doesSource` 가 `hand`), `commands`(생성기 exit·`--check` exit·출력).
- 막힐 지점: ① main 이 더 움직이면 `cell-map.json` 은 충돌한다 — 손으로 풀지 말고 main 판 입력으로 생성기를 다시 돌린다(L010·L009). ② 법정이 `docs/architecture`·`reports` 값을 `config` 분야 글자 확인으로만 보는 것은 정상이며, 이것이 새 양비스 화면 표시 확인을 뜻하지 않는다. ③ task-link 노션 sync·세포지도 게시·새 화면 되읽기는 외부 갱신이라 총괄 몫(이 세션은 로컬 기록·`check` 만).
- 미완(이 PR 이 완료로 선언하지 않는 것): Court 판정 · 독립 검토 · 커밋/PR/병합 · 새 양비스 화면 표시 · 노션/웹 세포지도 게시.
