# 아워골 세포 골격 — 유기적 모듈 구조 청사진 (TASK-ES-356 · CORE-08)

> 상민님 원문(2026-10-04): "모듈화를 개선하면서 차후 모듈화된 시스템이 효과적이고 효율적으로 운영되고, 향후 개발 및 개선작업 지속시 우상향적이고 시너지를 내면서 확장하고 개발될 수 있는 청사진을 그리면서 도입되고 있는지 확인하고 부족한 점이 있다면 그것도 같이 진행해야돼"
>
> 상민님 원문(2026-10-04, 방향 합의): "조선소의 효율적인 조선공법을 도입하면서도 최종적으로 추구하는 방향은 생명체같은 유기적인 구조야. 세포분열같은거지. 큰 세포와 작은세포와 하이브리드 세포 … 세포는 추가될 수 있고, 쪼개질 수도 있고 없어질 수도 있지 그리고 유기적인 연결방법, 구조 전체가 변경될 수도"

- 정본 초안: 노션 「[청사진] 아워골 세포 골격 — 유기적 모듈 구조 v0.1 (2026-10-04)」(https://app.notion.com/p/3ef598db909681f9a355dfd685280b3f), 시각화 「아워골 세포 지도」(https://claude.ai/artifact/VvfYJf37tYgRGwKezpHW2J). 이 문서는 그 둘을 저장소 안 규칙으로 옮긴 것이다. 셋이 어긋나면 노션이 정본이고, 이 문서를 고친다.
- 범위: 아워골 앱 안의 모듈만. 구조 변경은 개발 과정에서 한다. **세포 소멸(기능 삭제)과 구조 재편은 상민님이 결정한다.**
- 하위 문서: 인라인 코드를 세포로 떼어 내는 구체 절차는 [`docs/specs/MODULE-SPLIT-PROTOCOL.md`](../specs/MODULE-SPLIT-PROTOCOL.md)(TASK-ES-354, 설정 탭 시범 이전이 만든다 — 이 PR 시점에는 아직 main 에 없다). 이 문서가 상위, 그 문서가 「분열」의 실행 절차다.
- 숫자는 모두 `node scripts/module-metrics.js` 산출(2026-10-04, origin/main f7e31bd). 손으로 옮긴 수치는 없다.

## 1. 한 줄 요약

조선소 공법(블록을 따로 짓고·병렬로·검수해 붙인다)은 **만드는 방식**, 세포 구조는 **사는 방식**이다. 모든 기능은 세포이고, 세포는 서로의 내부를 만지지 않고 **신호(사건)·신경(능력 요청)·꽂는 자리(슬롯)** 로만 맞물린다. 그래서 세포를 더해도, 쪼개도, 없애도 몸 전체가 살아 있다. 이 규칙이 지켜지는지는 **모듈 가드**가 `npm test` 마다 재고, 부채가 늘면 막는다(래칫).

## 2. 세포의 해부 — 신고서

모든 세포는 같은 형식의 **신고서**를 가진다. 신고서는 `docs/architecture/modules.json` 의 `cells[]` 항목 하나다(새 세포는 파일 안 `CELL` 객체와 같은 값을 둔다).

| 생명체 | 아워골 | 신고서 칸 | 뜻 |
| :-- | :-- | :-- | :-- |
| 세포막 | 계약 | `provides` | 주는 능력(신경망에 올리는 이름, 예: `ui.toast`) |
| | | `requires` | 필요한 능력 — **누군가 `provides` 해야 한다**(아니면 가드 실패) |
| | | `contributes` | 기여하는 꽂는 자리 — 정식 목록 15곳만(4-3절, 목록 밖이면 가드 실패) |
| | | `emits` · `listens` | 내보내는 신호 · 받는 신호(코드에서 자동 추출, 신고서와 다르면 가드 경고) |
| 세포핵 | 데이터 주인 | `owns` | 이 세포가 주인인 데이터 — **데이터 하나에 주인은 하나**(둘이면 가드 실패) |
| 리보솜 | 능력 기술 | `capabilities` | `[{ name, description, sideEffect, needsConfirm, input?, output? }]` — 기계가 읽는 "나는 이런 일을 할 수 있다". 나중에 AI 비서 세포가 그대로 읽는다 |
| 세포소기관 | 작은 세포 | (`kind: tab`, `size: small`) | 큰 세포(`size: large`)는 작은 세포들을 담는 그릇 |
| 수명 주기 | `mount` · `render` · `dispose` | (코드) | 붙고, 그리고, 떼어낼 때 흔적 0(구독·능력·기여 해제) |

그 밖의 칸: `id`(세포 이름) · `file` · `kind` · `size`(탭 세포만: `large`=큰 세포 `js/tabs/*/index.js`, `small`=작은 세포 — 경로로 자동) · `layer` · `tab` · `role`(담당 한 줄) · `spans`(하이브리드가 걸치는 탭) · `planned`(아직 없는 `provides`·`contributes` — 이전 지도. 자리 이름만 정식 목록인지 검사한다) · `domRoot` · `ownerKeys` · `dependsOn`(자동: 읽는 전역·require — 아직 세포 밖 전역에 기대는 정도를 보여 준다).

손으로 정하는 칸(`kind`·`role`·`spans`·`provides`·`requires`·`contributes`·`owns`·`capabilities`·`planned`)은 `modules.json` 에서 고치고, 코드에서 뽑는 칸(`emits`·`listens`·`domRoot`·`ownerKeys`·`dependsOn`)은 `node scripts/module-specs.js --write` 가 다시 쓴다. 검사만 보려면 `node scripts/module-specs.js --check`.

신고서 예시 — 스캐폴드가 만드는 작은 세포(`node scripts/new-module.js records weekly-summary --provides records.weekly-summary --contributes record.type`):

```json
{
  "id": "records/sub-weekly-summary",
  "file": "js/tabs/records/sub-weekly-summary.js",
  "layer": "tabs",
  "tab": "records",
  "kind": "tab",
  "size": "small",
  "role": "records 탭 weekly-summary 작은 세포 — 담당을 한 줄로 고쳐 적는다",
  "spans": [],
  "provides": ["records.weekly-summary"],
  "requires": [],
  "contributes": ["record.type"],
  "owns": [],
  "capabilities": [
    { "name": "records.weekly-summary", "description": "(담당을 한 줄로 고쳐 적는다) records.weekly-summary", "sideEffect": "none", "needsConfirm": false }
  ],
  "planned": { "provides": [], "contributes": [] },
  "emits": [],
  "listens": ["view:sync"],
  "domRoot": "records-weekly-summary-slot",
  "ownerKeys": ["records/sub-weekly-summary"],
  "dependsOn": []
}
```

## 3. 세포 종류 — 4가지(상민님 확정 2026-10-04)

| `kind` | 이름 | 무엇 | 지금(2026-10-04) |
| :-- | :-- | :-- | :-- |
| `organ` | 기관 | 몸 전체를 받치는 세포(신호망·발생 조절·상태·원장·면역·알림·공용 화면 부품). 능력을 **주는** 쪽 | 10 — `js/core/*` 5(event-bus·registry·store·capabilities·slots) + record-ledger·auth-safety·content-moderation·notify-engine·components |
| `tab` | 탭 세포 | 탭의 기능. `size: large` = 큰 세포(탭 하나, 작은 세포를 담고 꽂는 자리의 주인) · `size: small` = 작은 세포(큰 세포 안의 한 책임) | 25 — 큰 세포 6(`js/tabs/*/index.js`) · 작은 세포 19(`js/tabs/*/sub-*.js`). **실제로 그리는 작은 세포 2/19**(home heatmap·onescreen), 나머지는 index.html 렌더 함수에 위임하는 껍데기 |
| `hybrid` | 하이브리드 | 여러 탭·여러 자리에 걸치는 세포(`spans`) | 23 — 평면 `js/*.js`(아바타·통계·팀·템플릿·성소 엔진·시간 기록 …). `customize.js` 는 노션 지도 v0.1 에 없어 `classificationNote` 로 확인 필요 표시 |
| `future` | 미래 세포 | 자리만 있는 세포(파일 없음) | 1 — `future/ai-assistant`(AI 비서). 지금 할 일은 **모든 세포가 능력을 `capabilities` 로 드러내는 것** 하나 |

- **미분화 덩어리는 세포 종류가 아니다.** `index.html`(인라인 스크립트 38,207줄·함수 718개·전역 직접 대입 249곳)은 신고서의 `undifferentiated[]` 에 따로 적는다. 여기서 세포를 하나씩 떼어 내는 것이 지금의 모듈화다(8절).
- 신고서의 `kind` 가 이 4가지가 아니면 가드가 실패한다. 평면 `js/*.js` 를 새로 만들면 `--write` 가 `kind: unclassified` 로 올리므로 사람이 종류를 정해야 통과한다.

## 4. 연결망 — 세포끼리 맞물리는 세 가지 길

세포가 다른 세포를 부르는 길은 이 셋뿐이다. 다른 세포의 함수·변수·DOM 을 직접 만지지 않는다.

### 4-1. 신호(호르몬) = 사건 버스 `js/core/event-bus.js` (`window.OurgoalEvents`, #663)

- "체크인했다"·"목표를 끝냈다"를 퍼뜨리면 필요한 세포가 알아서 반응한다. 새 세포는 기존 코드를 고치지 않고 신호만 들으면 된다.
- 지금 있는 신호(`EVENTS`): `checkin:created` · `record:saved` · `view:sync`(변경 1종, `CHANGE_DICTIONARY`) · `tab:changed` · `state:updated` · `registry:ready` · `block:error`.
- 더할 것(발행처와 함께 `EVENTS` 에 먼저 올린다 — 발행처 없는 구독 금지, #663): `goal:completed` · `todo:checked` · `schedule:checked` · `xp:gained` · `companion:added` · `dm:received`.
- 구독은 소유자 키(`{ owner: '<세포 id>' }`)로 걸고 `dispose` 에서 `offOwner` 로 지운다. 렌더는 `requestRender(key, fn)` 로 같은 틱에 1회.

### 4-2. 신경 = 능력 등록부 `js/core/capabilities.js` (`window.OurgoalCapabilities`, 이 PR)

세포 이름이 아니라 **능력**을 요청한다. 능력을 주는 세포를 바꿔도 쓰는 세포는 깨지지 않는다.

| API | 하는 일 |
| :-- | :-- |
| `provide(name, impl, meta)` | 능력 등록. `name` 은 `영역.동작`(소문자, 예 `ui.toast`), `meta.cell` 필수, `meta.description`·`sideEffect`(`none`·`screen`·`local`·`server`·`external`)·`input`·`output`·`needsConfirm`. 한 능력에 주는 세포는 하나(다른 세포가 같은 이름 → `CAPABILITY_CONFLICT`), 같은 세포의 재등록은 바꿔 끼운다. 해제 함수를 돌려준다 |
| `request(name, requester?)` | 구현을 받는다. 없으면 **`CAPABILITY_MISSING`** 오류(찾은 이름·요청한 세포·지금 있는 능력 목록을 메시지에 담는다) |
| `call(name, ...args)` | 받아서 바로 부른다 |
| `has(name)` · `describe()` | 있는지 · 능력 기술 목록(구현 없이 meta 만, JSON 직렬화 가능 — AI 비서·상태창이 읽는다). `sideEffect: external` 은 `needsConfirm: true`(승인선에 닿는 행위는 사람 확인 없이 부르지 않는다) |
| `revoke(name, cell)` · `revokeCell(cell)` | 세포가 떨어질 때 흔적 0 |

계획된 능력(신고서 `planned.provides`): `ledger.read`·`ledger.write`·`server.sync`(record-ledger) · `ui.toast`·`ui.sheet`·`ui.confirm`(components) · `auth.session`(auth-safety) · `notify.send`(notify-engine) · `xp.award`(avatar-system) · `ai.ask`(미래 AI 비서).

### 4-3. 꽂는 자리(슬롯) `js/core/slots.js` (`window.OurgoalSlots`, 이 PR)

앱의 주요 자리에 이름을 붙이고, 세포는 그 자리에 **기여**한다. 자리의 주인(큰 세포)은 기여 목록을 받아 그릴 뿐 기여한 세포를 모른다. 하이브리드 세포는 여러 자리에 동시에 꽂힌다(예: 아바타 → `home.card` + `settings.section` + `profile.badge`). **자리 이름은 정식 목록 15곳(상민님 확정 2026-10-04)만** 쓴다 — 목록 밖 이름은 `define`·`contribute` 모두 `SLOT_NOT_ALLOWED`, 신고서의 `contributes`·`planned.contributes`·코드의 `contribute('…')` 에 있으면 가드가 실패한다. 새 자리는 상민님 확정 뒤 `js/core/slots.js` `DEFAULT_SLOTS` 에 더한다.

| API | 하는 일 |
| :-- | :-- |
| `define(slot, meta)` | 정식 목록 안 자리의 설명(meta) 보태기. 15곳은 미리 있다. 목록 밖 이름 → `SLOT_NOT_ALLOWED` |
| `contribute(slot, cellId, render, meta)` | 기여. 같은 (자리, 세포)는 바꿔 끼운다. 목록 밖 자리 → **`SLOT_NOT_ALLOWED`**. `meta.order` 작을수록 앞 |
| `list(slot)` · `collect(slot, ctx)` | 기여 목록(order·세포 id 순) · (미래 자리는 빈 목록 — 등록만 받는다) 기여마다 `render(ctx)` 를 수밀 격벽 안에서 불러 `[{cellId, ok, value|error}]`(하나가 실패해도 나머지는 그리고 `block:error` 신호) |
| `withdraw(slot, cellId)` · `withdrawCell(cellId)` · `slots()` | 떼어내기 · 자리 목록과 기여 수 |

정식 자리 15곳(이름은 영문 키, 설명은 한글, 주인 = 그 자리를 그리는 세포):

| 키 | 설명 | 주인 |
| :-- | :-- | :-- |
| `home.card` | 홈 한 화면 카드 | home/index |
| `home.detail` | 홈 자세히 보기 | home/index |
| `checkin.after` | 체크인 직후 | index-html(체크인 저장 흐름 — 세포로 떼어 내면 옮긴다) |
| `record.type` | 기록 종류 | records/index |
| `stats.card` | 통계 카드 | universal-stats |
| `goal.template` | 목표 템플릿 | goals/index |
| `goal.detail` | 목표 상세 칸 | goals/index |
| `calendar.source` | 캘린더에 올라오는 것 | calendar/index |
| `feed.card` | 피드 카드 종류 | comm/index |
| `reaction.kind` | 반응 종류 | reactions |
| `notification.kind` | 알림 종류 | notify-engine |
| `settings.section` | 설정 묶음 | settings/index |
| `profile.badge` | 프로필 배지 | settings/sub-profile |
| `share.format` | 공유 형식 | viral-sharing |
| `assistant.skill` | AI 비서 기술(미래 — 등록만 허용, 그리지 않는다) | future/ai-assistant |

### 4-4. 지금 상태(정직하게)

- `capabilities.js`·`slots.js` 는 이 PR 에서 **`index.html` 에 붙이지 않았다**(제품 동작 변화 0, `index.html`·`js/tabs/**` 수정 금지 — 설정 탭 이전 세션 작업 중). 단위 시험(`tests/core-capabilities-slots.test.js`)과 스캐폴드 시험에서만 돈다. **첫 사용처는 설정 탭 시범 이전(TASK-ES-354)의 `settings.section`** 이다. 그 PR 이 `<script src="js/core/capabilities.js">`·`slots.js` 를 `js/core/registry.js` 다음에 붙인다.
- 레지스트리의 사본 보관 틈: `OurgoalRegistry.registerSubBlock(megaId, subId, config)` 는 `config` 를 그대로 두지 않고 칸을 골라 **새 객체(사본)** 를 만들어 보관한다(`js/core/registry.js` `subConfig`). 그래서 레지스트리 쪽 사본의 `mount` 를 부르면 `this` 가 원래 블록이 아니라 사본을 가리켜 `this.dispose`·`this.render` 가 없다. 지금은 레지스트리가 작은 세포를 직접 마운트하는 경로가 없고(큰 세포가 자기 `subBlocks` 의 원본을 부른다) 실제 결함으로 드러나지 않는다. 이 PR 은 기존 코드를 고치지 않는다는 지시에 따라 **명시만** 한다. 고칠 때(레지스트리가 작은 세포를 직접 마운트하게 될 때): 사본 대신 원본 참조를 `subConfig.block` 에 두고 `subConfig.block.mount.call(subConfig.block, …)` 로 부른다. 스캐폴드 시험은 이 틈을 피해 `entry.mount === block.mount` 로 등록만 확인하고 마운트는 큰 세포 경유로 본다.
- TASK-ES-354 가 만드는 `js/core/ui-helpers.js`(공용 화면 헬퍼)는 이 청사진의 「공용 화면 부품 = 기관」에 해당한다. 지금은 `js/core/` 아래에 두되, `ui.*` 능력으로 `provides` 하는 것이 목표다(UI-COMPONENTS.md).

## 5. 계층과 의존 방향

| 계층 | 디렉터리 | 무엇 | 참조해도 되는 것 |
| :-- | :-- | :-- | :-- |
| core(기관 골격) | `js/core/` | 신호망·발생 조절·상태·능력 등록부·꽂는 자리 | 없음(자기들끼리만, 전역은 `window.Ourgoal*` 한 통로로 노출) |
| services(기관) | `js/services/`(새로) | 서버 통신·원장·외부 API | core |
| ui(기관) | `js/ui/`(새로) | 공용 화면 부품(토스트·시트·확인창·칩·모달) | core |
| tabs(큰·작은 세포) | `js/tabs/<탭>/` | 탭별 기능 | core · services · ui — **능력 요청·신호·자리로만**. 다른 탭(`js/tabs/<다른 탭>/`)의 심볼·경로·블록 id 는 직접 참조 금지(가드 ⑤) |
| app(부팅) | `js/app/`(새로) | 부팅·라우팅(`setTab`) — 지금은 index.html 안 | 모두 |
| 평면 `js/*.js` | (옛 자리) | 하이브리드·일부 기관. 신고서에 `kind` 를 적고, 분열·이전하면서 위 계층으로 옮긴다 | — |

- 아래 계층만 참조한다. 같은 계층의 다른 세포는 능력·신호·자리로만.
- **전역 노출 원칙**: `window` 에 새 이름을 다는 것은 core 의 한 통로(`OurgoalEvents`·`OurgoalRegistry`·`OurgoalStore`·`OurgoalCapabilities`·`OurgoalSlots`)뿐이다. 새 세포는 `window.X =` 를 쓰지 않는다(가드 ③ 은 늘면 실패). 옛 코드가 서로 부르던 전역(`window.toast` 등)은 해당 능력(`ui.toast`)이 생기면 그것으로 바꾸고 줄인다.
- **이름 규칙**: 탭·세포 파일은 kebab-case(`sub-weekly-summary.js`), 세포 id 는 `<탭>/sub-<이름>`(평면은 파일 이름), 능력·자리 이름은 `영역.동작` 소문자(`ledger.read`, `home.card`), 신호는 `대상:동작`(`goal:completed`), 구독 소유자 키는 세포 id.
- **파일 크기**: 800줄은 **상한**이지 나누는 기준이 아니다(헌법 제3조 제9항). 나누는 기준은 **책임 단위** — 책임이 둘 이상이거나, 같은 파일 충돌이 반복되거나, 800줄에 가까워지면 분열한다. 줄 수로 자르지 않는다.

## 6. 세포의 삶 — 개발 과정의 규칙

| 활동 | 언제 | 어떻게 | 결정 |
| :-- | :-- | :-- | :-- |
| 추가 | 새 기능 | `node scripts/new-module.js <탭> <이름> [--provides …] [--contributes …]` → 신고서 작성 → 자리에 기여 → 신호에 반응. **기존 세포 코드는 고치지 않는다** | 작업 세션 |
| 분열 | 800줄에 가까워짐 · 책임 2개 이상 · 같은 파일 충돌 반복 | 책임 단위로 나누고 전후 실측 차이 0(tab-check·tab-compare). 절차: MODULE-SPLIT-PROTOCOL(TASK-ES-354) | 작업 세션 |
| 융합 | 같은 일을 하는 세포가 여럿(토스트 6·리캡 3·타이머 4 — 9절) | 하나로 합치고(능력으로 `provides`), 나머지는 그 능력을 `request` 한다 | 작업 세션(화면에서 기능이 사라지면 상민님) |
| 소멸 | 기능을 없앨 때 | 연결 해제(`dispose`·`revokeCell`·`withdrawCell`) → 데이터 이전·보관 → 흔적 0 검사 → 신고서 삭제(가드가 "신고서만 남은 세포"를 실패시킨다) | **상민님** |
| 재편 | 구조 자체를 바꿀 때 | 연결을 코드가 아니라 신고서(`provides`·`requires`·`contributes`)에 적어 두어, 신고서를 바꾸면 구조가 다시 짜인다 | **상민님 협의** |

### 6-1. 새 기능 추가 절차(작은 세포)

1. `node scripts/new-module.js <탭> <이름> [--provides <영역.동작>] [--contributes <자리>]` — 세포 파일(`CELL`·`ABILITIES`·`mount`/`render`/`bindEvents`/`dispose`/`provideAbilities`/`contributeSlots`), 시험 뼈대(`tests/module-<탭>-<이름>.test.js`), 신고서 항목(`modules.json`)이 생긴다.
2. 출력이 알려 주는 `<script>` 한 줄을 `index.html` 의 `js/tabs/<탭>/index.js` 다음에 넣는다(스크립트는 index.html 을 고치지 않는다).
3. `render()` 에 실제 그리기를 넣고 **그렸을 때만 `true`**. 능력 구현(`ABILITIES[…].impl`)과 `capabilities[].description` 을 실제 기능으로 바꾼다(처음엔 `ready: false` 를 정직하게 돌려준다).
4. 다른 세포가 필요하면 `requires` 에 능력 이름을 적고 `OurgoalCapabilities.request(…)` 로 받는다. 그 능력을 아무도 주지 않으면 가드가 실패한다 → 주는 세포를 먼저 만든다.
5. `node tests/module-<탭>-<이름>.test.js` → `node scripts/module-specs.js --write` → `npm test`(모듈 가드 포함).

새 큰 세포(탭)·새 기관은 같은 신고서 형식으로 `modules.json` 에 손으로 올린다(스캐폴드는 작은 세포만). 평면 `js/*.js` 를 새로 만들면 `--write` 가 `kind: unclassified` 로 올리고 가드가 실패시킨다 — 사람이 4가지 중 종류를 정한다.

### 6-2. 세포 단위 검증

| 수준 | 도구 | 무엇을 보나 |
| :-- | :-- | :-- |
| 글자 | `node scripts/module-guard.js`(npm test 경로) | 래칫 ①~⑤ · 신고서 검증 |
| 부품 | `tests/module-<탭>-<이름>.test.js`, `tests/core-capabilities-slots.test.js` | 레지스트리 경유 마운트 · 구독 1개 · 능력·자리 · dispose 흔적 0 |
| PC 화면 | `node docs/design/harness/tab-check.js <APP_DIR> <out> <탭>` (#664) + `tab-compare.js` | 탭×테마×화면 크기 촬영·Dead-Click 후보·전후 차이 0 |
| 진짜 계정끼리 | `docs/design/harness/real-account-check.js` (#665, [손 필요] 계정 2개) | 두 계정 사이 주고받기(RLS·Realtime) |

판정은 위 어느 것도 아니다 — 법정(`node court/chat.js <PR>`)만 낸다.

## 7. 모듈 가드 — 래칫(우상향 장치)

`scripts/module-guard.js` 는 `npm test` → `scripts/test-shipyard-modular.js` [Test 6] 에서 돈다(`package.json` scripts 는 동결이라 새 npm 스크립트를 만들지 않았다).

| 지표 | 정의(스크립트) | 기준선 | 규칙 |
| :-- | :-- | --: | :-- |
| ① 인라인 스크립트 줄 | index.html 의 src 없는 `<script>` 본문 줄 수 | 38,207 | 늘면 실패 |
| ② index.html 함수 선언 | 인라인 스크립트의 `function 이름(` 수(이름 붙은 함수 식 포함) | 718 | 늘면 실패 |
| ③ 전역 직접 대입 | index.html·ui.js·js/** 의 `window.이름 =`·`window['이름'] =`(주석 줄 제외) | 282 | 늘면 실패 |
| ④ 800줄 초과 js | js/** 의 800줄 초과 파일 수 + 파일별 줄 수(법정 `court/lib/new-debt.js` 와 같은 셈) | 12 | 수가 늘거나 · 새 파일이 넘거나 · 이미 넘던 파일이 길어지면 실패 |
| ⑤ 탭 간 직접 참조 | js/tabs/A 가 js/tabs/B 의 심볼(`Ourgoal<B>…`·B 가 단 전역)·경로(`tabs/B/`)·블록 id(`getBlock('B'` …)를 참조한 수 | 0 | 늘면 실패 |
| 신고서 | 신고서 없는 세포 · 신고서만 남은 세포 · 종류가 4가지(organ·tab·hybrid·future) 밖 · 탭 세포 size 없음 · `requires` 를 아무도 안 줌 · 능력 주인 둘 · 데이터(`owns`) 주인 둘 · 정식 목록 15곳 밖 자리(`contributes`·`planned.contributes`·코드의 `contribute`) · index.html 이 `undifferentiated` 에 없음 | — | 실패 |
| 신고서(경고) | 신호(`emits`·`listens`)·`domRoot` 불일치 · 코드의 `provide`/`request`/`contribute` 가 신고서에 없음 · 능력 기술 없음 | — | 경고(실패 아님) |

- 줄면 통과하고 "기준선을 낮출 수 있다"고 알린다 → `node scripts/module-guard.js --update` 로 낮춘다(사유 불필요).
- 늘려야만 하면 `--update --reason "<20자 이상 사유>"`. 기준선 파일 `docs/architecture/module-baseline.json` 의 `history` 에 사유와 함께 남고, **사유 없이 손으로 올린 이력은 가드가 실패시킨다**.
- 가드 자체의 시험: `tests/module-guard.test.js`(통과 1 · ①④⑤ 실패 3 · 래칫 1 · 신고서 1), `tests/new-module.test.js`(스캐폴드).

## 8. 이전 지도 — 쪼개는 순서(상민님 확정 2026-10-04)와 6개월 목표

각 단계의 완료 기준은 지표 숫자다. 기준선은 줄어드는 방향으로만 갱신한다. 기간은 추정이다(근거: 설정 탭 시범 1건 규모에서 미룬 값).

| 순서 | 대상 | 하는 일 | 측정 지표(완료 기준) |
| :-- | :-- | :-- | :-- |
| 0 | 골격(이 PR) | 신고서 59세포+미분화 1·능력 등록부·꽂는 자리 15곳·래칫 가드·지표·스캐폴드 | 가드 통과, 지표 산출 |
| 1 | **설정** (TASK-ES-354) | 설정 탭 렌더를 `js/tabs/settings/` 로 이전, `capabilities.js`·`slots.js` 를 index.html 에 붙이고 `settings.section` 첫 기여 | ① 감소(설정 렌더 줄만큼) · 설정 작은 세포 실제로 그림 · tab-compare 차이 0 |
| 2 | **공용 화면 부품** (토스트 6벌·모달·시트) | `js/ui/` 한 벌로 융합해 `ui.toast`·`ui.sheet`·`ui.confirm` 제공(UI-COMPONENTS.md 순서) | 중복 세포 토스트 6→0·모달 연결 통로 4→0·직접 만든 덮개 9→0 · ③ 감소 |
| 3 | **기록·일정** | 기록 → 일정 탭 렌더를 작은 세포로 이전, `record.type`·`calendar.source` 자리, 타이머 4종·리캡 3곳 융합 | 실제로 그리는 작은 세포 +6 · 타이머 4→1 · 리캡 3→1 · ①·② 감소 |
| 4 | **팀** | team-invite-comm·linked-goals·leader-check·visibility 를 책임 단위로 분열(실계정 확인 #665 하네스로 전후 비교) | ④ 4개 감소 · 모달·토스트 통로 0 |
| 5 | **아바타·EXP** (7,351줄) | 책임 단위 분열, `xp.award` 능력·`home.card`·`settings.section`·`profile.badge` 기여 | ④ 감소 · EXP 원장 하나(CORE-03 M01) |
| 6 | **홈** | 홈 렌더를 작은 세포로, `home.card`·`home.detail` 의 주인 | 홈 작은 세포 전부 실제로 그림 · ① 감소 |
| 7 | **데이터 파일** (goal-templates-data 3,526·registry 2,815 등) | 데이터와 로직을 나누고 `goal.template` 자리로 연결 | ④ 0 |
| 목표 | 6개월 | index.html 에는 마크업과 부팅 한 줄만 | ① 0 · ② 0 · ③ 기관 통로만 · ④ 0 · 실제로 그리는 작은 세포 전부 · 데이터 중복 저장 0 |

원장(데이터 중복 저장 16항목, CORE-03 #660)은 각 단계에서 그 탭의 항목을 `ledger.read`·`ledger.write` 로 옮기며 줄인다.

## 9. 건강 지표 (항상성 — 숫자가 한 방향으로만)

`node scripts/module-metrics.js` 의 `health` 칸(노션 6절 표와 같은 항목). 오늘 값은 `docs/architecture/metrics-2026-10-04.json`.

| 지표 | 정의 | 오늘 | 6개월 목표 |
| :-- | :-- | --: | :-- |
| 미분화 덩어리 | ① index.html 인라인 스크립트 줄 | 38,207 | 0 |
| 전역 직접 연결 | ③ `window.이름 =` 직접 대입 | 282 | 기관 한 통로만 |
| 800줄 넘는 세포 | ④ | 12 | 0 |
| 실제로 그리는 작은 세포 | `js/tabs/*/sub-*.js` 중 자기 코드가 DOM 을 쓰는 것(innerHTML·textContent 대입·createElement·insertAdjacentHTML·appendChild) | 2/19 | 전부 |
| 같은 일을 하는 중복 세포 | 정의 서명 수: 토스트 연결 통로(index.html 밖 `function toast`/`showToast`/`toastFn`) · 리캡 창(`…Recap…Modal`) · 타이머 화면(`render…Timer/Stopwatch…`·`update…TimerDisplay`·`handle…StopwatchToggle`) · (참고) 모달 연결 통로 · 직접 만든 전체 화면 덮개 · 기본 `confirm()` 호출 | 토스트 6 · 리캡 3 · 타이머 4 (참고: 모달 통로 4 · 덮개 9 · confirm 41) | 1벌씩 |
| 데이터 중복 저장 | 원장 설계서(#660) 1절 지도표 "중복 저장 = 예" 행 수 | 16 | 0 |

## 10. 진척 지표 출력 형식과 양비스 상태창 연결

- `node scripts/module-metrics.js` — 전체 JSON(`schema: ourgoal.module-metrics/1`): `health`(위 표) · `ratchet`(①~⑤) · `info`(파일별 내역·중복 세포 위치·데이터 중복 항목 id) · `summary`.
- `node scripts/module-metrics.js --card` — 상태창 카드 한 장:

```json
{ "measuredAt": "2026-10-04", "card": "ourgoal-cell-health", "title": "아워골 세포 건강",
  "rows": [ { "key": "undifferentiatedLines", "label": "미분화 덩어리(index.html 스크립트 줄)", "value": 38207, "goal": 0, "dir": "down" }, "…6행" ],
  "ratchet": { "inlineScriptLines": 38207, "indexFunctionDecls": 718, "windowAssignments": 282, "oversizeJsFiles": 12, "crossTabRefs": 0 },
  "cells": { "moduleCount": 30, "moduleAvgLines": 122 } }
```

- 양비스(커맨드센터) 연결 방법 — **이 PR 범위 밖**(C:/dev/command-center 는 고치지 않았다): 커맨드센터 쪽 수집기가 `git -C C:/dev/ourgoal-app show origin/main:…` 로 받은 트리(또는 main 작업 트리)에서 `node scripts/module-metrics.js --card` 를 실행해 `rows` 를 그대로 상태창 칸에 싣는다. `dir` 은 좋아지는 방향(`down`/`up`), 이전 값과 비교해 화살표를 그린다. 값을 손으로 옮기지 않는다.
- 시각화 페이지 「아워골 세포 지도」의 상단 숫자 5칸은 같은 `--card` 의 `rows` 값으로 갱신한다.

## 11. 상민님께 판단 받을 것

- `customize.js`(홈 구성 켜기/끄기)는 노션 지도에 없어 하이브리드로 임시 분류했다 — 맞는지.
- (확정됨 2026-10-04) 세포 종류 4가지·꽂는 자리 15곳·쪼개는 순서 7단계. 새 자리·새 종류가 필요하면 그때 상민님 확정.
- 각 세포의 계획된 능력·자리(`planned`)가 맞는지(7절 목록).
