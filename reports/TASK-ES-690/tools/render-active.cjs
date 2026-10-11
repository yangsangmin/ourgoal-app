#!/usr/bin/env node
'use strict';
// #TASK-ES-690 — 지시함(docs/directives/ACTIVE.md)의 완료 기록을 글틀(reports/TASK-ES-690/text/*.md)과 대장(pr-ledger.json)으로 만든다.
// 숫자·판정 글자·판정번호·주소는 글틀에 손으로 적지 않고 표지로 둔다:
//   {{F:이름}}        numbers.cjs 가 대장에서 만든 숫자 문장
//   {{V:번호}}        #번호 「판정」(판정번호 X) 판정 댓글 주소
//   {{P:번호}}        #번호(「판정」 X)
//   {{R:번호:칸}}     대장의 그 PR 행의 칸 값
//   번호 자리에 APPLY 를 쓰면 마지막 정리를 적용한 PR(--apply-pr 로 준다. 안 주면 자리표 【 】 로 남는다)
// 하는 일: ① 「열린 지시」 칸에서 DIR-003 · DIR-004 를 빼고 「(열린 지시 없음)」으로 ② 「결심 대기」 표에서 풀린 세 줄을 뺌 ③ 「완료된 지시」 맨 위에 두 완료 기록을 넣음.
// 사용: node reports/TASK-ES-690/tools/render-active.cjs --base <기준 ACTIVE.md(예: git show origin/main:… 로 뽑은 파일)> --out <쓸 ACTIVE.md> [--apply-pr <번호>]
const fs = require('fs'), path = require('path');
const arg = n => { const i = process.argv.indexOf('--' + n); return i >= 0 ? process.argv[i + 1] : null; };
const BASE = arg('base'), OUT = arg('out'), APPLY = arg('apply-pr') ? Number(arg('apply-pr')) : null;
if (!BASE || !OUT) { console.error('사용: node render-active.cjs --base <기준 ACTIVE.md> --out <쓸 ACTIVE.md> [--apply-pr <번호>]'); process.exit(2); }
const DIR = path.resolve(__dirname, '..');
const { F, ledger } = require('./numbers.cjs');
const row = n => ledger.rows.find(r => r.pr === n);
const short = v => String(v || '').split('(')[0];
const problems = [];
function fill(text) {
  return text.replace(/\{\{([FVPR]):([^}:]+)(?::([^}]+))?\}\}/g, (m, kind, key, extra) => {
    if (kind === 'F') { if (!(key in F)) { problems.push('숫자 문장 없음: ' + key); return m; } return F[key]; }
    const n = key === 'APPLY' ? APPLY : Number(key);
    if (key === 'APPLY' && !APPLY) return '【마지막 정리 적용 PR — 병합 뒤 채움】';
    const r = row(n); if (!r) { problems.push('대장에 없는 PR: #' + key); return m; }
    if (kind === 'R') { if (!(extra in r)) { problems.push('대장에 없는 칸: #' + key + ' ' + extra); return m; } return String(r[extra]); }
    if (!r.verdict || !r.verdictId) { problems.push('판정 댓글 없음: #' + n); return '#' + n + '(판정 댓글 없음)'; }
    if (kind === 'P') return '#' + n + '(「' + short(r.verdict) + '」 ' + r.verdictId + ')';
    return '#' + n + ' 「' + short(r.verdict) + '」(판정번호 ' + r.verdictId + ') ' + r.verdictUrl;
  });
}
let doc = fs.readFileSync(BASE, 'utf8'); const crlf = /\r\n/.test(doc); doc = doc.replace(/\r\n/g, '\n');
const d3 = fill(fs.readFileSync(path.join(DIR, 'text', 'dir-003.md'), 'utf8').replace(/\r\n/g, '\n')).trim();
const d4 = fill(fs.readFileSync(path.join(DIR, 'text', 'dir-004.md'), 'utf8').replace(/\r\n/g, '\n')).trim();
// ① 열린 지시
const a = doc.indexOf('## 열린 지시\n'), b = doc.indexOf('\n---\n\n## 결심 대기');
if (a < 0 || b < 0 || b < a) { console.error('「열린 지시」 칸을 찾지 못했다'); process.exit(1); }
const open = doc.slice(a, b);
const openIds = (open.match(/^### (DIR-[0-9A-Z]+)/gm) || []).map(s => s.slice(4));
if (openIds.join(',') !== 'DIR-003,DIR-004') { console.error('열린 지시가 예상과 다르다: ' + openIds.join(',') + ' — 손대지 않고 멈춘다'); process.exit(1); }
doc = doc.slice(0, a) + '## 열린 지시\n\n(열린 지시 없음)\n' + doc.slice(b);
// ② 결심 대기에서 풀린 세 줄
const solved = ['| saveGoogleToken 의 arguments — 헌법 CELL_SPLIT 5호', '| 옛 연결선 글자(window.X = X; 등)를 단언하는 시험의 기대값·단언 변경(DIR-004 묶음 2', '| OURGOAL_CONFIG(빈 설정 객체 선언과 window 복사 줄'];
for (const s of solved) { const lines = doc.split('\n'); const i = lines.findIndex(l => l.indexOf(s) === 0); if (i < 0) { console.error('결심 대기 표에서 줄을 찾지 못했다: ' + s); process.exit(1); } lines.splice(i, 1); doc = lines.join('\n'); }
// ③ 완료된 지시 맨 위
const anchor = '작업자가 쓸 수 없는 GitHub 기록이 없는 항목은 **이 PR 의 상민님 승인이 종결의 근거**다.\n';
const c = doc.indexOf(anchor); if (c < 0) { console.error('「완료된 지시」 머리 줄을 찾지 못했다'); process.exit(1); }
doc = doc.slice(0, c + anchor.length) + '\n' + d4 + '\n\n' + d3 + '\n' + doc.slice(c + anchor.length);
if (problems.length) { console.error('채우지 못한 표지: ' + problems.join(' / ')); process.exit(1); }
fs.writeFileSync(OUT, crlf ? doc.replace(/\n/g, '\r\n') : doc, { encoding: 'utf8' });
const holes = (doc.match(/【[^】]*】/g) || []);
console.log(JSON.stringify({ out: OUT, crlf, openIdsMoved: openIds, solvedRowsRemoved: solved.length, placeholdersLeft: holes.length, placeholders: holes.map(h => h.slice(0, 40)) }, null, 1));
