#!/usr/bin/env node
'use strict';
/**
 * 인라인 스크립트 책임 묶음 지도 생성기 (#TASK-ES-423)
 *
 * index.html 의 큰 인라인 IIFE(미분화 덩어리)를 도구로 읽어 「책임 묶음」 지도를 만든다. 손으로 센 수는 없다.
 *   묶음 = IIFE 최상위 구획 주석(`/* ============ 제목 ============ *\/`)에서 다음 구획 주석 앞까지.
 *   묶음마다: 줄 수 · 함수/변수 선언 · 상태(최상위 비함수 변수) 읽기/쓰기 · window 전역 노출 · 이벤트 처리기 ·
 *            로드 중 바로 도는 최상위 문 · 인라인 on*="…" 처리기가 부르는 이름 · 다른 묶음과의 호출 관계(들어옴/나감) ·
 *            바깥 js 파일이 그 묶음의 이름을 쓰는 곳 · 시험지 글자 의존(index.html 한 파일만 읽는 시험지가 이 묶음의 이름·글자를 찾는가)
 *   → 옮기기 난이도 점수와 권장 순서(안전한 것부터).
 *
 * 결정적: 같은 입력이면 같은 출력(시각·난수·파일 순서 의존 0 — 목록은 모두 정렬). 출처는 index.html 내용 해시로 적는다.
 * 사용: NODE_PATH=<node_modules> node scripts/inline-script-map.js [--write] [--root <앱 폴더>]
 *   --write 없으면 요약만 출력한다. --write 면 docs/architecture/INLINE-SCRIPT-MAP.md · inline-script-map.json 을 쓴다.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const args = process.argv.slice(2);
const ROOT = args.includes('--root') ? path.resolve(args[args.indexOf('--root') + 1]) : path.join(__dirname, '..');
const WRITE = args.includes('--write');
const OUT_MD = path.join(ROOT, 'docs', 'architecture', 'INLINE-SCRIPT-MAP.md');
const OUT_JSON = path.join(ROOT, 'docs', 'architecture', 'inline-script-map.json');

const read = f => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const html = read(path.join(ROOT, 'index.html'));
const lines = html.split('\n');
const sha = crypto.createHash('sha256').update(html).digest('hex').slice(0, 12);

// ── 큰 인라인 IIFE 찾기(세포 생성기와 같은 규칙: `<script>` 다음 줄 `(function(){`, 그 다음 줄 "use strict")
let sLine = -1, eLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { sLine = i + 1; break; }
}
if (sLine < 0) throw new Error('큰 인라인 IIFE 를 못 찾음');
for (let i = sLine; i < lines.length; i++) if (lines[i].startsWith('</script>')) { eLine = i; break; }
const off = sLine; // AST 줄 1 = html 줄 sLine+1
const code = lines.slice(sLine, eLine).join('\n');
const ast = parser.parse(code, { sourceType: 'script', ranges: true });
const H = n => n.loc.start.line + off;
const HE = n => n.loc.end.line + off;

// 다른 인라인 <script> 블록(src 없는 것) — 줄 수만 적는다
const otherInline = [];
{
  const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/g; let m;
  while ((m = re.exec(html))) {
    if (m[1] && /\bsrc\s*=/.test(m[1])) continue;
    const startLine = html.slice(0, m.index).split('\n').length;
    if (startLine === sLine) continue;
    otherInline.push({ startLine, lines: m[2].split('\n').length - 1 });
  }
}

let iife = null;
traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iScope = iife.scope;
const top = iife.get('body').get('body');

// ── 묶음 경계: 최상위 문의 앞 주석 중 `/* ===` 로 시작하는 블록 주석
const isHeader = c => c.type === 'CommentBlock' && /^\s*=+/.test(c.value);
const headerTitle = c => (c.value.split('\n').map(l => l.replace(/=+/g, ' ').replace(/\s+/g, ' ').trim()).find(l => l) || '(제목 없음)');
const groups = [];
const firstLine = sLine + 1; // `(function(){` 줄
groups.push({ title: '(IIFE 머리 — "use strict" 와 첫 구획 앞)', start: firstLine, stmts: [] });
for (const st of top) {
  const hs = (st.node.leadingComments || []).filter(isHeader);
  for (const c of hs) {
    // 같은 문 앞에 구획 주석이 둘 이상이면 각각 묶음을 연다(앞 것은 빈 묶음이 된다)
    groups.push({ title: headerTitle(c), start: c.loc.start.line + off, stmts: [] });
  }
  groups[groups.length - 1].stmts.push(st);
}
for (let i = 0; i < groups.length; i++) groups[i].end = i + 1 < groups.length ? groups[i + 1].start - 1 : eLine; // `})();` 줄까지
groups.forEach((g, i) => { g.id = 'G' + String(i).padStart(3, '0'); g.lines = g.end - g.start + 1; });
const SEAM_RE = /모듈 이음매|TASK-ES-354 CORE-07/;
groups.forEach(g => { g.seam = SEAM_RE.test(g.title); });

// ── 최상위 선언 → 묶음
const declGroup = new Map(); // 이름 → 묶음 id
const groupOfLine = l => { for (const g of groups) if (l >= g.start && l <= g.end) return g; return null; };
const nameOfStmtDecls = st => {
  if (st.isFunctionDeclaration()) return [{ n: st.node.id.name, fn: true }];
  if (st.isVariableDeclaration()) return st.node.declarations.filter(d => d.id.type === 'Identifier').map(d => ({ n: d.id.name, fn: !!(d.init && /Function|ArrowFunction/.test(d.init.type)), kind: st.node.kind }));
  if (st.isClassDeclaration()) return [{ n: st.node.id.name, fn: true }];
  return [];
};
for (const g of groups) {
  g.functions = []; g.vars = []; g.loadTime = 0; g.loadTimeKinds = {};
  for (const st of g.stmts) {
    const ds = nameOfStmtDecls(st);
    if (!ds.length) {
      // 로드 중 바로 도는 최상위 문(선언이 아닌 것). 빈 문은 센다에서 뺀다.
      if (!st.isEmptyStatement()) {
        g.loadTime++;
        let k = st.node.type;
        if (st.isExpressionStatement()) {
          const e = st.node.expression;
          if (e.type === 'AssignmentExpression' && e.left.type === 'MemberExpression' && e.left.object.type === 'Identifier' && e.left.object.name === 'window') k = 'window 노출';
          else if (e.type === 'CallExpression') k = '호출';
          else k = '식';
        }
        g.loadTimeKinds[k] = (g.loadTimeKinds[k] || 0) + 1;
      }
    }
    for (const d of ds) {
      declGroup.set(d.n, g.id);
      (d.fn ? g.functions : g.vars).push(d.n);
      // 변수 초기값이 함수 호출 등 부작용이 있을 수 있는 식이면 로드 중 실행으로도 센다
    }
    if (st.isVariableDeclaration()) {
      for (const d of st.node.declarations) {
        const init = d.init;
        if (init && !/Function|ArrowFunction|Literal|ObjectExpression|ArrayExpression|TemplateLiteral|Identifier|MemberExpression|UnaryExpression|BinaryExpression|LogicalExpression|ConditionalExpression/.test(init.type)) {
          g.loadTime++; g.loadTimeKinds['var 초기값 실행'] = (g.loadTimeKinds['var 초기값 실행'] || 0) + 1;
        }
      }
    }
  }
}
const gById = new Map(groups.map(g => [g.id, g]));
const isStateName = n => { const b = iScope.getBinding(n); if (!b) return false; const g = gById.get(declGroup.get(n)); return !!g && g.vars.includes(n); };

// ── 참조 분석: 각 최상위 이름의 참조 위치 → 묶음 간 호출·상태 읽기/쓰기
for (const g of groups) { g.reads = new Set(); g.writes = new Set(); g.mutates = new Set(); g.callsOut = new Map(); g.callsIn = new Map(); g.refsInSites = 0; }
for (const [name, gid] of declGroup) {
  const b = iScope.getBinding(name);
  if (!b) continue;
  const owner = gById.get(gid);
  const state = isStateName(name);
  const sites = b.referencePaths.map(r => ({ p: r, kind: 'read' }))
    .concat(b.constantViolations.filter(v => !(v.isVariableDeclarator() && v.node.id && v.node.id.name === name && H(v.node) >= owner.start && H(v.node) <= owner.end)).map(v => ({ p: v, kind: 'write' })));
  for (const s of sites) {
    const g = groupOfLine(H(s.p.node));
    if (!g || g.id === gid) continue;
    if (state) {
      if (s.kind === 'write') g.writes.add(name);
      else {
        // name.x = … / name.x++ / name[x] = … 는 내용 변경으로 본다
        const par = s.p.parentPath;
        let mut = false;
        if (par && par.isMemberExpression() && par.node.object === s.p.node) {
          const gp = par.parentPath;
          if (gp && ((gp.isAssignmentExpression() && gp.node.left === par.node) || gp.isUpdateExpression())) mut = true;
          if (gp && gp.isCallExpression() && gp.node.callee === par.node && par.node.property && /^(push|pop|shift|unshift|splice|sort|reverse|set|delete|clear|add)$/.test(par.node.property.name || '')) mut = true;
        }
        (mut ? g.mutates : g.reads).add(name);
      }
    } else {
      g.callsOut.set(gid, (g.callsOut.get(gid) || 0) + 1);
      owner.callsIn.set(g.id, (owner.callsIn.get(g.id) || 0) + 1);
      owner.refsInSites++;
    }
  }
}

// ── window 전역 노출(module-metrics 와 같은 정규식, 주석만 있는 줄 제외)
const RE_WINDOW_ASSIGN = /\bwindow\s*(?:\.\s*([A-Za-z_$][\w$]*)|\[\s*['"]([^'"]+)['"]\s*\])\s*=(?![=>])/g;
const blankComment = s => s.split('\n').map(l => (/^\s*(\/\/|\/\*|\*)/.test(l) ? '' : l)).join('\n');
for (const g of groups) {
  const text = blankComment(lines.slice(g.start - 1, g.end).join('\n'));
  const names = []; let m; RE_WINDOW_ASSIGN.lastIndex = 0;
  while ((m = RE_WINDOW_ASSIGN.exec(text))) names.push(m[1] || m[2]);
  g.windowNames = [...new Set(names)].sort();
  g.windowAssignments = names.length;
}

// ── 이벤트 처리기: addEventListener 호출 · on<이벤트> = 대입 (깊이 무관)
for (const g of groups) { g.listeners = 0; g.onProps = 0; }
iife.traverse({
  CallExpression(p) {
    const c = p.node.callee;
    if (c.type === 'MemberExpression' && !c.computed && c.property.name === 'addEventListener') { const g = groupOfLine(H(p.node)); if (g) g.listeners++; }
  },
  AssignmentExpression(p) {
    const l = p.node.left;
    if (l.type === 'MemberExpression' && !l.computed && /^on[a-z]+$/.test(l.property.name)) { const g = groupOfLine(H(p.node)); if (g) g.onProps++; }
  }
});

// ── 인라인 on*="…" 처리기(마크업 + 스크립트 안 템플릿 문자열 모두)가 부르는 이름
const inlineHandlerNames = new Map(); // 이름 → 등장 수
{
  const reAttr = /\son[a-z]+\s*=\s*(\\?["'])([\s\S]*?)\1/g;
  const appSources = [html];
  const listJs = d => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1)).flatMap(e => e.isDirectory() ? listJs(path.join(d, e.name)) : (e.name.endsWith('.js') ? [path.join(d, e.name)] : [])) : [];
  for (const f of listJs(path.join(ROOT, 'js'))) appSources.push(read(f));
  for (const src of appSources) {
    let m; reAttr.lastIndex = 0;
    while ((m = reAttr.exec(src))) {
      const body = m[2]; const reId = /([A-Za-z_$][\w$]*)\s*\(/g; let k;
      while ((k = reId.exec(body))) {
        const n = k[1]; if (!declGroup.has(n)) continue;
        if (body[k.index - 1] === '.' && !/window\.$/.test(body.slice(0, k.index))) continue;
        inlineHandlerNames.set(n, (inlineHandlerNames.get(n) || 0) + 1);
      }
    }
  }
}
for (const g of groups) g.inlineHandlers = g.functions.filter(n => inlineHandlerNames.has(n)).sort();

// ── 바깥 js 파일(js/**·ui.js)이 이 묶음이 window 에 단 이름을 쓰는 곳
const extFiles = [];
{
  const listJs = d => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1)).flatMap(e => e.isDirectory() ? listJs(path.join(d, e.name)) : (e.name.endsWith('.js') ? [path.join(d, e.name)] : [])) : [];
  for (const f of listJs(path.join(ROOT, 'js'))) extFiles.push({ f: path.relative(ROOT, f).replace(/\\/g, '/'), t: read(f) });
  if (fs.existsSync(path.join(ROOT, 'ui.js'))) extFiles.push({ f: 'ui.js', t: read(path.join(ROOT, 'ui.js')) });
}
const wordRe = n => new RegExp('(^|[^A-Za-z0-9_$])' + n.replace(/\$/g, '\\$') + '(?![A-Za-z0-9_$])');
for (const g of groups) {
  const set = new Set();
  for (const n of g.windowNames) { const re = wordRe(n); for (const x of extFiles) if (re.test(x.t)) set.add(x.f); }
  g.externalFiles = [...set].sort();
}

// ── 시험지 글자 의존: tests/*.js · scripts/(smoke-test|verify-all-clicks|verify-integrity-gate|test-*).js 중
//    이 묶음의 함수·변수 이름(6자 이상) 또는 문자열 글자(8자 이상)를 담은 파일. 합본(js/tabs·js/core 포함)을 읽는 시험지와 index.html 만 읽는 시험지를 나눈다.
const testFiles = [];
{
  const td = path.join(ROOT, 'tests');
  if (fs.existsSync(td)) for (const f of fs.readdirSync(td).sort()) if (f.endsWith('.js')) testFiles.push(path.join(td, f));
  const sd = path.join(ROOT, 'scripts');
  for (const f of fs.readdirSync(sd).sort()) if (/^(smoke-test|verify-all-clicks|verify-integrity-gate|test-.*)\.js$/.test(f)) testFiles.push(path.join(sd, f));
}
const tests = testFiles.map(f => {
  const t = read(f);
  const readsIndex = /index\.html/.test(t);
  const union = /js\/tabs|js', 'tabs'|APP_MODULE|components-bundle/.test(t);
  return { f: path.relative(ROOT, f).replace(/\\/g, '/'), t, readsIndex, union };
}).filter(x => x.readsIndex);
const smokeFn = (() => { const s = tests.find(x => x.f === 'scripts/smoke-test.js'); const m = s && s.t.match(/const FN_NAMES = \[([\s\S]*?)\];/); return new Set(m ? (m[1].match(/'([^']+)'/g) || []).map(x => x.slice(1, -1)) : []); })();
// 흔한 글자('function' 같은 typeof 비교 등)는 거른다: 시험지 8곳 넘게 나오는 글자는 그 묶음 고유의 글자가 아니다.
const litHits = new Map();
const litSpecific = l => { if (!litHits.has(l)) { let c = 0; for (const x of tests) if (x.t.includes(l)) c++; litHits.set(l, c); } return litHits.get(l) <= 8; };
const testLitCache = new Map();
const testLits = x => {
  if (!testLitCache.has(x.f)) {
    const out = new Set(); const re = /'((?:[^'\\\n]|\\.){8,})'|"((?:[^"\\\n]|\\.){8,})"|`([^`$\\]{8,})`/g; let m;
    while ((m = re.exec(x.t))) { const v = m[1] || m[2] || m[3]; if (!/\\/.test(v) && code.includes(v)) out.add(v); }
    testLitCache.set(x.f, [...out].sort());
  }
  return testLitCache.get(x.f);
};
const groupTexts = groups.map(g => lines.slice(g.start - 1, g.end).join('\n'));
const litGroupCnt = new Map();
const litGroupCount = l => { if (!litGroupCnt.has(l)) litGroupCnt.set(l, groupTexts.filter(t => t.includes(l)).length); return litGroupCnt.get(l); };
for (const g of groups) {
  const lits = new Set();
  for (const st of g.stmts) st.traverse({
    StringLiteral(p) { if (p.node.value.length >= 8 && !/^\s*$/.test(p.node.value)) lits.add(p.node.value); },
    TemplateElement(p) { const v = p.node.value.cooked || ''; for (const piece of v.split(/[<>\n]/)) if (piece.trim().length >= 8) lits.add(piece.trim()); }
  });
  const names = g.functions.concat(g.vars).filter(n => n.length >= 6);
  const byName = new Set(), byLit = new Set();
  for (const x of tests) {
    for (const n of names) if (wordRe(n).test(x.t)) { byName.add(x.f); break; }
    if (!byName.has(x.f)) for (const l of lits) if (litSpecific(l) && x.t.includes(l)) { byLit.add(x.f); break; }
  }
  // 거꾸로: 시험지의 문자열(8자 이상)이 이 묶음 원문에 그대로 있는가(코드 조각 단언 `'canvas.width = 1080;'` 같은 것). 묶음 3곳 넘게 나오는 글자는 고유하지 않아 뺀다.
  const gText = lines.slice(g.start - 1, g.end).join('\n');
  for (const x of tests) {
    if (byName.has(x.f) || byLit.has(x.f)) continue;
    for (const l of testLits(x)) if (litGroupCount(l) <= 3 && gText.includes(l)) { byLit.add(x.f); break; }
  }
  const all = [...new Set([...byName, ...byLit])].sort();
  g.testFiles = all;
  g.testIndexOnly = all.filter(f => { const x = tests.find(y => y.f === f); return !x.union; });
  g.smokeFnNames = g.functions.filter(n => smokeFn.has(n)).sort();
}

// ── 난이도 점수(낮을수록 안전). 가중치는 지도 머리에 그대로 적는다.
const W = { stateWrite: 4, stateMutate: 2, stateRead: 1, loadTime: 2, inlineHandler: 2, fanInGroup: 1, windowName: 1, externalFile: 1, testIndexOnly: 3, smokeFn: 5 };
for (const g of groups) {
  g.fanInGroups = g.callsIn.size; g.fanOutGroups = g.callsOut.size;
  g.score = W.stateWrite * g.writes.size + W.stateMutate * g.mutates.size + W.stateRead * g.reads.size + W.loadTime * g.loadTime
    + W.inlineHandler * g.inlineHandlers.length + W.fanInGroup * g.fanInGroups + W.windowName * g.windowNames.length
    + W.externalFile * g.externalFiles.length + W.testIndexOnly * g.testIndexOnly.length + W.smokeFn * g.smokeFnNames.length;
  g.tier = g.seam ? '이음매(옮기지 않음)' : (!g.functions.length && !g.vars.length) ? '빈 구획' : g.score <= 8 ? '쉬움' : g.score <= 25 ? '보통' : '어려움';
}

// ── 출력 데이터
const totalLines = eLine - sLine; // `(function(){` ~ `})();`
const jsonGroups = groups.map(g => ({
  id: g.id, title: g.title, start: g.start, end: g.end, lines: g.lines, seam: g.seam, tier: g.tier, score: g.score,
  functions: g.functions.slice().sort(), vars: g.vars.slice().sort(),
  stateReads: [...g.reads].sort(), stateMutates: [...g.mutates].sort(), stateWrites: [...g.writes].sort(),
  loadTime: g.loadTime, loadTimeKinds: g.loadTimeKinds,
  windowAssignments: g.windowAssignments, windowNames: g.windowNames,
  listeners: g.listeners, onProps: g.onProps, inlineHandlers: g.inlineHandlers,
  fanIn: [...g.callsIn.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([id, c]) => ({ id, refs: c })),
  fanOut: [...g.callsOut.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([id, c]) => ({ id, refs: c })),
  externalFiles: g.externalFiles, testFiles: g.testFiles, testIndexOnly: g.testIndexOnly, smokeFnNames: g.smokeFnNames,
}));
const movable = jsonGroups.filter(g => !g.seam && (g.functions.length || g.vars.length));
const order = movable.slice().sort((a, b) => a.score - b.score || b.lines - a.lines || (a.id < b.id ? -1 : 1));
const data = {
  schema: 'ourgoal.inline-script-map/1',
  source: { file: 'index.html', sha256_12: sha, iifeHtmlLines: [sLine + 1, eLine], otherInlineBlocks: otherInline },
  weights: W,
  totals: {
    iifeLines: totalLines, groups: groups.length, seamGroups: groups.filter(g => g.seam).length, movableGroups: movable.length,
    functions: groups.reduce((s, g) => s + g.functions.length, 0), vars: groups.reduce((s, g) => s + g.vars.length, 0),
    windowAssignments: groups.reduce((s, g) => s + g.windowAssignments, 0), listeners: groups.reduce((s, g) => s + g.listeners, 0),
    onProps: groups.reduce((s, g) => s + g.onProps, 0), loadTime: groups.reduce((s, g) => s + g.loadTime, 0),
    inlineHandlerNames: inlineHandlerNames.size,
    tiers: groups.reduce((o, g) => { o[g.tier] = (o[g.tier] || 0) + 1; return o; }, {}),
    tierLines: groups.reduce((o, g) => { o[g.tier] = (o[g.tier] || 0) + g.lines; return o; }, {}),
  },
  recommendedOrder: order.map(g => g.id),
  groups: jsonGroups,
};

// ── 마크다운
const esc = s => String(s).replace(/\|/g, '\\|');
const cut = (arr, n) => arr.length > n ? arr.slice(0, n).join(', ') + ` 외 ${arr.length - n}` : arr.join(', ');
const md = [];
md.push('# index.html 인라인 스크립트 책임 묶음 지도');
md.push('');
md.push('> 생성: `NODE_PATH=<node_modules> node scripts/inline-script-map.js --write` (#TASK-ES-423). **손으로 고치지 않는다** — 다시 만들면 같은 입력에서 같은 글자가 나온다(결정적).');
md.push(`> 출처: \`index.html\` sha256 앞 12자 \`${sha}\` · 큰 인라인 IIFE ${sLine + 1}~${eLine}줄(${totalLines}줄)` + (otherInline.length ? ` · 다른 인라인 블록 ${otherInline.map(b => b.startLine + '줄(' + b.lines + '줄)').join(', ')}` : '') + '.');
md.push('');
md.push('## 1. 요약');
md.push('');
const T = data.totals;
md.push(`- 묶음 ${T.groups}개(이음매 ${T.seamGroups} · 옮길 대상 ${T.movableGroups} · 빈 구획 ${T.tiers['빈 구획'] || 0}). 묶음 = IIFE 최상위 구획 주석 \`/* ============ 제목 ============ */\` 에서 다음 구획 주석 앞까지.`);
md.push(`- 최상위 함수 ${T.functions} · 최상위 변수 ${T.vars} · window 전역 대입 ${T.windowAssignments}줄(module-metrics ③ 의 index.html 몫과 같은 정규식) · addEventListener ${T.listeners} · on<이벤트> 대입 ${T.onProps} · 로드 중 바로 도는 최상위 문 ${T.loadTime} · 인라인 on*="…" 처리기가 부르는 IIFE 이름 ${T.inlineHandlerNames}개.`);
md.push(`- 난이도 묶음 수(줄): ` + ['쉬움', '보통', '어려움', '빈 구획', '이음매(옮기지 않음)'].filter(k => T.tiers[k]).map(k => `${k} ${T.tiers[k]}(${T.tierLines[k]}줄)`).join(' · ') + '.');
md.push('');
md.push('### 난이도 점수(낮을수록 안전하게 옮긴다)');
md.push('');
md.push('`점수 = ' + Object.entries(W).map(([k, v]) => v + '×' + k).join(' + ') + '`');
md.push('');
md.push('- stateWrite: 다른 묶음이 선언한 최상위 변수에 대입 · stateMutate: 그 변수의 속성 대입·push 등 · stateRead: 읽기(각각 서로 다른 변수 수)');
md.push('- loadTime: 로드 중 바로 도는 최상위 문(등록·노출·초기화 — 옮기면 원래 자리에서 불러야 한다) · inlineHandler: 마크업·템플릿의 on*="이름(…)" 이 부르는 이 묶음 함수 수');
md.push('- fanInGroup: 이 묶음 이름을 부르는 다른 묶음 수 · windowName: 이 묶음이 window 에 다는 이름 수 · externalFile: 그 이름을 쓰는 바깥 js 파일 수');
md.push('- testIndexOnly: index.html 한 파일만 읽는 시험지 중 이 묶음의 이름(6자 이상)·문자열 글자(8자 이상, 시험지 8곳 넘게 나오는 흔한 글자 제외)를 담은 파일 수 — 옮기면 시험지 선행 PR 이 먼저 필요할 수 있다 · smokeFn: smoke-test FN_NAMES(인라인에서 함수를 잘라 실행)에 든 함수 수');
md.push('- 등급: 쉬움 ≤ 8 < 보통 ≤ 25 < 어려움. 시험지 글자 의존은 이름·글자 포함 여부만 본 넉넉한 근사다(실제로 깨지는지는 옮겨 보고 시험으로 확인).');
md.push('');
md.push('## 2. 큰 묶음 상위 10 (줄 수)');
md.push('');
md.push('| 묶음 | 제목 | 줄 | 함수 | 난이도(점수) | 상태 쓰기/변경/읽기 | 로드 중 문 | 들어옴 묶음 | 시험지(index 단독) |');
md.push('|---|---|--:|--:|---|---|--:|--:|--:|');
for (const g of jsonGroups.slice().sort((a, b) => b.lines - a.lines || (a.id < b.id ? -1 : 1)).slice(0, 10)) {
  md.push(`| ${g.id} | ${esc(g.title.slice(0, 70))} | ${g.lines} | ${g.functions.length} | ${g.tier}(${g.score}) | ${g.stateWrites.length}/${g.stateMutates.length}/${g.stateReads.length} | ${g.loadTime} | ${g.fanIn.length} | ${g.testFiles.length}(${g.testIndexOnly.length}) |`);
}
md.push('');
md.push('## 3. 권장 순서 (안전한 것부터, 상위 30)');
md.push('');
md.push('같은 점수면 큰 묶음 먼저(한 번 옮겨 많이 줄인다). 로드 중 문이 있는 묶음은 함수만 옮기고 그 문은 원래 자리에 남긴다(MODULE-SPLIT-PROTOCOL 3절).');
md.push('');
md.push('| 순서 | 묶음 | 제목 | 줄 | 점수 | 근거(점수가 생긴 곳) |');
md.push('|--:|---|---|--:|--:|---|');
order.slice(0, 30).forEach((g, i) => {
  const why = [];
  if (g.stateWrites.length) why.push('상태 대입 ' + g.stateWrites.length);
  if (g.stateMutates.length) why.push('상태 변경 ' + g.stateMutates.length);
  if (g.stateReads.length) why.push('상태 읽기 ' + g.stateReads.length);
  if (g.loadTime) why.push('로드 중 문 ' + g.loadTime);
  if (g.inlineHandlers.length) why.push('인라인 처리기 ' + g.inlineHandlers.length);
  if (g.fanIn.length) why.push('들어옴 ' + g.fanIn.length);
  if (g.windowNames.length) why.push('window ' + g.windowNames.length);
  if (g.externalFiles.length) why.push('바깥 파일 ' + g.externalFiles.length);
  if (g.testIndexOnly.length) why.push('시험지(index 단독) ' + g.testIndexOnly.length);
  if (g.smokeFnNames.length) why.push('FN_NAMES ' + g.smokeFnNames.length);
  md.push(`| ${i + 1} | ${g.id} | ${esc(g.title.slice(0, 60))} | ${g.lines} | ${g.score} | ${why.join(' · ') || '없음'} |`);
});
md.push('');
md.push('## 4. 전체 묶음 표');
md.push('');
md.push('| 묶음 | 줄 범위 | 줄 | 제목 | 함수 | 변수 | 난이도(점수) | 상태 쓰기 · 변경 · 읽기 | window | 처리기(add/on) | 로드 중 문 | 인라인 처리기 | 들어옴/나감 묶음 | 바깥 파일 | 시험지(index 단독) |');
md.push('|---|---|--:|---|--:|--:|---|---|--:|---|--:|--:|---|--:|---|');
for (const g of jsonGroups) {
  md.push(`| ${g.id} | ${g.start}~${g.end} | ${g.lines} | ${esc(g.title.slice(0, 60))} | ${g.functions.length} | ${g.vars.length} | ${g.tier}(${g.score}) | ${g.stateWrites.length} · ${g.stateMutates.length} · ${g.stateReads.length} | ${g.windowAssignments} | ${g.listeners}/${g.onProps} | ${g.loadTime} | ${g.inlineHandlers.length} | ${g.fanIn.length}/${g.fanOut.length} | ${g.externalFiles.length} | ${g.testFiles.length}(${g.testIndexOnly.length}) |`);
}
md.push('');
md.push('## 5. 묶음별 의존 상세 (옮길 대상만, 권장 순서)');
md.push('');
for (const g of order) {
  md.push(`### ${g.id} ${esc(g.title.slice(0, 90))}`);
  md.push('');
  md.push(`- ${g.start}~${g.end}줄(${g.lines}줄) · ${g.tier}(${g.score})`);
  md.push(`- 함수(${g.functions.length}): ${cut(g.functions, 20) || '없음'}`);
  if (g.vars.length) md.push(`- 변수(${g.vars.length}): ${cut(g.vars, 20)}`);
  if (g.stateWrites.length || g.stateMutates.length || g.stateReads.length) md.push(`- 다른 묶음 상태 — 대입: ${cut(g.stateWrites, 12) || '없음'} · 변경: ${cut(g.stateMutates, 12) || '없음'} · 읽기: ${cut(g.stateReads, 12) || '없음'}`);
  if (g.loadTime) md.push(`- 로드 중 문 ${g.loadTime}: ${Object.entries(g.loadTimeKinds).map(([k, v]) => k + ' ' + v).join(' · ')}`);
  if (g.windowNames.length) md.push(`- window 노출(${g.windowAssignments}줄): ${cut(g.windowNames, 15)}`);
  if (g.listeners || g.onProps) md.push(`- 이벤트 처리기: addEventListener ${g.listeners} · on<이벤트> 대입 ${g.onProps}`);
  if (g.inlineHandlers.length) md.push(`- 인라인 on*="…" 이 부르는 함수: ${cut(g.inlineHandlers, 15)}`);
  if (g.fanIn.length) md.push(`- 부르는 묶음(들어옴): ${cut(g.fanIn.map(x => x.id + '×' + x.refs), 10)}`);
  if (g.fanOut.length) md.push(`- 부르는 대상(나감): ${cut(g.fanOut.map(x => x.id + '×' + x.refs), 10)}`);
  if (g.externalFiles.length) md.push(`- 바깥 js 가 window 이름을 씀: ${cut(g.externalFiles, 8)}`);
  if (g.testFiles.length) md.push(`- 시험지 글자 의존: ${cut(g.testFiles, 8)}${g.testIndexOnly.length ? ' (index.html 단독 읽기: ' + cut(g.testIndexOnly, 8) + ')' : ''}`);
  if (g.smokeFnNames.length) md.push(`- smoke-test FN_NAMES: ${g.smokeFnNames.join(', ')} — 옮기려면 시험지 선행 PR 먼저`);
  md.push('');
}
md.push('## 6. 이음매·빈 구획');
md.push('');
for (const g of jsonGroups.filter(g => g.seam || (!g.functions.length && !g.vars.length))) md.push(`- ${g.id} ${g.start}~${g.end}(${g.lines}줄) ${esc(g.title.slice(0, 90))} — ${g.tier}${g.loadTime ? ' · 로드 중 문 ' + g.loadTime : ''}`);
md.push('');
const mdText = md.join('\n');
const jsonText = JSON.stringify(data, null, 1) + '\n';

if (WRITE) {
  fs.writeFileSync(OUT_MD, mdText, 'utf8');
  fs.writeFileSync(OUT_JSON, jsonText, 'utf8');
}
console.log(`인라인 지도: 묶음 ${T.groups} · 옮길 대상 ${T.movableGroups} · IIFE ${totalLines}줄 · 함수 ${T.functions} · window ${T.windowAssignments} · 출처 ${sha}` + (WRITE ? ' → 기록함' : ''));
console.log('권장 순서 상위 10: ' + order.slice(0, 10).map(g => `${g.id}(${g.lines}줄·${g.score})`).join(' '));
