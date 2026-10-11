#!/usr/bin/env node
'use strict';
// #TASK-ES-666 모의본 (나) — 「덩어리에 남은 줄들이 각자 갈 곳으로 간 최종 꼴에 가까운」 index.html 을 저장소 밖 작업 폴더에 만든다(작업자 측정용, 판정 아님).
// finalize 를 실제로 한 것이 아니다. 시험·가드·도구가 「index.html 에 인라인 IIFE 가 없다」에 어떻게 반응하는지를, 글자가 갈 자리를 설계 문서의 규칙대로 흉내 내어 보려는 것이다.
// 덩어리(IIFE)의 최상위 문을 파서로 종류별로 나눠 아래처럼 보낸다(docs/architecture/CELL-REGISTRY-DESIGN.md 3.3 · 3.4 · 5절의 줄 종류를 흉내 — 생성기를 돌린 것이 아니다):
//   함수 선언(openProTemplateRecordModal 등)   → 탭 세포 js/tabs/records/zz-mock-moved-functions.js(700줄을 넘으면 -2.js · -3.js … 로 나눠) 에 글자 그대로(함수 이전 — 세포 파일로)
//   통로에 노출된 var(상태)                    → `window.OurgoalAppState.define('X', 초기값 원문);`(setter 가 있으면 defineVar)로 바꿔 써서 구역 세포로(X5 + X7)
//   노출 안 된 var · if 문 · window 대입 · 식 문 → 구역 세포 js/core/zz-mock-boot-rest.js 에 글자 그대로(X7 — 구역 감싸기)
//   가져온 이름만 window 에 다는 if 블록·대입 줄  → 삭제(U3 — 재철거). 그 이름이 등록 기관에 없어도 지운다(등록은 --register 로 따로 흉내)
//   expose 문 · 구역 함수가 아닌 가져오기       → 삭제(U1 · U2 — 재철거)
//   키트 손잡이 · 구역 함수 가져오기 · 구역 함수 호출문 → js/app/boot.js(X9 — finalize 가 남기는 꼴)
//   주석: 문이 구역 세포·탭 세포로 간 구획의 주석은 그 세포로 따라가고(X7 「구역 안 주석 따라감」), 문이 하나도 옮겨 가지 않은 구획의 주석은 지운다(X8 · X9)
// 구획 = `/* ============ 제목 ============ */` 꼴 주석에서 다음 그런 주석 앞까지.
// 흉내의 한계(결과에 그대로 적는다): 옮긴 글자에 이름 접두 L. 을 붙이지 않았다(시험지의 합본 읽기는 L. 을 떼고 읽으므로 글자 대조에는 같다) · 옮긴 함수가 800줄을 넘어도 나누지 않았다
//   · 새 파일의 신고서를 쓰지 않았다 · 앱이 뜨는지는 보지 않는다(글자를 읽는 시험·가드·도구의 반응만 본다).
// 사용: NODE_PATH=… node make-final-mock.cjs <모의 작업 폴더(기준 커밋 그대로)> <out.json> [--register 이름,이름]
//   --register: 그 이름을 정의하는 세포 파일 끝에 등록 블록(gen-cell-provide.js 꼴)을 달아 「등록 2차가 끝난 뒤」를 흉내 낸다.
const fs = require('fs'), path = require('path');
const parser = require('@babel/parser');
const argv = process.argv.slice(2), DIR = path.resolve(argv[0]), OUT = path.resolve(argv[1]);
const REGISTER = argv.indexOf('--register') >= 0 ? argv[argv.indexOf('--register') + 1].split(',').filter(Boolean) : [];
const f = path.join(DIR, 'index.html'), raw = fs.readFileSync(f, 'utf8'), eol = raw.includes('\r\n') ? '\r\n' : '\n';
const ls = raw.split('\n').map(l => l.replace(/\r$/, ''));
let s = -1, e = -1;
for (let i = 0; i < ls.length; i++) if (ls[i].trim() === '<script>' && (ls[i + 1] || '').trim() === '(function(){' && (ls[i + 2] || '').includes('"use strict"')) { s = i; break; }
for (let i = s + 1; i < ls.length; i++) if (ls[i].startsWith('</script>')) { e = i; break; }
if (s < 0 || e < 0 || !/<script src="[^"]+"><\/script>$/.test(ls[s - 1])) throw new Error('IIFE 블록이나 앞 태그 줄을 찾지 못했다');
const body = ls.slice(s + 1, e), code = body.join('\n');
const ast = parser.parse(code, { sourceType: 'script', ranges: true });
const iife = ast.program.body[0].expression.callee, top = iife.body.body;
const text = n => code.slice(n.start, n.end);
const isWinAssign = x => x && x.type === 'AssignmentExpression' && x.operator === '=' && x.left.type === 'MemberExpression' && !x.left.computed && x.left.object.type === 'Identifier' && x.left.object.name === 'window';

