#!/usr/bin/env node
'use strict';
/**
 * 인라인 어려움 묶음 유형 집계기 (#TASK-ES-439)
 *
 * scripts/inline-script-map.js 지도(docs/architecture/inline-script-map.json)에서 난이도 「어려움」 묶음만 골라,
 * 왜 어려운지를 유형별로 도구로 센다(손 계산 0). 지도에 없는 사실은 index.html 을 다시 파싱해 더한다.
 *
 * 유형(한 묶음이 여러 유형에 걸릴 수 있다):
 *   A1 남의 상태 재대입      — 다른 묶음이 선언한 최상위 let/var 에 대입(지도 stateWrites)
 *   A2 내 상태를 남이 씀     — 이 묶음이 선언한 최상위 변수를 다른 묶음이 읽거나 바꾼다(옮기면 선언을 원본에 남기고 통로로 읽어야 한다)
 *   B1 로드 중 window 노출   — 최상위 `window.X = …` 문
 *   B2 로드 때 이벤트 등록   — addEventListener / on<이벤트> 대입을 담은 최상위 문
 *   B3 로드 중 다른 문       — 위 둘이 아닌 최상위 실행 문(호출·if·try·var 초기값 실행 등)
 *   C  인라인 on*="이름()"   — 마크업·템플릿의 인라인 처리기가 부르는 이 묶음 함수(지도 inlineHandlers)
 *   D  큰 상수               — 최상위 변수 초기값이 객체·배열·템플릿 글자로 30줄 이상
 *   E  순환 호출             — 묶음 호출 그래프의 강한 연결 요소(크기 2 이상)에 든다
 *   F1 시험지 단독 의존(근사) — index.html 한 파일만 읽는 시험지가 이 묶음의 이름·글자를 찾는다(지도 testIndexOnly — 넉넉한 근사)
 *   F1m 시험지 선행 필요(실측) — scripts/inline-hard-test-probe.js 가 묶음을 표준 이음매대로 비워 그 시험지를 돌렸더니 통과 → 실패(docs/architecture/inline-hard-test-probe.json)
 *   F2 smoke FN_NAMES        — 시험지가 인라인에서 함수를 잘라 실행(지도 smokeFnNames)
 *   G  800줄 초과            — 한 세포에 다 못 담아 책임 단위로 둘 이상 나눠야 한다
 *   H  함수 재대입           — 최상위 함수 이름에 대입(덮어쓰기·감싸기)이 있다(이 묶음이 하거나 당한다)
 *   I  공용 부품             — 이 묶음 이름을 부르는 다른 묶음이 10개 이상(기관 세포 후보)
 *   J  바깥 파일이 window 이름을 씀 — 노출 순서를 지켜야 한다(지도 externalFiles)
 *   K  최상위 this/arguments — 옮길 함수 본문 최상위에서 this·arguments 를 쓴다(객체 경유 호출이면 값이 달라진다)
 *   L  통로에 없는 인라인 이름 — 다른 묶음의 최상위 이름(상수·함수)을 쓰는데 아직 OurgoalAppScope.expose getter 가 없다(예: BADGES·badgeContext)
 *   M  덮어쓰는 키트(전역 목록) — js 파일이 `global.X = { … }` 로 전역 객체를 통째로 새로 대입한다(X || {} 아님). 그 키트에 세포 이름을 달면 태그 순서에 따라 지워진다
 *
 * 결정적: 시각·난수 없음, 목록 정렬. 출처는 지도의 index.html 해시.
 * 사용: NODE_PATH=<node_modules> node scripts/inline-hard-types.js [--write] [--root <앱 폴더>] [--zones 4]
 *   --write: docs/architecture/inline-hard-types.json 을 쓰고 docs/architecture/INLINE-HARD-SPLIT-DESIGN.md 의
 *            <!-- hard-types:begin --> … <!-- hard-types:end --> 사이를 표로 갈아 끼운다.
 */
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const args = process.argv.slice(2);
const ROOT = args.includes('--root') ? path.resolve(args[args.indexOf('--root') + 1]) : path.join(__dirname, '..');
const WRITE = args.includes('--write');
const ZONES = args.includes('--zones') ? Number(args[args.indexOf('--zones') + 1]) : 4;
const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'architecture', 'inline-script-map.json'), 'utf8'));
const OUT_JSON = path.join(ROOT, 'docs', 'architecture', 'inline-hard-types.json');
const PROBE = (() => { const p = path.join(ROOT, 'docs', 'architecture', 'inline-hard-test-probe.json'); if (!fs.existsSync(p)) return null; const j = JSON.parse(fs.readFileSync(p, 'utf8')); return j.source.indexSha256_12 === MAP.source.sha256_12 ? j : null; })();
// 다른 시범·빌더에 배정된 묶음(제목 일부로 찾는다 — 묶음 번호는 앞 묶음이 사라지면 밀린다)
// 앞이 '=' 이면 제목 전체가 같아야 한다
const ASSIGNED = [['캘린더 날짜 클릭 시 해당 일자 일정 수정/관리 허브 모달', '안티그래비티 시범(2026-10-05 배정)'], ['=RENDER: HOME', '안티그래비티 몫(2026-10-05 배정)'], ['5대 테마 온톨로지 & 경량 AI 분류기', '안티그래비티 몫(2026-10-05 배정)'], ['11인 외부 UI/UX 감시 및 개선팀 핵심 기능', '안티그래비티 몫(2026-10-05 배정)'], ['서버 관리자 API를 통한 기록 및 프로필 복구', '안티그래비티 몫(2026-10-05 배정)'], ['체크인 입력 글자수 힌트 (#TASK-ES-367', '#TASK-ES-439 시범(PR #762 — 처리기 두 개를 옮기고 상태 변수 선언만 남음)'], ['#TASK-UIUX-PHASE6-COMM-SETTINGS FUNCTIONS', '#TASK-ES-439 시범(PR #762 — 설정 네 함수 옮김, 소통 허브 세 함수는 숨은 UI 라 남김)'], ['=Enter app', '2차 빌더(2026-10-05 배정)'], ['=Render all', '2차 빌더(2026-10-05 배정)']];
const DESIGN_MD = path.join(ROOT, 'docs', 'architecture', 'INLINE-HARD-SPLIT-DESIGN.md');

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
const crypto = require('crypto');
const sha = crypto.createHash('sha256').update(html).digest('hex').slice(0, 12);
if (MAP.source && MAP.source.sha256_12 && MAP.source.sha256_12 !== sha) {
  throw new Error('지도가 지금 index.html 과 다르다 — 먼저 node scripts/inline-script-map.js --write (지도 ' + MAP.source.sha256_12 + ' · 지금 ' + sha + ')');
}
const lines = html.split('\n');
let sLine = -1, eLine = -1;
for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { sLine = i + 1; break; }
for (let i = sLine; i < lines.length; i++) if (lines[i].startsWith('</script>')) { eLine = i; break; }
const off = sLine;
const ast = parser.parse(lines.slice(sLine, eLine).join('\n'), { sourceType: 'script', ranges: true });
let iife = null;
traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iScope = iife.scope;
const top = iife.get('body').get('body');
const H = n => n.loc.start.line + off, HE = n => n.loc.end.line + off;

