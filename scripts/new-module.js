#!/usr/bin/env node
/**
 * 새 세포 스캐폴드 (#TASK-ES-356 · 노션 CORE-08 · [청사진] 아워골 세포 골격 v0.1 5절 「추가」)
 *
 * 사용: node scripts/new-module.js <tab> <name> [--provides <능력>[,<능력>…]] [--contributes <자리>[,<자리>…]] [--root <저장소>]
 *   예) node scripts/new-module.js records weekly-summary --provides records.weekly-summary --contributes record.type
 *   → js/tabs/records/sub-weekly-summary.js      작은 세포(kind tab · size small): 신고서(CELL)·능력 기술(ABILITIES)·mount/render/bindEvents/dispose
 *   → tests/module-records-weekly-summary.test.js 시험 뼈대: 레지스트리 경유 마운트·능력 요청·자리 기여·dispose 흔적 0
 *   → docs/architecture/modules.json             세포 신고서에 이 세포 항목을 더한다(kind tab·size small, provides·contributes·capabilities 포함)
 *   index.html 은 고치지 않는다 — 넣을 <script> 줄과 다음 할 일을 출력으로 안내만 한다.
 *
 * 만든 세포의 약속(docs/architecture/MODULE-BLUEPRINT.md 「세포의 삶 — 추가」):
 *   - window 에 새 이름을 달지 않는다. 같은 탭 큰 세포(registerSubBlock) → 없으면 코어 레지스트리로 등록한다.
 *   - 다른 세포의 내부를 만지지 않는다: 신호(OurgoalEvents)·신경(OurgoalCapabilities)·꽂는 자리(OurgoalSlots)로만 맞물린다.
 *   - 구독·능력·기여는 소유자 키 '<tab>/sub-<name>' 로 걸고, mount 때 dispose 로 이전 것을 먼저 지운다(흔적 0).
 *   - render 는 실제로 그렸을 때만 true — 빈 세포는 false 라서 큰 세포의 기존 렌더 폴백을 막지 않는다.
 *   - 능력 구현(ABILITIES[…].impl)은 처음엔 '아직 없음'을 정직하게 돌려준다. 기능을 넣을 때 바꾼다.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const NAME_RE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const CAP_RE = /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9-]*)+$/;

function camel(s) {
  return s.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
}

// js/tabs/<tab>/index.js 가 global 에 다는 큰 세포 이름(예: OurgoalRecordsMegaBlock)
function megaGlobalOf(root, tab) {
  const p = path.join(root, 'js', 'tabs', tab, 'index.js');
  if (!fs.existsSync(p)) return null;
  const m = /\bglobal\.(Ourgoal[A-Za-z0-9_]*MegaBlock)\s*=/.exec(fs.readFileSync(p, 'utf8'));
  return m ? m[1] : null;
}

function cellIdOf(tab, name) {
  return tab + '/sub-' + name;
}

function declarationOf(tab, name, provides, contributes) {
  return {
    id: cellIdOf(tab, name),
    kind: 'tab',
    size: 'small',
    provides: provides.slice(),
    requires: [],
    contributes: contributes.slice(),
    emits: [],
    listens: ['view:sync'],
    owns: [],
    capabilities: provides.map(p => ({ name: p, description: '(담당을 한 줄로 고쳐 적는다) ' + p, sideEffect: 'none', needsConfirm: false }))
  };
}

function moduleSource(tab, name, megaGlobal, decl) {
  const owner = decl.id;
  const slot = tab + '-' + name + '-slot';
  const abilities = decl.capabilities.map(c => `    '${c.name}': {
      description: '${c.description}',
      sideEffect: '${c.sideEffect}',
      // 기능을 넣을 때 구현을 바꾼다. 지금은 '아직 없음'을 정직하게 돌려준다.
      impl: function () { return { cell: CELL.id, ability: '${c.name}', ready: false }; }
    }`).join(',\n');
  return `/**
 * OurGoal ${camel(tab)} Cell: ${camel(name)} (담당을 한 줄로 고쳐 적는다)
 *
 * @module ${owner}
 * @role ${tab} 탭 ${name} 작은 세포 — 담당을 한 줄로 고쳐 적는다
 * @kind tab (size small — 작은 세포)
 * @domRoot ${slot}
 * 신고서: 아래 CELL 과 docs/architecture/modules.json 의 같은 id 항목(둘을 같게 둔다 — 가드가 신호 불일치를 경고한다).
 * 규칙: docs/architecture/MODULE-BLUEPRINT.md — 다른 세포 내부를 만지지 않는다. 신호·능력 요청·꽂는 자리로만 맞물린다. window 에 새 이름 대입 금지.
 * 명세 갱신: node scripts/module-specs.js --write · 검사: npm test(모듈 가드)
 */