// 1) 이름 지도: 손잡이 · 가져오기 · 통로 getter/setter
const handles = new Set(), imports = new Map(), getters = new Set(), setters = new Set();
for (const st of top) {
  if (st.type === 'VariableDeclaration' && st.declarations.length === 1) {
    const d = st.declarations[0], i = d.init;
    if (i && i.type === 'MemberExpression') { let o = i; while (o.type === 'MemberExpression') o = o.object; if (o.type === 'Identifier' && o.name === 'window') handles.add(d.id.name); else if (i.object.type === 'Identifier' && !i.computed) imports.set(d.id.name, i.object.name); }
  } else if (st.type === 'ExpressionStatement' && st.expression.type === 'CallExpression' && st.expression.callee.type === 'MemberExpression' && st.expression.callee.property.name === 'expose' && st.expression.arguments[1] && st.expression.arguments[1].type === 'ObjectExpression') {
    for (const p of st.expression.arguments[1].properties) if (p.type === 'ObjectMethod' && p.key.type === 'Identifier') (p.kind === 'set' ? setters : getters).add(p.key.name);
  }
}
const isRegionCall = st => st.type === 'ExpressionStatement' && st.expression.type === 'CallExpression' && st.expression.callee.type === 'Identifier' && st.expression.arguments.length === 0 && imports.has(st.expression.callee.name);
const regionFns = new Set(top.filter(isRegionCall).map(st => st.expression.callee.name));
const isExpose = st => st.type === 'ExpressionStatement' && st.expression.type === 'CallExpression' && st.expression.callee.type === 'MemberExpression' && st.expression.callee.property.name === 'expose';
const isHandleOrImport = st => st.type === 'VariableDeclaration' && st.declarations.length === 1 && (handles.has(st.declarations[0].id.name) || imports.has(st.declarations[0].id.name));
// 가져온 이름만 window 에 다는 줄(그런 줄만 담은 if 블록 포함)
const winImportOnly = x => isWinAssign(x) && x.right.type === 'Identifier' && imports.has(x.right.name);
const isRewireBlock = st => (st.type === 'ExpressionStatement' && winImportOnly(st.expression)) || (st.type === 'IfStatement' && !st.alternate && st.consequent.type === 'BlockStatement' && st.consequent.body.length > 0 && st.consequent.body.every(b => b.type === 'ExpressionStatement' && winImportOnly(b.expression)));