const groups = MAP.groups;
const gOfLine = l => groups.find(g => l >= g.start && l <= g.end) || null;
const hard = groups.filter(g => g.tier === '어려움');
const hardIds = new Set(hard.map(g => g.id));

// 최상위 문 → 묶음
const stmtsOf = new Map(groups.map(g => [g.id, []]));
for (const st of top) { const g = gOfLine(H(st.node)); if (g) stmtsOf.get(g.id).push(st); }

const declNames = st => {
  if (st.isFunctionDeclaration() || st.isClassDeclaration()) return [st.node.id.name];
  if (st.isVariableDeclaration()) return st.node.declarations.filter(d => d.id.type === 'Identifier').map(d => d.id.name);
  return [];
};
const containsCall = (st, re) => { let hit = false; st.traverse({ CallExpression(p) { const c = p.node.callee; if (c.type === 'MemberExpression' && !c.computed && re.test(c.property.name)) { hit = true; p.stop(); } }, AssignmentExpression(p) { const l = p.node.left; if (l.type === 'MemberExpression' && !l.computed && /^on[a-z]+$/.test(l.property.name)) { hit = true; p.stop(); } } }); return hit; };

// E: 묶음 호출 그래프(지도 fanOut) 의 강한 연결 요소(Tarjan)
const adj = new Map(groups.map(g => [g.id, (g.fanOut || []).map(x => x.id)]));
const sccOf = new Map();
{
  let idx = 0; const st = []; const on = new Set(); const index = new Map(); const low = new Map(); let comp = 0;
  const strong = v => {
    index.set(v, idx); low.set(v, idx); idx++; st.push(v); on.add(v);
    for (const w of adj.get(v) || []) {
      if (!index.has(w)) { strong(w); low.set(v, Math.min(low.get(v), low.get(w))); }
      else if (on.has(w)) low.set(v, Math.min(low.get(v), index.get(w)));
    }
    if (low.get(v) === index.get(v)) { const c = []; let w; do { w = st.pop(); on.delete(w); c.push(w); } while (w !== v); comp++; for (const x of c) sccOf.set(x, c.length > 1 ? 'S' + comp : null); }
  };
  for (const g of groups) if (!index.has(g.id)) strong(g.id);
}
// 머리에 이미 노출된 getter 이름(모든 expose 호출)
const EXPOSED = new Set();
iife.traverse({ CallExpression(p) { const c = p.node.callee; if (c.type === 'MemberExpression' && !c.computed && c.property.name === 'expose' && p.node.arguments[1] && p.node.arguments[1].properties) for (const pr of p.node.arguments[1].properties) if (pr.key) EXPOSED.add(pr.key.name); } });
// 묶음 안에서 쓰는, 다른 묶음이 선언한 최상위 이름(함수·변수)
const namesUsedFromOthers = g => { const out = new Set(); for (const [n, b] of Object.entries(iScope.bindings)) { const dg = gOfLine(H(b.path.node)); if (!dg || dg.id === g.id) continue; if (b.referencePaths.some(r => { const l = H(r.node); return l >= g.start && l <= g.end; })) out.add(n); } return [...out]; };
// 덮어쓰는 키트: js/** 에서 `global.X = {` / `window.X = {` (X || {} 없이) — 세포를 그 키트에 달면 그 파일 태그 뒤에 넣어야 한다
const OVERWRITE_KITS = (() => { const out = []; const walk = d => fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1)).forEach(e => { const p = path.join(d, e.name); if (e.isDirectory()) return walk(p); if (!e.name.endsWith('.js')) return; const t = fs.readFileSync(p, 'utf8'); const re = /(?:global|window)\.(Ourgoal\w+)\s*=\s*(\{|[A-Za-z_$][\w$]*\s*;)/g; let m; while ((m = re.exec(t))) { const name = m[1]; if (new RegExp('(?:global|window)\\.' + name + '\\s*=\\s*(?:global|window)\\.' + name + '\\s*\\|\\|').test(t)) continue; out.push({ kit: name, file: path.relative(ROOT, p).replace(/\\/g, '/') }); } }); walk(path.join(ROOT, 'js')); return out; })();
const sccSize = new Map();
for (const [, s] of sccOf) if (s) sccSize.set(s, (sccSize.get(s) || 0) + 1);
// 2자 순환(서로 부름) 짝 — 설계 근거용
const mutual = (a) => (adj.get(a) || []).filter(b => (adj.get(b) || []).includes(a)).sort();