(function (global) {
  'use strict';

  // 세포 신고서(세포막): 주는 능력·필요한 능력·기여하는 자리·내보내는 신호·받는 신호·주인인 데이터
  var CELL = ${JSON.stringify(decl, null, 2).replace(/\n/g, '\n  ')};

  // 능력 기술(리보솜): 기계가 읽는 "나는 이런 일을 할 수 있다" — 나중에 AI 비서 세포가 그대로 쓴다
  var ABILITIES = {
${abilities}
  };

  var block = {
    id: 'sub-${name}',
    cell: CELL,
    megaBlockId: '${tab}',
    name: '${camel(name)}',
    containerId: '${slot}',
    mountCount: 0,

    /**
     * 마운트: 이전 흔적 해제 → 능력 등록 → 자리 기여 → 그리기 → 신호 구독. 실제로 그렸을 때만 true.
     * @param {HTMLElement|null} container
     * @param {Object} state
     * @param {Object} events
     * @returns {boolean}
     */
    mount: function (container, state, events) {
      this.dispose(events);
      this.mountCount++;
      this.provideAbilities();
      this.contributeSlots(container);
      var drew = this.render(container, state) === true;
      this.bindEvents(events, container);
      return drew;
    },

    /** 능력 등록(신경) — 능력 등록부가 없는 화면(아직 index.html 미연결)에서는 건너뛴다 */
    provideAbilities: function () {
      var caps = global.OurgoalCapabilities;
      if (!caps || typeof caps.provide !== 'function') return 0;
      Object.keys(ABILITIES).forEach(function (capName) {
        var a = ABILITIES[capName];
        caps.provide(capName, a.impl, { cell: CELL.id, description: a.description, sideEffect: a.sideEffect });
      });
      return Object.keys(ABILITIES).length;
    },

    /** 꽂는 자리 기여 — 자리의 주인(큰 세포)이 OurgoalSlots.list(자리) 로 받아 그린다 */
    contributeSlots: function (container) {
      var slots = global.OurgoalSlots;
      if (!slots || typeof slots.contribute !== 'function') return 0;
      var self = this;
      CELL.contributes.forEach(function (slotName) {
        slots.contribute(slotName, CELL.id, function (ctx) { return self.render(container, ctx && ctx.state); });
      });
      return CELL.contributes.length;
    },

    /**
     * 이 세포가 건 구독·능력·기여 전부 해제(흔적 0)
     * @param {Object} events
     */
    dispose: function (events) {
      var ev = events || global.OurgoalEvents;
      if (ev && typeof ev.offOwner === 'function') ev.offOwner(CELL.id);
      if (global.OurgoalCapabilities && typeof global.OurgoalCapabilities.revokeCell === 'function') global.OurgoalCapabilities.revokeCell(CELL.id);
      if (global.OurgoalSlots && typeof global.OurgoalSlots.withdrawCell === 'function') global.OurgoalSlots.withdrawCell(CELL.id);
    },

    /**
     * 그리기. 아직 그리는 것이 없으면 false — 큰 세포가 기존 렌더로 폴백한다.
     * @param {HTMLElement|null} container
     * @param {Object} state
     * @returns {boolean}
     */
    render: function (container, state) {
      if (!container || !state) return false;
      return false;
    },

    /**
     * 변경 신호(view:sync) 1종만 소유자 키로 구독하고, 같은 틱 요청은 세포 id 로 합쳐 1회만 그린다.
     * @param {Object} events
     * @param {HTMLElement|null} container
     */
    bindEvents: function (events, container) {
      var ev = events || global.OurgoalEvents;
      if (!ev || typeof ev.on !== 'function') return;
      var self = this;
      ev.on('view:sync', function (payload) {
        var draw = function () { self.render(container, payload && payload.state); };
        if (typeof ev.requestRender === 'function') ev.requestRender(CELL.id, draw);
        else draw();
      }, { owner: CELL.id });
    }
  };

  // 등록: 같은 탭 큰 세포가 먼저 로드됐으면 그것에(그 큰 세포가 레지스트리에도 올린다), 아니면 코어 레지스트리에.
  var mega = global.${megaGlobal};
  if (mega && typeof mega.registerSubBlock === 'function') {
    mega.registerSubBlock(block);
  } else if (global.OurgoalRegistry && typeof global.OurgoalRegistry.registerSubBlock === 'function') {
    global.OurgoalRegistry.registerSubBlock('${tab}', block.id, block);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = block;
  }
})(typeof window !== 'undefined' ? window : globalThis);
`;
}

function testSource(tab, name, decl) {
  const owner = decl.id;
  const capChecks = decl.provides.map(p => `assert.strictEqual(caps.request('${p}')().ready, false, '능력 ${p} 을 요청할 수 있다(아직 없음을 정직하게 돌려줌)');`).join('\n');
  const slotChecks = decl.contributes.map(s => `assert.ok(slots.list('${s}').some(x => x.cellId === '${owner}'), '자리 ${s} 에 기여한다');`).join('\n');
  const capGone = decl.provides.map(p => `assert.throws(() => caps.request('${p}'), /CAPABILITY_MISSING|주는 세포가 없다/, 'dispose 후 능력 ${p} 흔적 0');`).join('\n');
  const slotGone = decl.contributes.map(s => `assert.ok(!slots.list('${s}').some(x => x.cellId === '${owner}'), 'dispose 후 자리 ${s} 흔적 0');`).join('\n');
  return `'use strict';
