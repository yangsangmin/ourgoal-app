#!/usr/bin/env node
'use strict';
// #TASK-ES-691 — 법정이 「확인 못 함」으로 남긴 항목을 대장(reports/TASK-ES-690/pr-ledger.json)에서 뽑아 표로 만든다(손으로 옮겨 적지 않는다).
// 사용: node reports/TASK-ES-691/tools/not-confirmed.cjs
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..', '..');
const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports', 'TASK-ES-690', 'pr-ledger.json'), 'utf8'));
const esc = s => String(s === null || s === undefined ? '' : s).replace(/\|/g, '/');
const rows = [];
for (const r of L.rows) for (const n of (r.notConfirmed || [])) rows.push({ pr: r.pr, id: n.id, text: n.text, result: n.result, verdictId: r.verdictId, url: r.verdictUrl });
const md = ['# 법정이 「확인 못 함」으로 남긴 항목 (' + L.summary.from + ' → ' + L.summary.to + ')', '',
  '`reports/TASK-ES-691/tools/not-confirmed.cjs` 가 대장(`reports/TASK-ES-690/pr-ledger.json`)에서 뽑았다. 글자는 GitHub 의 법정 댓글(github-actions)에 있는 것이다 — 「지시 내용」 칸은 작업자가 주장 파일에 적어 낸 문장이고, 「결과」 칸은 법정이 적은 것이다.', '',
  '- 항목 ' + rows.length + '건 · PR ' + new Set(rows.map(r => r.pr)).size + '건', '',
  '| PR | 항목 | 작업자가 적어 낸 지시 내용(앞부분) | 법정의 결과 | 판정번호 | 판정 주소 |', '|---|---|---|---|---|---|'];
for (const r of rows) md.push('| #' + r.pr + ' | ' + esc(r.id) + ' | ' + esc(r.text) + ' | ' + esc(r.result) + ' | ' + esc(r.verdictId) + ' | ' + esc(r.url) + ' |');
fs.writeFileSync(path.join(ROOT, 'reports', 'TASK-ES-691', 'not-confirmed.md'), md.join('\n') + '\n', { encoding: 'utf8' });
fs.writeFileSync(path.join(ROOT, 'reports', 'TASK-ES-691', 'not-confirmed.json'), JSON.stringify({ tool: 'reports/TASK-ES-691/tools/not-confirmed.cjs', from: L.summary.from, to: L.summary.to, count: rows.length, prs: [...new Set(rows.map(r => r.pr))], rows }, null, 1) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify({ items: rows.length, prs: [...new Set(rows.map(r => r.pr))] }));