const TYPES = [
  ['A1', '남의 상태 재대입'], ['A2', '내 상태를 남이 씀·읽음'], ['B1', '로드 중 window 노출'], ['B2', '로드 때 이벤트 등록'], ['B3', '로드 중 다른 문'],
  ['C', '인라인 on*="이름()"'], ['D', '큰 상수(30줄 이상)'], ['E', '순환 호출(SCC)'], ['F1', '시험지 단독 의존(근사)'], ['F1m', '시험지 선행 필요(실측)'], ['F2', 'smoke FN_NAMES'],
  ['G', '800줄 초과'], ['H', '함수 재대입'], ['I', '공용 부품(들어옴 10+)'], ['J', '바깥 파일이 window 이름 씀'], ['K', '최상위 this/arguments'], ['L', '통로에 없는 인라인 이름 참조'],
];

const rows = [];
for (const g of hard) {
  const sts = stmtsOf.get(g.id);
  const t = {};
  const add = (k, v) => { if (!t[k]) t[k] = []; t[k].push(v); };
  for (const n of g.stateWrites) add('A1', n);
  // A2 · D · H · K · B*
  for (const st of sts) {
    const names = declNames(st);
    if (!names.length) {
      if (st.isEmptyStatement()) continue;
      const e = st.isExpressionStatement() && st.node.expression;
      const ln = H(st.node) + '~' + HE(st.node);
      if (e && e.type === 'AssignmentExpression' && e.left.type === 'MemberExpression' && e.left.object.type === 'Identifier' && e.left.object.name === 'window') add('B1', ln);
      else if (containsCall(st, /^addEventListener$/)) add('B2', ln);
      else add('B3', ln);
      continue;
    }
    for (const n of names) {
      const b = iScope.getBinding(n);
      if (!b) continue;
      const fn = b.path.isFunctionDeclaration();
      const viol = b.constantViolations.filter(v => !(v.isVariableDeclarator() && v.node.id && v.node.id.name === n && H(v.node) >= g.start && H(v.node) <= g.end));
      if (fn) {
        if (viol.length) add('H', n + '(덮어씀 ' + viol.map(v => H(v.node)).join(',') + ')');
        let bad = 0;
        b.path.get('body').traverse({ Function(p) { if (!p.isArrowFunctionExpression()) p.skip(); }, ThisExpression() { bad++; }, Identifier(p) { if (p.node.name === 'arguments' && p.isReferencedIdentifier()) bad++; } });
        if (bad) add('K', n);
      } else if (b.path.isVariableDeclarator()) {
        const outside = b.referencePaths.concat(viol).filter(r => { const og = gOfLine(H(r.node)); return og && og.id !== g.id; });
        if (outside.length) add('A2', n + (viol.length ? '(재대입)' : ''));
        const init = b.path.node.init;
        if (init && /ObjectExpression|ArrayExpression|TemplateLiteral/.test(init.type) && init.loc.end.line - init.loc.start.line + 1 >= 30) add('D', n + '(' + (init.loc.end.line - init.loc.start.line + 1) + '줄)');
      }
    }
  }
  // 이 묶음이 남의 함수 이름에 대입(감싸기) — H
  iScope.bindings && Object.values(iScope.bindings).forEach(b => {
    if (!b.path.isFunctionDeclaration()) return;
    for (const v of b.constantViolations) { const og = gOfLine(H(v.node)); if (og && og.id === g.id && !(H(b.path.node) >= g.start && H(b.path.node) <= g.end)) add('H', b.identifier.name + '(이 묶음이 덮어씀 ' + H(v.node) + ')'); }
  });
  for (const n of g.inlineHandlers) add('C', n);
  for (const n of namesUsedFromOthers(g)) if (!EXPOSED.has(n)) add('L', n);
  if (sccOf.get(g.id)) add('E', sccOf.get(g.id) + '(' + sccSize.get(sccOf.get(g.id)) + '묶음)' + (mutual(g.id).length ? ' 서로 부름 ' + mutual(g.id).join('·') : ''));
  for (const f of g.testIndexOnly) add('F1', f);
  if (PROBE) { const pg = PROBE.groups.find(x => x.id === g.id); if (pg) for (const f of pg.broken) add('F1m', f); }
  for (const n of g.smokeFnNames) add('F2', n);
  if (g.lines > 800) add('G', g.lines + '줄');
  if ((g.fanIn || []).length >= 10) add('I', (g.fanIn || []).length + '묶음');
  for (const f of g.externalFiles) add('J', f);
  for (const k of Object.keys(t)) t[k] = [...new Set(t[k])].sort();
  const asg = ASSIGNED.find(a => a[0][0] === '=' ? g.title === a[0].slice(1) : g.title.includes(a[0]));
  rows.push({ assignedTo: asg ? asg[1] : null, id: g.id, title: g.title, start: g.start, end: g.end, lines: g.lines, score: g.score, types: t });
}