// 2) 문마다 갈 곳
const plan = top.map(st => {
  if (st.type === 'FunctionDeclaration') return { st, to: 'tab', kind: '함수 선언', name: st.id.name };
  if (isHandleOrImport(st)) { const n = st.declarations[0].id.name; return handles.has(n) ? { st, to: 'boot?', kind: '키트 손잡이', name: n } : (regionFns.has(n) ? { st, to: 'boot', kind: '구역 함수 가져오기', name: n } : { st, to: 'drop', kind: '가져오기(재철거)', name: n }); }
  if (isExpose(st)) return { st, to: 'drop', kind: 'expose 문(재철거)' };
  if (isRegionCall(st)) return { st, to: 'boot', kind: '구역 함수 호출문', name: st.expression.callee.name };
  if (isRewireBlock(st)) return { st, to: 'drop', kind: '가져온 이름의 window 줄(재철거)', names: (st.type === 'IfStatement' ? st.consequent.body.map(b => b.expression.left.property.name) : [st.expression.left.property.name]) };
  if (st.type === 'VariableDeclaration') {
    const names = st.declarations.map(d => d.id.name), exposed = names.every(n => getters.has(n));
    if (exposed) return { st, to: 'core', kind: '상태 var → define', names, rewrite: st.declarations.map(d => '  window.OurgoalAppState.' + (setters.has(d.id.name) ? 'defineVar' : 'define') + "('" + d.id.name + "', " + (d.init ? text(d.init) : 'undefined') + ');').join('\n') };
    return { st, to: 'core', kind: '노출 안 된 var(지역 변수로)', names };
  }
  if (st.type === 'ExpressionStatement' && isWinAssign(st.expression) && st.expression.right.type === 'Identifier' && getters.has(st.expression.right.name)) return { st, to: 'core', kind: '상태의 window 복사 줄(오른쪽만 통로로)', rewrite: '  window.' + st.expression.left.property.name + ' = window.OurgoalAppScope.scope.' + st.expression.right.name + ';' };
  return { st, to: 'core', kind: st.type === 'IfStatement' ? 'if 문' : (st.type === 'ExpressionStatement' && isWinAssign(st.expression) ? 'window 대입 문' : '식 문') };
});
// 손잡이는 boot 로 가는 가져오기가 쓰는 것만 남긴다
const usedHandles = new Set(plan.filter(p => p.kind === '구역 함수 가져오기').map(p => imports.get(p.name)));
for (const p of plan) if (p.to === 'boot?') p.to = usedHandles.has(p.name) ? 'boot' : 'drop';

// 3) 구획과 주석
const SECTION = /^=+ .* =+$/;
const comments = (ast.comments || []).filter(c => !top.some(st => st.start <= c.start && c.end <= st.end)); // 문 밖의 주석만
const titles = comments.filter(c => c.type === 'CommentBlock' && SECTION.test(c.value.trim())).map(c => c.start).sort((a, b) => a - b);
const sectionOf = pos => { let k = -1; for (let i = 0; i < titles.length; i++) if (titles[i] <= pos) k = i; return k; };
const secDest = new Map(); // 구획 → 'core' | 'tab'
for (const p of plan) if (p.to === 'core' || p.to === 'tab') { const k = sectionOf(p.st.start); if (secDest.get(k) !== 'core') secDest.set(k, p.to); }
// 줄 끝 주석(문과 같은 줄)은 그 문을 따라간다
const lineOf = pos => code.slice(0, pos).split('\n').length;
const stmtOnLine = line => plan.find(p => p.st.loc.start.line <= line && line <= p.st.loc.end.line);
const items = []; // { pos, to, text }
for (const p of plan) items.push({ pos: p.st.start, to: p.to, text: p.rewrite || ('  ' + text(p.st)), kind: p.kind });
let commentsFollowed = 0, commentsDropped = 0;
for (const c of comments) {
  const src = code.slice(c.start, c.end), same = stmtOnLine(lineOf(c.start));
  const to = same ? same.to : (secDest.get(sectionOf(c.start)) || 'drop');
  if (to === 'core' || to === 'tab') { items.push({ pos: c.start, to, text: '  ' + src, kind: '주석' }); commentsFollowed++; } else commentsDropped++;
}
items.sort((a, b) => a.pos - b.pos);
const pick = to => items.filter(i => i.to === to).map(i => i.text).join('\n');

