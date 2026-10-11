#!/usr/bin/env node
'use strict';
// #TASK-ES-620 조사 도구(작업자 측정, 판정 아님) — 시험 소스에 적힌 `window.이름 = …` 글자 전수 목록과 분류.
// 「고친 것」 말고 「고치지 않고 남긴 것」을 목록으로 보이기 위한 것이다. 시험 소스(scripts/smoke-test.js · scripts/verify-*.js · scripts/test-*.js · tests/**/*.js)를
// @babel/parser 로 읽어, 문자열·템플릿·정규식 리터럴 가운데 `window.이름` 뒤에 `=`(비교 `==` 제외)가 오는 글자를 모은다.
// 먼저 그 글자가 「찾는 글자」인지 본다: 글자 찾기 호출(includes·indexOf·lastIndexOf·startsWith·match·search·split·test)의 인자이거나, 함수 잘라 읽기(cutFunctionWithExposure · 시험지 안의 sliceFunction 꼴 도우미)의 인자이거나, 정규식 리터럴.
// 찾는 글자가 아니면(시험이 만든 가짜 소스·단언 문구 등) 「찾는 글자 아님」으로 따로 둔다 — 제품 글자를 붙잡지 않는다.
// 찾는 글자의 분류:
//   고침            — 모의 철거 사본에서 실제로 깨져 이 변경(또는 짝 PR)이 넓힌 단언의 글자(changed-assertions.json 의 옛 배선 글자)
//   정의 글자        — 오른쪽이 이름이 아니다(`window.X = function …` · `async function` 등). 배선이 아니라 정의라 배선 철거가 지우지 않는다. 범위 밖
//   미등록 이름      — `window.X = Y` 꼴이지만 X 가 등록 기관에 window 로 등록돼 있지 않다(인라인 IIFE 가 주인이거나 등록을 건너뛴 이름). 지워질 줄이 아니다. 범위 밖
//   등록됐지만 안 깨짐 — 등록된 이름의 배선 글자인데 모의 철거 사본에서 그 단언이 깨지지 않았다(같은 글자가 세포 파일 등 다른 곳에도 있다). 고치지 않았다
// 사용: NODE_PATH=… node reports/TASK-ES-620/window-text-scan.cjs <트리(고치기 전 시험지)> <out.json> <changed-assertions.json …>
const fs = require('fs'), path = require('path');
const parser = require('@babel/parser');
const TREE = path.resolve(process.argv[2]), OUT = path.resolve(process.argv[3]);
const tables = process.argv.slice(4).map(f => JSON.parse(fs.readFileSync(path.resolve(f), 'utf8')));
const fixed = new Set(tables.flatMap(t => t.changed).map(r => r.file + '|' + r.legacyText.trim()));
const reg = require(path.join(__dirname, '..', '..', 'tests', 'helpers', 'wiring-exposed.js')).forRoot(TREE).registry(); // 등록 지도는 이 PR 의 도우미로 읽는다(읽는 트리는 인자로 준 트리)
const walk = d => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const files = walk(path.join(TREE, 'tests')).filter(f => /\.(js|cjs|mjs)$/.test(f) && !/wiring-exposed/.test(f))
  .concat(fs.readdirSync(path.join(TREE, 'scripts')).filter(f => /^(smoke-test|verify-.*|test-.*)\.js$/.test(f)).map(f => path.join(TREE, 'scripts', f)))
  .map(f => path.relative(TREE, f).replace(/\\/g, '/')).sort();
const HIT = /window\\?\.([A-Za-z_$][\w$]*)\s*(?:\\s[*+]?\s*)?=(?!=)/;
const PLAIN = /^\s*window\.([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)\s*;?\s*$/;
const FIND_CALLS = ['includes', 'indexOf', 'lastIndexOf', 'startsWith', 'endsWith', 'match', 'matchAll', 'search', 'split', 'test', 'cutFunctionWithExposure'];
const LOCAL_CUT = /^(slice|cut|extract|grab|pick)[A-Z]/; // 시험지 안의 잘라 읽기 도우미(sliceFunction 등)의 인자도 찾는 글자다
const calleeName = c => (c.type === 'MemberExpression' && !c.computed && c.property.type === 'Identifier' ? c.property.name : (c.type === 'Identifier' ? c.name : null));
const rows = [];
function visit(node, file, parent) {
  if (!node || typeof node.type !== 'string') return;
  let text = null, kind = null;
  if (node.type === 'StringLiteral') { text = node.value; kind = '문자열'; }
  else if (node.type === 'TemplateLiteral' && node.quasis.length === 1) { text = node.quasis[0].value.cooked; kind = '문자열'; }
  else if (node.type === 'RegExpLiteral') { text = node.pattern; kind = '정규식'; }
  if (text !== null && text.length < 400 && HIT.test(text)) {
    const m = HIT.exec(text), name = m[1], p = kind === '문자열' ? PLAIN.exec(text) : null;
    const e = Object.prototype.hasOwnProperty.call(reg.entries, name) ? reg.entries[name] : null;
    const searched = kind === '정규식' || !!(parent && parent.type === 'CallExpression' && parent.arguments.indexOf(node) >= 0 && (FIND_CALLS.includes(calleeName(parent.callee)) || LOCAL_CUT.test(calleeName(parent.callee) || '')));
    let cls;
    if (fixed.has(file + '|' + text.trim())) cls = '고침';
    else if (!searched) cls = '찾는 글자 아님';
    else if (kind === '문자열' && !p) cls = '정의 글자';
    else if (!(e && e.window)) cls = '미등록 이름';
    else cls = '등록됐지만 안 깨짐';
    rows.push({ file, line: node.loc.start.line, kind, name, text: text.slice(0, 160), class: cls, usedBy: parent && parent.type === 'CallExpression' ? calleeName(parent.callee) : null, registeredWindow: !!(e && e.window), registeredFrom: e ? e.from : null });
  }
  for (const k of Object.keys(node)) {
    if (k === 'loc' || k === 'leadingComments' || k === 'trailingComments' || k === 'innerComments') continue;
    const v = node[k];
    if (Array.isArray(v)) { for (const c of v) if (c && typeof c.type === 'string') visit(c, file, node); }
    else if (v && typeof v.type === 'string') visit(v, file, node);
  }
}
const unparsed = [];
for (const f of files) {
  let ast;
  try { ast = parser.parse(fs.readFileSync(path.join(TREE, f), 'utf8'), { sourceType: 'unambiguous', errorRecovery: true, allowReturnOutsideFunction: true }); }
  catch (e) { unparsed.push({ file: f, error: String(e.message).slice(0, 120) }); continue; }
  visit(ast.program, f, null);
}
const count = f => rows.reduce((a, r) => { const k = f(r); a[k] = (a[k] || 0) + 1; return a; }, {});
const namesOf = c => [...new Set(rows.filter(r => r.class === c).map(r => r.name))].sort();
const out = { tool: 'reports/TASK-ES-620/window-text-scan.cjs', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), tree: TREE, scannedFiles: files.length, unparsed,
  summary: { literals: rows.length, byClass: count(r => r.class), byKind: count(r => r.kind), unregisteredNames: namesOf('미등록 이름'), definitionNames: namesOf('정의 글자'), registeredNotBroken: namesOf('등록됐지만 안 깨짐') },
  rows: rows.filter(r => r.class !== '고침' && r.class !== '찾는 글자 아님'), notSearched: rows.filter(r => r.class === '찾는 글자 아님').map(r => ({ file: r.file, line: r.line, text: r.text.slice(0, 80) })), fixedRows: rows.filter(r => r.class === '고침').length };
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log(JSON.stringify(out.summary));
