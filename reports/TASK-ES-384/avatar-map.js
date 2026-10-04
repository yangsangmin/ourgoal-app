// TASK-ES-384: avatar-system.js 책임 지도 측정 스크립트(읽기 전용). 사용: node reports/TASK-ES-384/avatar-map.js
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const FILE = path.join(ROOT, 'js', 'avatar-system.js');
const lines = fs.readFileSync(FILE, 'utf8').split(/\r?\n/);

// 1) 팩토리 최상위(들여쓰기 2칸) 선언의 시작 줄
const decls = [];
lines.forEach((l, i) => {
  let m = l.match(/^  (?:async )?function ([^\s(]+)\s*\(/);
  if (m) return decls.push({ name: m[1], kind: 'function', start: i + 1 });
  m = l.match(/^  var ([A-Za-z0-9_$]+) = /);
  if (m) decls.push({ name: m[1], kind: 'var', start: i + 1 });
});
// 끝 줄: 다음 최상위 선언 직전의 '  }' 또는 '  };' / '  ];'
for (let k = 0; k < decls.length; k++) {
  const next = k + 1 < decls.length ? decls[k + 1].start : lines.length;
  let end = decls[k].start;
  for (let j = next - 1; j >= decls[k].start; j--) {
    if (/^  [}\]];?\s*$/.test(lines[j - 1]) || (decls[k].kind === 'var' && j === decls[k].start)) { end = j; break; }
  }
  decls[k].end = end;
  decls[k].lines = end - decls[k].start + 1;
}
// 2) 파일 내 호출 관계(이름 등장)
const names = decls.filter(d => d.kind === 'function').map(d => d.name);
decls.forEach(d => {
  const body = lines.slice(d.start, d.end).join('\n');
  d.calls = names.filter(n => n !== d.name && new RegExp('(^|[^A-Za-z0-9_$.])' + n.replace(/\$/g, '\\$') + '\\s*\\(').test(body));
  d.lsKeys = Array.from(new Set((body.match(/(?:localStorage|locStorage)\.(?:getItem|setItem|removeItem)\(\s*['"`]([^'"`]+)/g) || []).map(s => s.replace(/.*\(\s*['"`]/, ''))));
  d.sbTables = Array.from(new Set((body.match(/\.from\(\s*['"]([a-z_]+)['"]/g) || []).map(s => s.replace(/.*\(\s*['"]/, '').replace(/['"]$/, ''))));
  d.winGlobals = Array.from(new Set((body.match(/(?:window|win|global)\.([A-Za-z_$][A-Za-z0-9_$]*)/g) || []).map(s => s.split('.')[1]))).sort();
});
// 3) 공개 API 이름(api = { ... } + api.X =)
const apiNames = new Set();
const apiStart = lines.findIndex(l => /^  var api = \{/.test(l));
for (let i = apiStart + 1; i < lines.length && !/^  \};/.test(lines[i]); i++) {
  const m = lines[i].match(/^\s+([^\s:]+):/); if (m) apiNames.add(m[1]);
}
lines.forEach(l => { const m = l.match(/^\s+api\.([^\s=]+)\s*=/); if (m) apiNames.add(m[1]); });
const windowAssigned = Array.from(new Set(lines.map(l => (l.match(/^\s+window\.([^\s=]+)\s*=/) || [])[1]).filter(Boolean)));

// 4) 다른 파일이 부르는 이름: OurgoalAvatar.X / window.X(전역 대입된 것)
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'reports', 'docs', '.claude', 'android', 'ios'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (/\.(js|html|cjs|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}
const files = walk(ROOT, []).filter(f => path.resolve(f) !== FILE);
const ext = {};
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const rel = path.relative(ROOT, f).split(path.sep).join('/');
  const re = /OurgoalAvatar\s*(?:\)\s*)?\.\s*([A-Za-z0-9_$가-힣]+)/g; let m;
  while ((m = re.exec(src))) { (ext[m[1]] = ext[m[1]] || {}); ext[m[1]][rel] = (ext[m[1]][rel] || 0) + 1; }
  for (const w of windowAssigned) {
    const c = (src.match(new RegExp('[^A-Za-z0-9_$]' + w + '(?![A-Za-z0-9_$])', 'g')) || []).length;
    if (c) { const k = 'window.' + w; (ext[k] = ext[k] || {}); ext[k][rel] = c; }
  }
}
// 5) 시험이 avatar-system.js 의 글자를 찾는 곳
const testHits = {};
for (const f of files.filter(f => /^(tests|scripts|court)\//.test(path.relative(ROOT, f).split(path.sep).join('/')))) {
  const src = fs.readFileSync(f, 'utf8');
  if (!/avatar-system/.test(src)) continue;
  const rel = path.relative(ROOT, f).split(path.sep).join('/');
  testHits[rel] = names.filter(n => src.includes(n)).concat(Array.from(apiNames).filter(n => !names.includes(n) && src.includes(n)));
}
// 6) 소스 글자 단언(파일 글자를 직접 찾는 시험) → 그 글자가 사는 선언
const PROBE_FILES = ['scripts/smoke-test.js', 'tests/avatar-exp-celebration.test.js', 'tests/avatar-levelup-dialogue.test.js', 'tests/enlarge-avatar-icons.test.js'];
const SRC_VARS = '(?:avatarSrc|avatarJsSrc|avatarSystemSrc|avatarSystemJs|avatarJs)';
const fullText = lines.join('\n');
function declOfIndex(idx) {
  const lineNo = fullText.slice(0, idx).split('\n').length;
  const d = decls.find(x => lineNo >= x.start && lineNo <= x.end);
  return d ? d.name : ('(top ' + lineNo + ')');
}
const probes = [];
for (const rel of PROBE_FILES) {
  const p = path.join(ROOT, rel); if (!fs.existsSync(p)) continue;
  const src = fs.readFileSync(p, 'utf8');
  const reInc = new RegExp(SRC_VARS + '\\.(?:includes|indexOf)\\((\'|"|`)((?:\\\\.|(?!\\1).)*)\\1', 'g');
  let m;
  while ((m = reInc.exec(src))) {
    let needle = m[2];
    try { needle = m[1] === '`' ? needle : JSON.parse('"' + needle.replace(/\\'/g, "'").replace(/"/g, '\\"') + '"'); } catch (e) { /* 그대로 */ }
    const idx = fullText.indexOf(needle);
    probes.push({ file: rel, kind: 'includes', needle: needle.slice(0, 80), inAvatar: idx >= 0, decl: idx >= 0 ? declOfIndex(idx) : null });
  }
  const reTest = new RegExp('/((?:\\\\.|[^/\\n])+)/([gimsuy]*)\\.test\\(' + SRC_VARS + '\\)', 'g');
  while ((m = reTest.exec(src))) {
    let rx; try { rx = new RegExp(m[1], m[2].replace('g', '')); } catch (e) { continue; }
    const mm = rx.exec(fullText);
    probes.push({ file: rel, kind: 'regex', needle: m[1].slice(0, 80), inAvatar: !!mm, decl: mm ? declOfIndex(mm.index) : null });
  }
}
const probeByDecl = {};
probes.filter(p => p.inAvatar).forEach(p => { probeByDecl[p.decl] = (probeByDecl[p.decl] || 0) + 1; });

const out = {
  probes, probeByDecl,
  file: 'js/avatar-system.js', totalLines: lines.length - (lines[lines.length - 1] === '' ? 1 : 0),
  decls: decls.map(d => ({ name: d.name, kind: d.kind, start: d.start, end: d.end, lines: d.lines, calls: d.calls, lsKeys: d.lsKeys, sbTables: d.sbTables, winGlobals: d.winGlobals })),
  apiNames: Array.from(apiNames), windowAssigned, externalRefs: ext, testFilesMentioningAvatarSystem: testHits,
};
if (process.argv.includes('--json')) { console.log(JSON.stringify(out, null, 2)); return; }
console.log('total', lines.length);
for (const d of out.decls) console.log([d.start + '-' + d.end, d.lines, d.kind, d.name, 'calls=' + d.calls.join(','), d.lsKeys.length ? 'ls=' + d.lsKeys.join(',') : '', d.sbTables.length ? 'sb=' + d.sbTables.join(',') : ''].join(' | '));
console.log('\nAPI', out.apiNames.join(', '));
console.log('\nwindow.*=', windowAssigned.join(', '));
console.log('\nEXTERNAL'); for (const [k, v] of Object.entries(ext).sort()) console.log(k, JSON.stringify(v));
console.log('\nPROBES total', probes.length, 'inAvatar', probes.filter(p => p.inAvatar).length);
console.log('PROBES by decl', JSON.stringify(probeByDecl));
console.log('PROBES not in avatar file', JSON.stringify(probes.filter(p => !p.inAvatar).map(p => p.file + ':' + p.needle)));
console.log('\nTESTS'); for (const [k, v] of Object.entries(testHits)) console.log(k, v.join(','));