// 세포 시험 뼈대 — node scripts/new-module.js ${tab} ${name} 이 만들었다(#TASK-ES-356).
// 레지스트리 경유 마운트·구독 1개·능력 요청·자리 기여·dispose 흔적 0 을 본다. 기능을 넣으면 여기에 시험을 더한다.
const assert = require('assert');
const path = require('path');

const root = path.join(__dirname, '..');
const events = require(path.join(root, 'js/core/event-bus.js'));
const registry = require(path.join(root, 'js/core/registry.js'));
const caps = require(path.join(root, 'js/core/capabilities.js'));
const slots = require(path.join(root, 'js/core/slots.js'));
const mega = require(path.join(root, 'js/tabs/${tab}/index.js'));
mega.init();
const block = require(path.join(root, 'js/tabs/${tab}/sub-${name}.js'));

const entry = registry.getBlock('${tab}', block.id);
assert.ok(entry && entry.mount === block.mount, '레지스트리에 ${owner} 세포가 등록된다');
assert.strictEqual(mega.subBlocks[block.id], block, '${tab} 큰 세포 안에 들어간다');
assert.strictEqual(block.cell.id, '${owner}', '신고서 id');

registry.mount('${tab}', null, { profile: {} });
assert.strictEqual(block.mountCount, 1, '레지스트리 mount 1회에 세포 mount 1회');
const mine = () => events.subscriptions().filter(s => s.owner === '${owner}').length;
assert.strictEqual(mine(), 1, '구독은 소유자 키로 1개');
${capChecks}
${slotChecks}

registry.mount('${tab}', null, { profile: {} });
assert.strictEqual(block.mountCount, 2, '다시 마운트해도 동작');
assert.strictEqual(mine(), 1, '다시 마운트해도 구독은 1개(쌓이지 않음)');

block.dispose(events);
assert.strictEqual(mine(), 0, 'dispose 후 구독 0');
${capGone}
${slotGone}

