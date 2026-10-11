#!/usr/bin/env node
'use strict';
// #TASK-ES-691 — 지시함 「결심 대기」 표 끝에 새로 남는 줄을 넣고 주장 파일을 만든다.
// 줄의 글틀은 reports/TASK-ES-691/text/decision-rows.md, 수는 not-confirmed.json(대장에서 뽑은 것)에서 온다.
// 사용: node reports/TASK-ES-691/tools/render-rows.cjs   (이미 들어 있으면 그 줄들을 갈아 끼운다)
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..', '..'), DIR = path.resolve(__dirname, '..');
const A = path.join(ROOT, 'docs', 'directives', 'ACTIVE.md');
const N = JSON.parse(fs.readFileSync(path.join(DIR, 'not-confirmed.json'), 'utf8'));
const rows = fs.readFileSync(path.join(DIR, 'text', 'decision-rows.md'), 'utf8').replace(/\r\n/g, '\n').trim().split('\n').map(l => l.replace('{{N:items}}', String(N.count)).replace('{{N:prs}}', String(N.prs.length)));
const keyOf = l => l.split('|')[1].trim().slice(0, 24);
let doc = fs.readFileSync(A, 'utf8'); const crlf = /\r\n/.test(doc); doc = doc.replace(/\r\n/g, '\n');
const lines = doc.split('\n');
const head = lines.findIndex(l => l.indexOf('## 결심 대기') === 0); if (head < 0) { console.error('「결심 대기」 칸을 찾지 못했다'); process.exit(1); }
let end = head + 1; let lastRow = -1; while (end < lines.length && lines[end].indexOf('## ') !== 0) { if (lines[end].indexOf('|') === 0) lastRow = end; end++; }
if (lastRow < 0) { console.error('표를 찾지 못했다'); process.exit(1); }
// 이미 넣은 줄이 있으면 뺀다(같은 머리 글자)
const keys = rows.map(keyOf); let removed = 0;
for (let i = lastRow; i > head; i--) { if (lines[i].indexOf('|') === 0 && keys.indexOf(keyOf(lines[i])) >= 0) { lines.splice(i, 1); removed++; lastRow--; } }
lines.splice(lastRow + 1, 0, ...rows);
doc = lines.join('\n');
fs.writeFileSync(A, crlf ? doc.replace(/\n/g, '\r\n') : doc, { encoding: 'utf8' });
// 주장 파일
const F = 'docs/directives/ACTIVE.md';
const has = (id, req, statement, file, text) => ({ id, req, kind: 'static', domain: 'config', statement, touches: [file], check: { type: 'codeContains', file, text } });
const claims = rows.map((r, i) => has('C' + (i + 1), 'R1', '결심 대기 표에 줄이 있다: ' + r.split('|')[1].trim().slice(0, 40), F, r.split('|')[1].trim().slice(0, 60)));
claims.push(has('C' + (claims.length + 1), 'R1', '결심 대기 칸의 머리말은 그대로다(AI 는 이 칸을 스스로 진행하지 않는다)', F, '## 결심 대기 (상민님만 결정한다 — AI 는 이 칸을 스스로 진행하지 않는다)'));
claims.push(has('C' + (claims.length + 1), 'R1', '표의 앞선 줄은 그대로다', F, '| Google Play 개발자 계정 등록($25 결제·신분 확인) | 돈 |'));
claims.push(has('C' + (claims.length + 1), 'R2', '부팅 파일이 안 올 때의 측정 기록이 있다', 'reports/TASK-ES-691/boot-file-missing.json', '머리 — js/app/boot.js 404'));
claims.push(has('C' + (claims.length + 1), 'R2', '근거 위치 문서가 있다', 'reports/TASK-ES-691/remaining.md', '# 미분화 덩어리 해체 뒤에 남은 것 — 근거 위치'));
claims.push(has('C' + (claims.length + 1), 'R2', '법정이 확인 못 한 항목 표가 있다', 'reports/TASK-ES-691/not-confirmed.md', '# 법정이 「확인 못 함」으로 남긴 항목'));
claims.push(has('C' + (claims.length + 1), 'R1', '티켓 대장에 ES-691 한 줄이 있다', 'docs/rules/TICKETS.md', '- #TASK-ES-691 | INFRA | 지시함 「결심 대기」 표에 미분화 덩어리 해체 뒤 남은 것 일곱 줄'));
const out = { task: 'TASK-ES-691', requirementsSource: 'docs/specs/REQ-TASK-ES-691-DECISION-WAIT-ROWS.md',
  requirements: [ { id: 'R1', text: '미분화 덩어리 해체 뒤 새로 남는 것 일곱 줄을 지시함 「결심 대기」 표에 올린다(성격 · 상태 칸 포함). 이 칸의 줄은 AI 가 스스로 진행하지 않는다.' }, { id: 'R2', text: '줄마다 근거 위치(파일 · 행 · 앞선 문서의 절)를 붙인다. 법정이 확인 못 한 항목은 대장에서 스크립트로 뽑는다.' } ],
  outOfScopeReports: [ { text: '이 PR 은 줄을 올리기만 한다. 고치기 · 금고 변경 · 실계정 확인은 하지 않는다(각각 상민님 결심 뒤 새 지시).', cannotBecause: 'out-of-scope-feature' } ],
  claims };
fs.writeFileSync(path.join(DIR, 'claims.json'), JSON.stringify(out, null, 2) + '\n', { encoding: 'utf8' });
const bad = claims.filter(c => !fs.readFileSync(path.join(ROOT, c.check.file), 'utf8').includes(c.check.text)).map(c => c.id);
console.log(JSON.stringify({ rowsInserted: rows.length, replacedOld: removed, claims: claims.length, notTrueNow: bad }));
