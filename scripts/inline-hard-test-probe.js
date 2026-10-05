#!/usr/bin/env node
'use strict';
/**
 * 어려움 묶음 시험지 선행 필요 실측기 (#TASK-ES-439)
 *
 * 지도(docs/architecture/inline-script-map.json)의 testIndexOnly 는 "index.html 한 파일만 읽는 시험지가 이 묶음의 이름·글자를 담았다"는
 * 넉넉한 근사다. 이 도구는 그 근사를 실측으로 좁힌다: 앱 사본에서 묶음을 표준 이음매대로 비운 index.html 을 만들고(옮겨 갈 문 = 빈 줄,
 * 원래 자리에 남는 문 = window 노출·상태 변수 선언은 그대로), 그 묶음의 testIndexOnly 시험지만 돌려 기준(안 비운 index.html) 대비
 * 통과 → 실패로 바뀌는 시험지를 센다. 바뀐 시험지가 있으면 그 묶음은 "시험지 선행 PR(읽는 범위만 넓힘, 기대값 0 변경)"이 먼저 필요하다.
 *
 * 결정적: 묶음·시험지 정렬 순서로 돈다. 시각 의존 시험지는 기준을 두 번 돌려 흔들리면 「흔들림」으로 따로 적는다.
 * 사용: NODE_PATH=<node_modules> node scripts/inline-hard-test-probe.js <앱 사본 폴더(쓰기 가능, git archive 로 푼 것)> [--write] [--only G101,G124]
 *   --write: docs/architecture/inline-hard-test-probe.json 을 쓴다(저장소 쪽, 사본 아님).
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const args = process.argv.slice(2);
const COPY = path.resolve(args[0]);
const ROOT = path.join(__dirname, '..');
const WRITE = args.includes('--write');
const ONLY = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'architecture', 'inline-script-map.json'), 'utf8'));
const html0 = fs.readFileSync(path.join(COPY, 'index.html'), 'utf8');
const sha = require('crypto').createHash('sha256').update(html0.replace(/\r\n/g, '\n')).digest('hex').slice(0, 12);
if (MAP.source.sha256_12 !== sha) throw new Error('사본 index.html 이 지도와 다르다(지도 ' + MAP.source.sha256_12 + ' · 사본 ' + sha + ')');
const EOL = html0.includes('\r\n') ? '\r\n' : '\n';
const lines = html0.replace(/\r\n/g, '\n').split('\n');
let sLine = -1, eLine = -1;
for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { sLine = i + 1; break; }
for (let i = sLine; i < lines.length; i++) if (lines[i].startsWith('</script>')) { eLine = i; break; }
const off = sLine;
const ast = parser.parse(lines.slice(sLine, eLine).join('\n'), { sourceType: 'script' });
let iife = null; traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iScope = iife.scope;
const top = iife.get('body').get('body');
const H = n => n.loc.start.line + off, HE = n => n.loc.end.line + off;

// 표준 이음매에서 원래 자리에 남는 문: window 노출(3줄 이하) · 상태 변수(재대입 또는 실행되는 초기값) · class
const PURE = /^(StringLiteral|NumericLiteral|BooleanLiteral|NullLiteral|ObjectExpression|ArrayExpression|FunctionExpression|ArrowFunctionExpression|TemplateLiteral|UnaryExpression)$/;
const stays = st => {
  if (st.isVariableDeclaration()) return st.node.declarations.some(d => d.id.type !== 'Identifier' || iScope.getBinding(d.id.name).constantViolations.length > 0 || (d.init && !PURE.test(d.init.type)));
  if (st.isClassDeclaration()) return true;
  const e = st.isExpressionStatement() && st.node.expression;
  return !!(e && e.type === 'AssignmentExpression' && e.left.type === 'MemberExpression' && e.left.object.type === 'Identifier' && e.left.object.name === 'window' && HE(st.node) - H(st.node) <= 2);
};
const run = f => { const r = cp.spawnSync(process.execPath, [f], { cwd: COPY, encoding: 'utf8', timeout: 120000, env: process.env }); return r.status === null ? 'timeout' : r.status; };
const hard = MAP.groups.filter(g => g.tier === '어려움' && (!ONLY || ONLY.has(g.id)));
const allTests = [...new Set(hard.flatMap(g => g.testIndexOnly))].sort();
// 기준: 안 비운 index.html 로 두 번
const base1 = {}, base2 = {};
for (const t of allTests) base1[t] = run(t);
for (const t of allTests) base2[t] = run(t);
const flaky = allTests.filter(t => base1[t] !== base2[t]);
const out = [];
try {
  for (const g of hard) {
    const nl = lines.slice();
    let blanked = 0, kept = 0;
    for (const st of top) {
      const a = H(st.node), b = HE(st.node);
      if (a < g.start || b > g.end) continue;
      if (stays(st)) { kept++; continue; }
      for (let l = a; l <= b; l++) nl[l - 1] = '';
      blanked++;
    }
    fs.writeFileSync(path.join(COPY, 'index.html'), nl.join(EOL), 'utf8');
    const res = {};
    for (const t of g.testIndexOnly.slice().sort()) res[t] = run(t);
    const broken = Object.keys(res).filter(t => base1[t] === 0 && base2[t] === 0 && res[t] !== 0).sort();
    out.push({ id: g.id, probed: g.testIndexOnly.length, blankedStatements: blanked, keptStatements: kept, broken });
    process.stdout.write(g.id + ' ' + broken.length + '/' + g.testIndexOnly.length + '  ');
  }
} finally {
  fs.writeFileSync(path.join(COPY, 'index.html'), html0, 'utf8');
}
console.log();
const report = {
  schema: 'inline-hard-test-probe/1', source: { indexSha256_12: sha },
  method: '표준 이음매대로 묶음을 비운 index.html(남는 문: window 노출·상태 변수·class) + 그 묶음 testIndexOnly 시험지 실행. 기준 2회 모두 통과였는데 비운 뒤 실패면 broken.',
  tests: allTests.length, baseFailing: allTests.filter(t => base1[t] !== 0).length, flaky,
  groups: out,
  summary: { groups: out.length, needTestFirst: out.filter(x => x.broken.length).length, brokenTests: [...new Set(out.flatMap(x => x.broken))].sort() },
};
if (WRITE) fs.writeFileSync(path.join(ROOT, 'docs', 'architecture', 'inline-hard-test-probe.json'), JSON.stringify(report, null, 1) + '\n', 'utf8');
console.log('시험지 ' + report.tests + '개(기준 실패 ' + report.baseFailing + ' · 흔들림 ' + flaky.length + ') · 묶음 ' + out.length + ' 중 시험지 선행 필요 ' + report.summary.needTestFirst + ' · 깨지는 시험지 ' + report.summary.brokenTests.length + '개');
