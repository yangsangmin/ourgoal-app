# REQ — #TASK-ES-356 세포 골격: 모듈 청사진 + 재발 방지 장치 (CORE-08)

- 근거: 노션 「아워골 UI/UX 대개편 작업 티켓 DB」 CORE-08, 노션 「[청사진] 아워골 세포 골격 — 유기적 모듈 구조 v0.1 (2026-10-04)」(https://app.notion.com/p/3ef598db909681f9a355dfd685280b3f), 시각화 「아워골 세포 지도」(https://claude.ai/artifact/VvfYJf37tYgRGwKezpHW2J), #663 CORE-04(이벤트 버스), #664 CORE-01(tab-check), #665 CORE-02(실계정 하네스), #660 CORE-03(원장 설계).
- 상민님 원문(2026-10-04): "모듈화를 개선하면서 차후 모듈화된 시스템이 효과적이고 효율적으로 운영되고, 향후 개발 및 개선작업 지속시 우상향적이고 시너지를 내면서 확장하고 개발될 수 있는 청사진을 그리면서 도입되고 있는지 확인하고 부족한 점이 있다면 그것도 같이 진행해야돼"
- 상민님 원문(2026-10-04, 방향 합의): "조선소의 효율적인 조선공법을 도입하면서도 최종적으로 추구하는 방향은 생명체같은 유기적인 구조야. 세포분열같은거지. 큰 세포와 작은세포와 하이브리드 세포 … 세포는 추가될 수 있고, 쪼개질 수도 있고 없어질 수도 있지 그리고 유기적인 연결방법, 구조 전체가 변경될 수도"
- 상민님 확정(2026-10-04): 세포 종류 4가지(organ·tab·hybrid·future), 꽂는 자리 정식 목록 15곳, 쪼개는 순서 1 설정 → 2 공용 화면 부품 → 3 기록·일정 → 4 팀 → 5 아바타·EXP → 6 홈 → 7 데이터 파일. 세포 소멸(기능 삭제)·구조 재편 결정은 상민님.
- 범위: 새 파일만(문서·스크립트·시험·`js/core/capabilities.js`·`js/core/slots.js`) + `scripts/test-shipyard-modular.js` 에 [Test 6] 한 묶음 추가(npm test 연결). **`index.html`·`js/tabs/**` 와 기존 `js/**` 는 한 줄도 고치지 않았다**(제품 동작 변화 0 — 설정 탭 이전 TASK-ES-354 세션 작업 중). 병합하지 않는다.
- 규칙 강화 고지: `scripts/test-shipyard-modular.js` 에 모듈 가드를 연결한 것은 상민님 원문이 요구한 "우상향" 장치(부채가 늘면 막는 래칫)를 npm test 에 거는 **규칙 강화**다. 기존 검사는 하나도 지우거나 느슨하게 하지 않았다.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 원문(요지)

1. 세포 골격 청사진 `docs/architecture/MODULE-BLUEPRINT.md`: 세포 해부(신고서 = provides·requires·contributes·emits·listens·owns·capabilities), 세포 종류(4가지), 연결망 3종(신호=사건 버스, 신경=능력 등록부, 꽂는 자리=슬롯), 세포의 삶(추가·분열·융합·소멸·재편 — 소멸·재편은 상민님), 건강 지표, 계층·의존 방향·전역 노출·이름·파일 크기·새 기능 절차·모듈 단위 검증·단계별 이전 지도와 지표, 현재 실측 기준선.
2. 코어 최소 골격(동작 변화 0, 새 파일만): `js/core/capabilities.js`(provide/request — 없으면 명확한 오류), `js/core/slots.js`(define/contribute/list), 신고서 형식(modules.json 확장). registry 의 사본 보관 틈을 고치거나 청사진에 명시.
3. 가드: ①~⑤ 래칫(늘면 실패·줄면 알림·올리려면 사유) + 신고서 검증(신고서 없는 새 세포·주는 세포 없는 requires·owns 중복 → 실패, 이벤트 불일치 → 경고) + 정식 목록 15곳 밖 자리 → 실패. npm test 경로 연결, 현재 main 통과.
4. 스캐폴드 `scripts/new-module.js <tab> <name>`: 신고서·capabilities 포함 새 세포 + 시험 뼈대, index.html 은 안내만. 만든 빈 세포가 레지스트리에 마운트되는 시험(생성물 삭제).
5. 지표 `scripts/module-metrics.js`: ①~⑤ + 모듈 수·평균 + 노션 6절 건강 지표(미분화·전역·800줄·그리는 작은 세포·중복 세포·데이터 중복), 상태창 형식, 오늘 값 `docs/architecture/metrics-2026-10-04.json`. 커맨드센터 연결은 문서로만.
6. 공용 UI 부품 목록 `docs/architecture/UI-COMPONENTS.md`: 바텀시트·토스트·확인창·칩·모달 중복의 수·위치 표와 js/ui 한 벌화 순서(구현은 다음 티켓).
7. 시험: capabilities·slots 단위, 가드 위반(①·④·⑤ 각각 실패), 스캐폴드 마운트.
8. 문서: REQ/PLAN, claims, TICKETS 1줄, dev_log. PR(초안 아님), 법정 판정 기록.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 지금 모듈화는 "블록 파일이 생겼다"에서 멈춰 있고, 다음 작업이 부채를 줄이는지 늘리는지 아무도 재지 않는다. 세포(모듈)끼리 맞물리는 방법이 정해져 있지 않아, 새 기능은 index.html 전역에 또 기대고, 같은 일을 하는 부품이 여러 벌 생긴다. 그래서 개발이 쌓일수록 우상향이 아니라 엉킴이 늘어난다.
- **원인**: (가) 연결 방법이 신호(#663 버스) 하나뿐 — "능력을 빌리는 길"과 "자리에 꽂는 길"이 없어 전역 함수(`window.toast` 등)를 직접 부른다(전역 직접 대입 282곳). (나) 모듈마다 무엇을 주고 무엇이 필요한지 적은 곳(신고서)이 없다. (다) 부채를 재는 숫자와, 숫자가 늘면 막는 장치가 없다(800줄 상한은 법정만 보고, index.html 증가·전역 증가·탭 간 참조는 아무도 안 본다). (라) 작은 세포 19개 중 실제로 그리는 것은 2개 — 나머지는 index.html 렌더 함수 위임 껍데기.
- **중심**: 세포 신고서(`docs/architecture/modules.json`)와 그것을 매 `npm test` 마다 검증·래칫하는 `scripts/module-guard.js`.
- **핵심**: 연결망 3종(신호·신경·자리)을 코어에 최소로 세우고, 모든 세포를 신고서로 드러내고, 부채 숫자를 한 방향(감소)으로만 움직이게 한다. 능력 기술(`capabilities`)은 기계가 읽는 형태라 미래 AI 비서 세포가 그대로 쓴다.

## 3. [원칙 ③] 해결방식

- 문서: `docs/architecture/MODULE-BLUEPRINT.md`(세포 골격, 상위) · `docs/architecture/UI-COMPONENTS.md`(공용 부품 중복·순서). 분할 절차는 TASK-ES-354 의 `docs/specs/MODULE-SPLIT-PROTOCOL.md` 를 하위로 링크.
- 코어 골격(새 파일): `js/core/capabilities.js` — `provide(name, impl, meta)`·`request(name, requester)`(없으면 `CAPABILITY_MISSING`)·`call`·`has`·`describe`(구현 없는 기계 판독 기술, `sideEffect: external` → `needsConfirm`)·`revoke`·`revokeCell`, 주인 둘이면 `CAPABILITY_CONFLICT`. `js/core/slots.js` — 정식 15곳 `DEFAULT_SLOTS`·`define`(목록 밖 `SLOT_NOT_ALLOWED`)·`contribute`·`list`·`collect`(수밀 격벽, 미래 자리는 그리지 않음)·`withdraw`·`withdrawCell`·`slots`.
- 신고서: `scripts/module-specs.js` 가 `docs/architecture/modules.json`(`schema: ourgoal.cells/1`, 세포 59 + 미분화 1)을 손 칸 보존·자동 칸 갱신으로 병합(`--write`)하고 검증(`validate`).
- 가드: `scripts/module-guard.js` — 기준선 `docs/architecture/module-baseline.json`(`history[]`, 마지막 항목이 기준) 대비 ①~⑤ 래칫 + 신고서 검증. `--update` 는 줄어든 값만 사유 없이, 늘어난 값은 `--reason`(20자 이상) 필수, 사유 없이 손으로 올린 이력은 실패.
- npm test 연결: `package.json` scripts 는 동결이라 이미 npm test 가 부르는 `scripts/test-shipyard-modular.js` 끝에 [Test 6] 으로 가드·시험 3개를 자식 프로세스로 실행.
- 지표: `scripts/module-metrics.js`(`--card` 상태창 카드). 스캐폴드: `scripts/new-module.js`.
- registry 사본 보관 틈: 기존 코드 수정 금지 지시에 따라 **청사진 4-4절에 명시**(현재 경로에서 드러나지 않는 이유와 고칠 방법 포함).

## 4. [원칙 ④] 재검토 — 한계(정직하게)

- `capabilities.js`·`slots.js` 는 index.html 에 붙이지 않았다 — 브라우저 앱에서는 아직 돌지 않는다(첫 사용처 TASK-ES-354). 이 PR 의 골격 동작 증거는 Node 단위 시험뿐이다.
- 지표의 일부는 정의 서명(정규식) 집계다: 함수 선언 수에 이름 붙은 함수 식이 들어가고, 주석은 "주석만 있는 줄"만 뺀다. 중복 세포 군(토스트·리캡·타이머 …)은 스크립트 `DUP_FAMILIES` 의 서명으로 센 값이며, 노션 표(토스트 6·리캡 3·타이머 4)와 같게 나왔다. 서명 밖의 변형 구현은 세지 못한다.
- 데이터 중복 저장(16)은 원장 설계서(#660) 지도표를 읽어 센 값이다(코드 실측이 아니다).
- 기존 세포의 `provides`·`requires`·`owns` 는 대부분 비어 있다(능력 등록부를 아직 아무도 안 쓴다). 계획은 `planned` 에 적었다. 그래서 오늘 "requires 미제공" 실패는 실물에서 0 이고, 위반 시험은 fixture 로 증명했다.
- 세포 종류 분류(기관·하이브리드)는 노션 세포 지도 v0.1 을 옮긴 것이다. `customize.js` 는 지도에 없어 하이브리드로 임시 분류하고 표시했다.

## 5. [원칙 ⑤] 절차

워크트리 `C:/dev/wt/core-08`(브랜치 `feat/2026-10-04-task-es-356-module-blueprint`, origin/main bb343d3 → #665 반영 f7e31bd) → 지표 스크립트 → 가드·기준선 → 신고서 추출 → npm test 연결 → 가드 시험 → 스캐폴드·시험 → (방향 재설계) 능력 등록부·자리·신고서 확장·건강 지표 → 정식 자리 15곳·종류 4가지 반영 → 문서 → `npm test` → 커밋·PR·법정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1: "가드가 npm test 에 걸리면, 지금 병행 중인 다른 PR(특히 설정 탭 이전 TASK-ES-354)이 갑자기 실패한다." → 래칫은 **늘 때만** 실패한다. TASK-ES-354 는 index.html 코드를 바깥 파일로 옮기는 작업이라 ①·② 는 줄고, 새 파일은 800줄 이하·탭 간 참조 없음이 그 PR 의 규칙과 같다. 다만 그 PR 이 새 js 파일을 더하면 신고서가 필요해진다 → 실패 메시지가 `node scripts/module-specs.js --write` 를 바로 알려 주고, 이 PR 이 먼저 병합되면 TASK-ES-354 쪽이 main 을 합칠 때 한 줄 명령으로 해결된다. 반대로 TASK-ES-354 가 먼저 병합되면 이 PR 이 main 을 합치고 기준선을 다시 잰다(지시).
- 반론 2: "능력 등록부·자리를 index.html 에 붙이지 않으면 껍데기(GUARD_02) 아닌가." → 화면 요소가 아니라 코어 라이브러리이고, 등록·요청·오류·해제·수밀 격벽 전부가 단위 시험과 스캐폴드 시험(레지스트리 경유 마운트 → 능력 요청 → 자리 기여 → dispose 흔적 0)으로 실제로 돈다. 화면 연결을 이 PR 에서 하지 않는 것은 "index.html·js/tabs 수정 금지·동작 변화 0" 지시 때문이며, 첫 사용처(TASK-ES-354)와 연결 순서를 청사진에 적었다.
- 반론 3: "신고서를 손으로 관리하면 곧 낡는다." → 코드에서 뽑을 수 있는 칸(신호·DOM 루트·의존)은 `--write` 가 다시 쓰고, 어긋나면 가드가 경고한다. 사람이 정해야 하는 칸(종류·능력·데이터 주인)만 손으로 두고, 그 칸이 틀리면(주인 둘·주는 세포 없음·목록 밖 자리·종류 밖) 실패한다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 파일(새로): `docs/architecture/MODULE-BLUEPRINT.md` · `docs/architecture/UI-COMPONENTS.md` · `docs/architecture/modules.json` · `docs/architecture/module-baseline.json` · `docs/architecture/metrics-2026-10-04.json` · `js/core/capabilities.js` · `js/core/slots.js` · `scripts/module-metrics.js` · `scripts/module-guard.js` · `scripts/module-specs.js` · `scripts/new-module.js` · `tests/core-capabilities-slots.test.js` · `tests/module-guard.test.js` · `tests/new-module.test.js`. 수정: `scripts/test-shipyard-modular.js`(+[Test 6]).
- 함수: `measure`·`summarize`·`duplicateFamilies`·`drawingSmallCells`·`dataDuplicates`·`crossTabRefs`(module-metrics) · `run`·`update`·`compareToBaseline`·`validateHistory`(module-guard) · `merge`·`validate`·`actualOf`(module-specs) · `generate`·`moduleSource`·`testSource`(new-module) · `CapabilityRegistry.provide/request/call/describe/revokeCell` · `SlotBoard.define/contribute/list/collect/withdrawCell`.
- 전역(core 한 통로): `window.OurgoalCapabilities`·`window.OurgoalSlots`(파일이 로드될 때만 — 이 PR 에서는 index.html 에 없음).
- DOM: 없음(화면 변경 없음). 스캐폴드가 만드는 세포의 DOM 루트 규칙 `<tab>-<name>-slot`.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

- 기준선(origin/main, `node scripts/module-metrics.js`): ① 38,207 · ② 718 · ③ 282 · ④ 12 · ⑤ 0. 건강 지표: 미분화 38,207 · 전역 282 · 800줄 초과 12 · 그리는 작은 세포 2/19 · 중복 세포 토스트 6·리캡 3·타이머 4(참고 모달 통로 4·덮개 9·confirm 41) · 데이터 중복 저장 16.
- 시험: `tests/module-guard.test.js` 6건(통과 1 · ①④⑤ 실패 3 · 래칫 1 · 신고서 1), `tests/core-capabilities-slots.test.js` 12건, `tests/new-module.test.js`(생성 → 마운트 → 가드 통과 → 신고서 지우면 실패 → 거부 4종 → 생성물 삭제·modules.json 원문 복원), `npm test` 0.
- 확인 못 함: 브라우저 앱 안에서의 능력 등록부·자리 동작(index.html 미연결), 커맨드센터 상태창 실제 표시(범위 밖).
