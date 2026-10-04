#!/usr/bin/env node
/**
 * 세포 신고서 추출·병합·검증 (#TASK-ES-356 · 노션 CORE-08 · [청사진] 아워골 세포 골격 v0.1)
 *
 * 사용:
 *   node scripts/module-specs.js            — 코드에서 뽑은 실제 값과 신고서를 합친 결과를 표준 출력에 JSON 으로 낸다(파일은 안 고침)
 *   node scripts/module-specs.js --write    — docs/architecture/modules.json 을 갱신한다.
 *                                             손으로 정하는 칸(kind·role·spans·provides·requires·contributes·owns·capabilities·planned)은 보존하고, size 는 경로로 정한다(탭 index.js=large, 그 밖의 탭 파일=small).
 *                                             코드에서 뽑는 칸(emits·listens·domRoot·ownerKeys·dependsOn)은 실제 값으로 다시 쓴다.
 *                                             신고서에 없던 파일은 기본값으로 올린다(평면 js 는 kind 'unclassified' → 가드가 실패시킨다: 사람이 종류를 정한다).
 *   node scripts/module-specs.js --check    — 검증 결과(실패·경고)를 출력한다(종료 코드 0). 실패 판정은 module-guard.js 가 한다.
 *
 * 세포 = js/**.js 파일 하나 + 파일 없는 미래 세포. index.html 은 세포가 아니라 미분화 덩어리(undifferentiated[])로 따로 적는다.
 * 세포 종류 4가지(상민님 확정 2026-10-04): organ(기관) · tab(탭 — size large=큰 세포 / small=작은 세포) · hybrid(하이브리드) · future(미래)
 * 꽂는 자리 이름은 js/core/slots.js 의 정식 목록 15곳만 — contributes·planned.contributes 에 목록 밖 이름이 있으면 실패.
 * 신고서 칸(docs/architecture/MODULE-BLUEPRINT.md 「세포의 해부」):
 *   id · file · kind · size(tab 만) · layer · tab · role · spans(걸치는 탭)
 *   provides(주는 능력) · requires(필요한 능력) · contributes(기여하는 자리) · emits(내보내는 신호) · listens(받는 신호)
 *   owns(주인인 데이터 — 데이터 하나에 주인 하나) · capabilities(기계가 읽는 능력 기술 [{name, description, sideEffect, needsConfirm}])
 *   planned(아직 없는 것: { provides, contributes } — 자리 이름만 검사한다) · domRoot · ownerKeys · dependsOn(자동: 읽는 전역·require)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { listJs, blankCommentOnlyLines, inlineScripts } = require('./module-metrics');

const SPEC_PATH = path.join('docs', 'architecture', 'modules.json');
const KINDS = ['organ', 'tab', 'hybrid', 'future'];
const SLOT_NAMES = require('../js/core/slots.js').ALLOWED.slice();
const FUTURE_SLOTS = require('../js/core/slots.js').DEFAULT_SLOTS.filter(x => x.future).map(x => x.name);
const HAND_FIELDS = ['kind', 'role', 'spans', 'provides', 'requires', 'contributes', 'owns', 'capabilities', 'planned'];
const NOISE_DEPS = new Set(['document', 'console', 'location', 'navigator', 'localStorage', 'sessionStorage', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'addEventListener', 'removeEventListener', 'innerWidth', 'innerHeight', 'matchMedia', 'getComputedStyle', 'performance', 'Promise', 'queueMicrotask', 'Date', 'JSON', 'Math', 'history', 'scrollTo', 'open', 'alert', 'confirm', 'prompt', 'fetch', 'crypto', 'devicePixelRatio', 'visualViewport', 'screen', 'Notification', 'caches', 'indexedDB', 'URL', 'Blob', 'FileReader', 'Image', 'Audio', 'Intl', 'Object', 'Array', 'String', 'Number', 'Error', 'Map', 'Set', 'module', 'exports', 'self', 'top', 'parent', 'name', 'onerror', 'onload']);

function uniqSorted(arr) {
  return Array.from(new Set(arr)).sort();
}

function allMatches(text, re, group) {
  const out = [];
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  let m;
  while ((m = g.exec(text))) out.push(m[group || 1]);
  return out;
}

function roleOf(raw) {
  const tag = /@role\s+(.+)/.exec(raw);
  if (tag) return tag[1].trim();
  const head = /^\s*\/\*\*?([\s\S]*?)\*\//.exec(raw);
  if (!head) return null;
  const line = head[1].split('\n').map(l => l.replace(/^\s*\*\s?/, '').trim()).find(l => l && !l.startsWith('@'));
  return line || null;
}

function idOf(rel) {
  if (rel === 'index.html') return 'index-html';
  const parts = rel.replace(/\.js$/, '').split('/');
  if (parts[1] === 'tabs') return parts[2] + '/' + parts.slice(3).join('/');
  if (parts.length === 2) return parts[1];
  return parts.slice(1).join('/');
}

function defaultKind(rel) {
  if (/^js\/core\//.test(rel)) return 'organ';
  if (/^js\/tabs\//.test(rel)) return 'tab';
  if (/^js\/(ui|services)\//.test(rel)) return 'organ';
  return 'unclassified';
}

// 코드에서 뽑는 실제 값
function actualOf(root, rel) {
  const raw = fs.readFileSync(path.join(root, rel), 'utf8');
  const code = rel === 'index.html'
    ? blankCommentOnlyLines(inlineScripts(raw).map(s => s.body).join('\n'))
    : blankCommentOnlyLines(raw);
  const parts = rel.split('/');
  const defined = new Set(allMatches(code, /\b(?:global|window|globalThis|win|root)\s*\.\s*([A-Za-z_$][\w$]*)\s*=(?![=>])/));
  const reads = allMatches(code, /\b(?:global|window|globalThis)\s*\.\s*([A-Za-z_$][\w$]*)\b(?!\s*=(?![=>]))/);
  const deps = rel === 'index.html' ? [] : reads.filter(n => !defined.has(n) && !NOISE_DEPS.has(n));
  const requires = allMatches(code, /\brequire\(\s*['"]([^'"]+)['"]\s*\)/).map(r => 'require:' + r);
  const domRoots = allMatches(code, /\bcontainerId\s*:\s*['"]([^'"]+)['"]/);
  return {
    file: rel,
    layer: rel === 'index.html' ? 'mass' : (/^js\/(core|services|ui|app|tabs)\//.test(rel) ? parts[1] : 'legacy'),
    tab: /^js\/tabs\//.test(rel) ? parts[2] : null,
    roleFromCode: roleOf(raw),
    emits: uniqSorted(allMatches(code, /\.emit\(\s*['"]([^'"]+)['"]/)),
    listens: uniqSorted(allMatches(code, /\.(?:on|once)\(\s*['"]([a-z][\w-]*:[\w:.-]+)['"]/)),
    domRoot: domRoots.length ? domRoots[0] : null,
    ownerKeys: uniqSorted(allMatches(code, /\b(?:offOwner\(|owner\s*:\s*)\s*['"]([^'"]+)['"]/)),
    dependsOn: uniqSorted(deps.concat(requires)),
    providesInCode: uniqSorted(allMatches(code, /\.provide\(\s*['"]([a-z][\w-]*\.[\w.-]+)['"]/)),
    requestsInCode: uniqSorted(allMatches(code, /\.(?:request|call)\(\s*['"]([a-z][\w-]*\.[\w.-]+)['"]/)),
    contributesInCode: uniqSorted(allMatches(code, /\.contribute\(\s*['"]([a-z][\w-]*\.[\w.-]+)['"]/))
  };
}

/** 세포 파일 목록: js/**.js (index.html 은 세포가 아니라 미분화 덩어리) */
function cellFiles(root) {
  return listJs(root, 'js');
}