// 4) 파일 쓰기
const MARK = n => '  /* ---- 이전 전 index.html ' + (s + 2) + '~' + e + '줄(#TASK-ES-666 생성기 표지) ---- */ /* 모의본 — 생성기 산출이 아니다(' + n + ') */';
const head = (title, kit) => ['/**', ' * ' + title, ' * #TASK-ES-666 모의본 — 측정용이다. 저장소에 들어가지 않는다.', ' */', '(function(global) {', "  'use strict';", '  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};', '  var K = global.' + kit + ' = global.' + kit + ' || {};', ''].join('\n');
const wr = (rel, t) => { fs.mkdirSync(path.dirname(path.join(DIR, rel)), { recursive: true }); fs.writeFileSync(path.join(DIR, rel), t, { encoding: 'utf8' }); };
const TAB = 'js/tabs/records/zz-mock-moved-functions.js', CORE = 'js/core/zz-mock-boot-rest.js', BOOT = 'js/app/boot.js';
const tabFns = plan.filter(p => p.to === 'tab').map(p => p.name);
// 옮긴 함수는 차례대로 탭 세포 파일에 담되 한 파일이 700줄을 넘지 않게 나눈다(함수 앞 주석은 그 함수를 따라간다. 함수 하나가 700줄을 넘으면 그 파일은 그대로 넘는다 — 나누지 않는다)
const PART_MAX = 700, tabParts = [{ items: [], lines: 0, fns: [] }];
{
  let pending = [];
  const nLines = i => i.text.split('\n').length;
  for (const it of items.filter(i => i.to === 'tab')) {
    if (it.kind === '주석') { pending.push(it); continue; }
    const size = pending.reduce((a, c) => a + nLines(c), 0) + nLines(it);
    let cur = tabParts[tabParts.length - 1];
    if (cur.lines && cur.lines + size > PART_MAX) { cur = { items: [], lines: 0, fns: [] }; tabParts.push(cur); }
    cur.items.push(...pending, it); cur.lines += size; pending = [];
    const p = plan.find(x => x.st.start === it.pos); if (p && p.name) cur.fns.push(p.name);
  }
  tabParts[tabParts.length - 1].items.push(...pending);
}
const TABS = tabParts.map((_, i) => (i === 0 ? TAB : TAB.replace(/\.js$/, '-' + (i + 1) + '.js')));
tabParts.forEach((part, i) => wr(TABS[i], head('모의 탭 세포 ' + (i + 1) + '/' + tabParts.length + ' — 덩어리에 남아 있던 함수 선언을 글자 그대로 담았다', 'OurgoalRecordsKit') + MARK('함수 이전 흉내') + '\n' + part.items.map(x => x.text).join('\n') + '\n\n' + part.fns.map(n => '  K.' + n + ' = ' + n + ';').join('\n') + '\n})(typeof window !== \'undefined\' ? window : globalThis);\n'));
const TABTAGS = TABS.map(r => '<script src="' + r + '"></script>').join('');
const tabFileLines = Object.fromEntries(TABS.map(t => [t, fs.readFileSync(path.join(DIR, t), 'utf8').split('\n').length]));
wr(CORE, head('모의 구역 세포 — 덩어리에 남아 있던 상태 선언(define 으로 바꿔 씀)·if 문·window 대입을 순서 그대로 담았다', 'OurgoalUiHelpers') + MARK('구역 이전 흉내') + '\n  function bootMockRest() {\n' + pick('core') + '\n  }\n  K.bootMockRest = bootMockRest;\n})(typeof window !== \'undefined\' ? window : globalThis);\n');
wr(BOOT, ['/**', ' * 모의 부팅 파일 — finalize 가 남기는 꼴(키트 손잡이 · 구역 함수 가져오기 · 구역 함수 호출문)만 담았다. #TASK-ES-666 모의본 — 측정용.', ' */', '(function(){', '  "use strict";', pick('boot'), '})();', ''].join('\n'));
const tag = r => '<script src="' + r + '"></script>';
const nh = ls.slice(0, s - 1).concat([ls[s - 1] + TABTAGS + tag(CORE) + tag(BOOT)], ls.slice(e + 1));
// commit 태그(등록 기관 적용)는 세포들 뒤·부팅 앞이어야 한다 — 새 세포 태그를 commit 태그 앞으로 옮긴다
let htmlOut = nh.join(eol);
const COMMIT = tag('js/core/cell-registry-commit.js');
if (htmlOut.includes(COMMIT + TABTAGS + tag(CORE))) htmlOut = htmlOut.replace(COMMIT + TABTAGS + tag(CORE), TABTAGS + tag(CORE) + COMMIT);
fs.writeFileSync(f, htmlOut, { encoding: 'utf8' });