// 유형별 집계
const byType = TYPES.map(([k, label]) => {
  const gs = rows.filter(r => r.types[k]);
  return { type: k, label, groups: gs.length, lines: gs.reduce((a, r) => a + r.lines, 0), items: gs.reduce((a, r) => a + r.types[k].length, 0), ids: gs.map(r => r.id) };
});

// 이음매 비용: 처리 순서(쉬운 이음매부터). 옮기기 전에 다른 PR 이 먼저 있어야 하는 것(F1·F2 시험지 선행, I 공용 부품은 기관 세포로 먼저)과
// 분열 설계가 필요한 것(G)은 뒤로. 같은 단계 안에서는 유형 수 → 줄 수(작은 것 먼저 — 표준 이음매를 작은 묶음에서 먼저 굳힌다).
const stageOf = r => {
  if (r.types.I || r.types.H || r.types.K) return 4;          // 기관 세포·덮어쓰기·this — 개별 설계
  if (r.types.F2 || r.types.G) return 3;                       // 시험지 선행(FN_NAMES) · 800줄 초과 분열
  if (PROBE ? r.types.F1m : r.types.F1) return 2;             // 시험지 선행 PR 이 먼저(실측 — 실측 파일이 없으면 근사)
  return 1;                                                    // 표준 이음매만으로 옮긴다
};
for (const r of rows) { r.stage = stageOf(r); r.typeCount = Object.keys(r.types).length; }
const order = rows.slice().sort((a, b) => a.stage - b.stage || a.typeCount - b.typeCount || a.lines - b.lines || a.start - b.start).map((r, i) => ({ n: i + 1, id: r.id, stage: r.stage, lines: r.lines, types: Object.keys(r.types).sort() }));