function sizeOf(rel) {
  if (/^js\/tabs\/[^/]+\/index\.js$/.test(rel)) return 'large';
  if (/^js\/tabs\//.test(rel)) return 'small';
  return null;
}

function readDeclared(root) {
  const p = path.join(root, SPEC_PATH);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function emptyHand(rel, actual) {
  return {
    kind: defaultKind(rel),
    role: actual.roleFromCode,
    spans: [],
    provides: [],
    requires: [],
    contributes: [],
    owns: [],
    capabilities: [],
    planned: { provides: [], contributes: [] }
  };
}

/** 신고서(declared) + 코드 실제 값 → 새 신고서(--write 결과) */
function merge(root, declared) {
  const prevCells = (declared && declared.cells) || [];
  const prev = new Map(prevCells.filter(c => c.file).map(c => [c.file, c]));
  const cells = [];
  for (const rel of cellFiles(root)) {
    const a = actualOf(root, rel);
    const d = prev.get(rel);
    const base = emptyHand(rel, a);
    const hand = d ? HAND_FIELDS.reduce((o, k) => { o[k] = d[k] !== undefined ? d[k] : base[k]; return o; }, {}) : base;
    cells.push(Object.assign({ id: d && d.id ? d.id : idOf(rel), file: rel, layer: a.layer, tab: a.tab, size: sizeOf(rel) }, hand, {
      emits: a.emits, listens: a.listens, domRoot: a.domRoot, ownerKeys: a.ownerKeys, dependsOn: a.dependsOn
    }));
  }
  // 파일 없는 미래 세포는 그대로 둔다
  prevCells.filter(c => c.kind === 'future' && !c.file).forEach(c => cells.push(c));
  // 미분화 덩어리: index.html(세포 종류가 아니다 — 여기서 세포를 하나씩 떼어 낸다)
  const undifferentiated = [];
  if (fs.existsSync(path.join(root, 'index.html'))) {
    const prevU = ((declared && declared.undifferentiated) || []).find(u => u.file === 'index.html') || {};
    const a = actualOf(root, 'index.html');
    undifferentiated.push({
      id: 'index-html', file: 'index.html',
      role: prevU.role || '미분화 덩어리 — 아직 세포로 분화되지 않은 인라인 스크립트(여기서 세포를 하나씩 떼어 낸다)',
      emits: a.emits, listens: a.listens
    });
  }
  return {
    schema: 'ourgoal.cells/1',
    undifferentiated,
    note: (declared && declared.note) || ('세포 신고서. 손으로 정하는 칸(kind·role·spans·provides·requires·contributes·owns·capabilities·planned)은 여기서 고치고, ' +
      '코드에서 뽑는 칸(emits·listens·domRoot·ownerKeys·dependsOn)은 node scripts/module-specs.js --write 가 다시 쓴다. 규칙: docs/architecture/MODULE-BLUEPRINT.md'),
    cells
  };
}

/**
 * 검증. 돌려주는 값: { failures: [], warnings: [] }
 *  실패: 신고서 없는 세포 · 파일 없는 신고서(미래 세포 제외) · 종류 없음/틀림 · requires 를 아무도 provide 안 함 · owns 주인 둘 · 능력 주인 둘 · id 중복
 *  경고: 신고서와 코드의 신호(emits·listens)·domRoot 불일치 · 코드의 provide/request/contribute 가 신고서에 없음 · 능력 기술 없음
 */
function validate(root, declared) {
  const failures = [];
  const warnings = [];
  if (!declared || !Array.isArray(declared.cells)) return { failures: ['세포 신고서(docs/architecture/modules.json)가 없다 — node scripts/module-specs.js --write'], warnings };
  const byFile = new Map();
  const ids = new Set();
  for (const c of declared.cells) {
    if (ids.has(c.id)) failures.push(`세포 id 중복: ${c.id}`);
    ids.add(c.id);
    if (c.file) byFile.set(c.file, c);
    if (!KINDS.includes(c.kind)) failures.push(`세포 ${c.id}: 종류(kind)가 ${JSON.stringify(c.kind)} — ${KINDS.join('·')} 중 하나로 정한다`);
    if (!c.file && c.kind !== 'future') failures.push(`세포 ${c.id}: 파일이 없는데 미래 세포가 아니다`);
  }
  const files = cellFiles(root);
  const fileSet = new Set(files);
  if (fs.existsSync(path.join(root, 'index.html')) && !((declared.undifferentiated || []).some(u => u.file === 'index.html'))) {
    failures.push('미분화 덩어리 index.html 이 신고서(undifferentiated)에 없다 — node scripts/module-specs.js --write');
  }
  for (const c of declared.cells) {
    if (c.kind === 'tab' && c.size !== 'large' && c.size !== 'small') failures.push(`세포 ${c.id}: 탭 세포는 size 가 large(큰 세포) 또는 small(작은 세포)이어야 한다`);
    const planned = (c.planned && c.planned.contributes) || [];
    for (const sl of (c.contributes || []).concat(planned)) {
      if (!SLOT_NAMES.includes(sl)) failures.push(`세포 ${c.id}: 꽂는 자리 ${sl} 는 정식 목록 15곳에 없다 — ${SLOT_NAMES.join(', ')}`);
    }
  }
  for (const rel of files) if (!byFile.has(rel)) failures.push(`신고서 없는 세포: ${rel} — node scripts/module-specs.js --write 후 종류·능력을 적는다`);
  for (const c of declared.cells) if (c.file && !fileSet.has(c.file)) failures.push(`신고서만 남은 세포(파일 없음): ${c.id} (${c.file}) — 소멸이면 신고서도 지운다(소멸 결정은 상민님)`);

  const providers = new Map();
  for (const c of declared.cells) {
    if (c.kind === 'future') continue;
    for (const p of c.provides || []) {
      if (providers.has(p)) failures.push(`능력 ${p} 을 주는 세포가 둘: ${providers.get(p)} · ${c.id}`);
      else providers.set(p, c.id);
    }
  }
  for (const c of declared.cells) {
    if (c.kind === 'future') continue;
    for (const r of c.requires || []) if (!providers.has(r)) failures.push(`세포 ${c.id} 가 필요한 능력 ${r} 을 주는 세포가 없다`);
  }
  const owners = new Map();
  for (const c of declared.cells) {
    for (const o of c.owns || []) {
      if (owners.has(o)) failures.push(`데이터 ${o} 의 주인이 둘: ${owners.get(o)} · ${c.id} — 데이터 하나에 주인 하나`);
      else owners.set(o, c.id);
    }
  }
  for (const c of declared.cells) {
    const capNames = new Set((c.capabilities || []).map(x => x && x.name));
    for (const p of c.provides || []) if (!capNames.has(p)) warnings.push(`세포 ${c.id}: 주는 능력 ${p} 의 기술(capabilities 항목)이 없다 — AI 비서가 읽을 설명을 적는다`);
  }

  for (const rel of files) {
    const c = byFile.get(rel);
    if (!c) continue;
    const a = actualOf(root, rel);
    for (const key of ['emits', 'listens']) {
      const ds = new Set(c[key] || []);
      const as = new Set(a[key] || []);
      const added = [...as].filter(x => !ds.has(x));
      const removed = [...ds].filter(x => !as.has(x));
      if (added.length) warnings.push(`${c.id} ${key}: 신고서에 없는 신호 ${added.join(', ')}`);
      if (removed.length) warnings.push(`${c.id} ${key}: 코드에서 사라진 신호 ${removed.join(', ')}`);
    }
    if ((c.domRoot || null) !== (a.domRoot || null)) warnings.push(`${c.id} domRoot: 신고서 ${c.domRoot} ↔ 코드 ${a.domRoot}`);
    for (const p of a.providesInCode) if (!(c.provides || []).includes(p)) warnings.push(`${c.id}: 코드가 주는 능력 ${p} 이 신고서 provides 에 없다`);
    for (const r of a.requestsInCode) if (!(c.requires || []).includes(r)) warnings.push(`${c.id}: 코드가 요청하는 능력 ${r} 이 신고서 requires 에 없다`);
    for (const s of a.contributesInCode) {
      if (!SLOT_NAMES.includes(s)) failures.push(`${c.id}: 코드가 기여하는 자리 ${s} 는 정식 목록 15곳에 없다`);
      else if (!(c.contributes || []).includes(s)) warnings.push(`${c.id}: 코드가 기여하는 자리 ${s} 가 신고서 contributes 에 없다`);
    }
  }
  return { failures, warnings };
}

function writeSpec(root, doc) {
  const p = path.join(root, SPEC_PATH);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(doc, null, 2) + '\n', 'utf8');
  return p;
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const ri = argv.indexOf('--root');
  const root = ri >= 0 ? path.resolve(argv[ri + 1]) : path.join(__dirname, '..');
  const declared = readDeclared(root);
  if (argv.includes('--write')) {
    const doc = merge(root, declared);
    writeSpec(root, doc);
    const kinds = {};
    doc.cells.forEach(c => { kinds[c.kind] = (kinds[c.kind] || 0) + 1; });
    console.log(`modules.json 갱신: 세포 ${doc.cells.length} — ` + Object.keys(kinds).sort().map(k => `${k} ${kinds[k]}`).join(' · '));
  } else if (argv.includes('--check')) {
    const r = validate(root, declared);
    r.failures.forEach(f => console.log('✖ ' + f));
    r.warnings.forEach(w => console.log('⚠ ' + w));
    if (!r.failures.length && !r.warnings.length) console.log('✓ 세포 신고서 일치');
  } else {
    process.stdout.write(JSON.stringify(merge(root, declared), null, 2) + '\n');
  }
}

module.exports = { merge, validate, readDeclared, writeSpec, actualOf, cellFiles, idOf, SPEC_PATH, KINDS, SLOT_NAMES, FUTURE_SLOTS };