// 5) 등록 흉내(--register): 그 이름을 `K.이름 = 이름;` 으로 다는 세포 파일을 찾아 등록 블록을 단다
const registered = [];
if (REGISTER.length) {
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(x => (x.isDirectory() ? walk(path.join(d, x.name)) : [path.join(d, x.name)]));
  const files = walk(path.join(DIR, 'js')).filter(x => x.endsWith('.js'));
  for (const name of REGISTER) {
    const hit = files.find(x => new RegExp('^\\s*K\\.' + name + '\\s*=\\s*' + name + '\\s*;', 'm').test(fs.readFileSync(x, 'utf8')));
    if (!hit) { registered.push({ name, file: null, why: '그 이름을 키트에 다는 세포 파일을 찾지 못했다' }); continue; }
    let src = fs.readFileSync(hit, 'utf8');
    const kit = (/var K = global\.([A-Za-z_$][\w$]*) = global\.\1 \|\| \{\}/.exec(src) || [])[1];
    const rel = path.relative(DIR, hit).replace(/\\/g, '/');
    if (!kit || src.includes('세포 등록 시작')) { registered.push({ name, file: rel, why: kit ? '이미 등록 블록이 있다(이 도구는 새 블록만 단다)' : '키트 이름을 읽지 못했다' }); continue; }
    const owner = rel.replace(/^js\//, '').replace(/\.js$/, '').replace(/^tabs\//, '');
    src = src.replace(/\s*$/, '\n') + ['/* ==== [세포 등록 시작 · gen-cell-provide.js] 모의본 — 등록 2차가 끝난 뒤를 흉내 낸 블록(#TASK-ES-666 측정용, 생성기 산출이 아니다) ==== */', '(function (g) {', '  var R = g.OurgoalCellRegistry;', '  if (!R) return;', '  var K = g.' + kit + ';',
      "  if (K) R.provide('" + owner + "', {", '    ' + name + ': K.' + name, "  }, { window: [", "    '" + name + "'", '  ] });', "})(typeof window !== 'undefined' ? window : globalThis);", '/* ==== [세포 등록 끝] ==== */', ''].join('\n');
    fs.writeFileSync(hit, src, { encoding: 'utf8' });
    registered.push({ name, file: rel, kit, owner });
  }
}
const count = k => plan.filter(p => p.kind === k).length;
const out = { tool: 'reports/TASK-ES-666/tools/make-final-mock.cjs', type: '작업자 측정, 판정 아님 — 모의본(생성기 산출이 아니다)', scriptHtmlLines: [s + 1, e + 1], htmlLines: [ls.length, htmlOut.split('\n').length], topStatements: top.length,
  byKind: plan.reduce((a, p) => { a[p.kind] = (a[p.kind] || 0) + 1; return a; }, {}), byDestination: plan.reduce((a, p) => { a[p.to] = (a[p.to] || 0) + 1; return a; }, {}),
  movedFunctions: tabFns, movedFunctionFiles: TABS, movedFunctionFileMaxLines: Math.max(...Object.values(tabFileLines)), stateDefines: plan.filter(p => p.kind === '상태 var → define').flatMap(p => p.names), localVars: plan.filter(p => p.kind === '노출 안 된 var(지역 변수로)').flatMap(p => p.names),
  rewiredDropped: plan.filter(p => p.kind === '가져온 이름의 window 줄(재철거)').flatMap(p => p.names), comments: { outsideStatements: comments.length, followed: commentsFollowed, dropped: commentsDropped, sections: titles.length },
  files: { ...tabFileLines, [CORE]: fs.readFileSync(path.join(DIR, CORE), 'utf8').split('\n').length, [BOOT]: fs.readFileSync(path.join(DIR, BOOT), 'utf8').split('\n').length },
  inlineScriptBlocksLeft: htmlOut.split('\n').filter(l => l.trim() === '<script>').length, registered,
  limits: ['이름 접두 L. 을 붙이지 않았다', '옮긴 함수는 한 파일이 700줄을 넘지 않게 여러 파일로 나눠 담았다(함수 하나가 그보다 크면 그 파일은 넘는다)', '새 파일의 신고서를 쓰지 않았다', '앱이 뜨는지는 보지 않는다'] };
void count;
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify({ byKind: out.byKind, byDestination: out.byDestination, files: out.files, comments: out.comments, rewiredDropped: out.rewiredDropped, registered: out.registered, localVars: out.localVars, stateDefines: out.stateDefines.length }));