// 병렬 구역: 어려움 묶음을 줄 순서로 이어 붙여 ZONES 개 구역으로 나눈다(구역 = 연속 줄 구간, 어려움 줄 합이 고르게).
// 구역 경계는 묶음 경계이므로 줄 구간이 겹치지 않는다. 기관 후보(단계 4)는 구역에서 빼 따로 둔다(여러 구역이 부르므로 한 빌더가 먼저 한다).
const zonable = rows.filter(r => r.stage < 4 && !r.assignedTo).sort((a, b) => a.start - b.start);
const organ = rows.filter(r => r.stage === 4 && !r.assignedTo).sort((a, b) => a.start - b.start);
const totalZ = zonable.reduce((a, r) => a + r.lines, 0);
const zones = [];
{
  let cur = [], acc = 0, k = 0;
  for (const r of zonable) {
    cur.push(r); acc += r.lines;
    if (k < ZONES - 1 && acc >= totalZ * (k + 1) / ZONES) { zones.push(cur); cur = []; k++; }
  }
  if (cur.length) zones.push(cur);
}
const zoneOut = zones.map((z, i) => ({ zone: 'H' + (i + 1), from: z[0].start, to: z[z.length - 1].end, groups: z.map(r => r.id), titles: z.map(r => r.id + ' ' + r.title.slice(0, 40)), hardLines: z.reduce((a, r) => a + r.lines, 0) }));
for (let i = 1; i < zoneOut.length; i++) if (zoneOut[i].from <= zoneOut[i - 1].to) throw new Error('구역 줄 구간 겹침 ' + zoneOut[i].zone);
const out = {
  schema: 'inline-hard-types/1',
  source: { indexSha256_12: sha, mapSchema: MAP.schema },
  hard: { groups: rows.length, lines: rows.reduce((a, r) => a + r.lines, 0) },
  types: byType,
  stages: [1, 2, 3, 4].map(s => ({ stage: s, groups: rows.filter(r => r.stage === s).length, lines: rows.filter(r => r.stage === s).reduce((a, r) => a + r.lines, 0) })),
  order, zones: zoneOut, organ: organ.map(r => ({ id: r.id, lines: r.lines, types: Object.keys(r.types).sort() })),
  zonesOverlap: 0, overwriteKits: OVERWRITE_KITS, probe: PROBE ? { tests: PROBE.tests, needTestFirst: rows.filter(r => r.types.F1m).length, brokenTests: [...new Set(rows.flatMap(r => r.types.F1m || []))].sort() } : null,
  assigned: rows.filter(r => r.assignedTo).map(r => ({ id: r.id, title: r.title, to: r.assignedTo })),
  groups: rows,
};
const json = JSON.stringify(out, null, 1) + '\n';