console.log('✓ cell ${owner}: 레지스트리 마운트·구독 1개·능력·자리·dispose 흔적 0 확인');
`;
}

function addDeclaration(root, decl, rel) {
  const specs = require('./module-specs');
  const declared = specs.readDeclared(root) || { schema: 'ourgoal.cells/1', cells: [] };
  declared.cells = declared.cells.filter(c => c.id !== decl.id);
  declared.cells.push(Object.assign({ file: rel, layer: 'tabs', tab: decl.id.split('/')[0], role: null, spans: [], planned: { provides: [], contributes: [] } }, decl));
  const merged = specs.merge(root, declared);
  specs.writeSpec(root, merged);
}

function parseList(v) {
  return String(v || '').split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * 파일 생성. 돌려주는 값: { ok, files, message }
 * @param {string} root
 * @param {string} tab
 * @param {string} name
 * @param {{provides?: string[], contributes?: string[], writeSpec?: boolean}} [opts]
 */
function generate(root, tab, name, opts) {
  const o = Object.assign({ provides: [], contributes: [], writeSpec: true }, opts || {});
  if (!tab || !name) return { ok: false, message: '사용법: node scripts/new-module.js <tab> <name> [--provides a.b] [--contributes x.y]' };
  if (!NAME_RE.test(tab) || !NAME_RE.test(name)) return { ok: false, message: `이름 규칙 위반: tab·name 은 소문자·숫자·하이픈(kebab-case) — 받은 값 ${tab} ${name}` };
  const bad = o.provides.concat(o.contributes).filter(x => !CAP_RE.test(x));
  if (bad.length) return { ok: false, message: `능력·자리 이름은 '영역.동작'(소문자) 형식 — 틀린 값 ${bad.join(', ')}` };
  const allowed = require(path.join(root, 'js', 'core', 'slots.js')).ALLOWED;
  const badSlots = o.contributes.filter(x => !allowed.includes(x));
  if (badSlots.length) return { ok: false, message: `꽂는 자리 ${badSlots.join(', ')} 는 정식 목록 15곳에 없다 — ${allowed.join(', ')}` };
  const megaGlobal = megaGlobalOf(root, tab);
  if (!megaGlobal) return { ok: false, message: `js/tabs/${tab}/index.js(큰 세포)가 없다 — 새 탭은 청사진 「새 큰 세포 추가」 절차를 따른다` };
  const modRel = `js/tabs/${tab}/sub-${name}.js`;
  const testRel = `tests/module-${tab}-${name}.test.js`;
  for (const rel of [modRel, testRel]) {
    if (fs.existsSync(path.join(root, rel))) return { ok: false, message: `이미 있다: ${rel}` };
  }
  const decl = declarationOf(tab, name, o.provides, o.contributes);
  fs.writeFileSync(path.join(root, modRel), moduleSource(tab, name, megaGlobal, decl), 'utf8');
  fs.mkdirSync(path.join(root, 'tests'), { recursive: true });
  fs.writeFileSync(path.join(root, testRel), testSource(tab, name, decl), 'utf8');
  if (o.writeSpec) addDeclaration(root, decl, modRel);
  const guide = [
    `✓ 만들었다: ${modRel}`,
    `✓ 만들었다: ${testRel}`,
    o.writeSpec ? `✓ 세포 신고서에 더했다: docs/architecture/modules.json (${decl.id})` : '',
    '',
    '다음 할 일(index.html 은 이 스크립트가 고치지 않는다):',
    `  1. index.html 의 <script src="js/tabs/${tab}/index.js"></script> 바로 다음 줄에 넣는다:`,
    `       <script src="js/tabs/${tab}/sub-${name}.js"></script>`,
    '     (능력·자리를 쓰면 js/core/capabilities.js·js/core/slots.js 가 js/core/registry.js 다음에 붙어 있어야 한다)',
    `  2. render() 에 실제 그리기를 넣고, 그렸을 때만 true 를 돌려준다. DOM 루트 id: ${tab}-${name}-slot`,
    '  3. ABILITIES 의 impl·description 을 실제 기능으로 바꾸고 modules.json 의 capabilities 설명도 같게 고친다',
    `  4. node ${testRel} — 시험 통과 확인, 기능 시험을 더한다`,
    '  5. npm test — 모듈 가드(늘면 실패·신고서 검증) 포함'
  ].filter(l => l !== '');
  return { ok: true, files: [modRel, testRel], decl, message: guide.join('\n') };
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const opts = { provides: [], contributes: [] };
  let root = path.join(__dirname, '..');
  const pos = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root') root = path.resolve(argv[++i]);
    else if (argv[i] === '--provides') opts.provides = parseList(argv[++i]);
    else if (argv[i] === '--contributes') opts.contributes = parseList(argv[++i]);
    else if (!argv[i].startsWith('--')) pos.push(argv[i]);
  }
  const r = generate(root, pos[0], pos[1], opts);
  (r.ok ? console.log : console.error)(r.message);
  process.exit(r.ok ? 0 : 1);
}

module.exports = { generate, moduleSource, testSource, megaGlobalOf, declarationOf, cellIdOf };