const md = [];
md.push('> 아래 표는 `NODE_PATH=<node_modules> node scripts/inline-hard-types.js --write` 가 쓴다(손으로 고치지 않는다). 출처 index.html sha256 앞 12자 `' + sha + '`.');
md.push('');
md.push('어려움 묶음 **' + out.hard.groups + '개 · ' + out.hard.lines + '줄**(지도 등급 「어려움」 = 점수 25 초과).');
md.push('');
md.push('| 유형 | 뜻 | 묶음 수 | 줄 수(묶음 합) | 건수 |');
md.push('|---|---|--:|--:|--:|');
for (const x of byType) md.push('| ' + x.type + ' | ' + x.label + ' | ' + x.groups + ' | ' + x.lines + ' | ' + x.items + ' |');
md.push('');
if (out.probe) md.push('시험지 선행 실측(scripts/inline-hard-test-probe.js): 시험지 ' + out.probe.tests + '개를 묶음마다 돌려 **' + out.probe.needTestFirst + '묶음**이 시험지 선행 PR 이 먼저 필요(깨지는 시험지 ' + out.probe.brokenTests.length + '개). 근사(F1)와의 차이가 실측으로 좁힌 몫이다.');
if (out.probe) md.push('');
md.push('처리 단계(유형으로 정함): ' + out.stages.map(s => s.stage + '단계 ' + s.groups + '묶음 ' + s.lines + '줄').join(' · ') + '.');
md.push('');
md.push('묶음 번호(G…)는 이 판에서만 맞다 — 앞 묶음이 옮겨지면 밀린다. 배정·구역은 **제목**으로 찾는다.');
md.push('');
md.push('| 묶음 | 제목 | 줄 범위 | 줄 | 점수 | 단계 | 유형 | 배정 |');
md.push('|---|---|---|--:|--:|--:|---|---|');
for (const r of rows.slice().sort((a, b) => a.start - b.start)) md.push('| ' + r.id + ' | ' + r.title.replace(/|/g, '/').slice(0, 48) + ' | ' + r.start + '~' + r.end + ' | ' + r.lines + ' | ' + r.score + ' | ' + r.stage + ' | ' + Object.keys(r.types).sort().map(k => k + '(' + r.types[k].length + ')').join(' ') + ' | ' + (r.assignedTo || '') + ' |');
md.push('');
md.push('#### 덮어쓰는 키트(유형 M) — 이 전역에 세포 이름을 달 때는 그 파일 태그 **뒤**(설정 afterTag)');
md.push('');
md.push(OVERWRITE_KITS.map(k => '`' + k.kit + '`(' + k.file + ')').join(' · ') || '없음');
md.push('');
md.push('#### 병렬 구역(줄 구간 겹침 0 — 도구가 검사)');
md.push('');
md.push('| 구역 | 줄 구간 | 어려움 줄 | 묶음 |');
md.push('|---|---|--:|---|');
for (const z of zoneOut) md.push('| ' + z.zone + ' | ' + z.from + '~' + z.to + ' | ' + z.hardLines + ' | ' + z.titles.map(t => t.replace(/|/g, '/')).join('<br>') + ' |');
for (const r of rows.filter(r => r.assignedTo)) md.push('| 배정됨: ' + r.assignedTo + ' | ' + r.start + '~' + r.end + ' | ' + r.lines + ' | ' + r.id + ' ' + r.title.slice(0, 40) + ' |');
md.push('| 기관(단계 4, 구역 밖 — 한 빌더가 먼저) | — | ' + organ.reduce((a, r) => a + r.lines, 0) + ' | ' + organ.map(r => r.id + ' ' + r.title.replace(/|/g, '/').slice(0, 40)).join('<br>') + ' |');
md.push('');
md.push('#### 권장 처리 순서(단계 → 유형 수 → 줄 수)');
md.push('');
md.push(order.map(o => o.n + '. ' + o.id + '(' + o.stage + '단계·' + o.lines + '줄·' + o.types.join('') + ')').join(' · '));
const mdText = md.join('\n');

if (WRITE) {
  fs.writeFileSync(OUT_JSON, json, 'utf8');
  if (fs.existsSync(DESIGN_MD)) {
    const d = fs.readFileSync(DESIGN_MD, 'utf8');
    const re = /<!-- hard-types:begin -->[\s\S]*?<!-- hard-types:end -->/;
    if (!re.test(d)) throw new Error('설계 문서에 hard-types 표지가 없다');
    fs.writeFileSync(DESIGN_MD, d.replace(re, '<!-- hard-types:begin -->\n' + mdText + '\n<!-- hard-types:end -->'), 'utf8');
  }
}
console.log('어려움 ' + out.hard.groups + '묶음 ' + out.hard.lines + '줄 · 출처 ' + sha);
for (const x of byType) console.log(x.type.padEnd(3), String(x.groups).padStart(3), '묶음', String(x.lines).padStart(6), '줄', x.label);
console.log('단계', out.stages.map(s => s.stage + ':' + s.groups + '/' + s.lines).join(' '));
console.log('구역', zoneOut.map(z => z.zone + ' ' + z.from + '~' + z.to + ' ' + z.hardLines + '줄 ' + z.groups.length + '묶음').join(' | '), '· 기관', organ.map(r => r.id).join(' '));
