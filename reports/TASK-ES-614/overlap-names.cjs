#!/usr/bin/env node
'use strict';
// B3a: 인라인 IIFE 가 window 에 다는 이름 가운데 IIFE 밖 파일도 같은 이름을 대입하는 것(겹침 이름)을 다시 잰다(작업자 측정 도구, 판정 아님).
// own 적용 시점(commit)을 「바깥 스크립트가 전부 로드된 뒤, IIFE 바로 앞」으로 둔 근거다 — 겹침 이름은 지금까지 맨 뒤의 IIFE 가 다시 덮어 이겼다.
//   글자 조사: index.html 이 태그로 부르는 스크립트(순서·defer/async)와 IIFE 밖 인라인 스크립트에서 `<전역 별칭>.N = …` 대입을 찾는다(별칭: window·global·globalThis·self·g·w·win·root).
//   실행 조사: 대조 탐침 결과의 report.commit.windowBefore.different(=commit 시점에 이미 다른 값이 들어 있던 이름)와, 기준·작업·모의 철거 사본의 window 값 지문.
// 사용: node reports/TASK-ES-614/overlap-names.cjs <트리> <작업 대조.json> <기준 대조.json> <모의 철거 대조.json> <out.json>
const fs = require('fs'), path = require('path');
const [TREE, WORKJ, BASEJ, MOCKJ, OUT] = process.argv.slice(2).map(p => path.resolve(p));
const work = JSON.parse(fs.readFileSync(WORKJ, 'utf8')), base = JSON.parse(fs.readFileSync(BASEJ, 'utf8')), mock = JSON.parse(fs.readFileSync(MOCKJ, 'utf8'));
const html = fs.readFileSync(path.join(TREE, 'index.html'), 'utf8');
const lines = html.split('\n').map(l => l.replace(/\r$/, ''));
let s = -1, e = -1;
for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { s = i; break; }
for (let i = s; i < lines.length; i++) if (lines[i].startsWith('</script>')) { e = i; break; }
// 태그 순서(문서 순서)
const tags = []; const tagRe = /<script\b([^>]*)>/g;
lines.forEach((l, i) => { let m; tagRe.lastIndex = 0; while ((m = tagRe.exec(l))) { const a = m[1], src = /\bsrc\s*=\s*["']([^"']+)["']/.exec(a); tags.push({ line: i + 1, src: src ? src[1].replace(/\?.*$/, '').replace(/^\//, '') : null, defer: /\bdefer\b/.test(a), async: /\basync\b/.test(a), inline: !src }); } });
tags.forEach((t, i) => { t.order = i; });
const iifeTag = tags.find(t => t.inline && t.line === s + 1);
const commitTag = tags.find(t => t.src === 'js/core/cell-registry-commit.js');
const esc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const names = work.windowNames;
const reFor = n => new RegExp('(?:^|[^A-Za-z0-9_$.])(?:window|global|globalThis|self|g|w|win|root)\\.' + esc(n) + '\\s*=(?!=)');
const sources = [];
for (const t of tags) {
  if (t.src) { if (/^https?:/.test(t.src)) continue; const f = path.join(TREE, t.src); if (fs.existsSync(f)) sources.push({ tag: t, label: t.src, text: fs.readFileSync(f, 'utf8') }); }
  else if (t !== iifeTag) { let j = t.line; const buf = []; while (j < lines.length && !/<\/script>/.test(lines[j])) buf.push(lines[j++]); sources.push({ tag: t, label: 'index.html 인라인(' + t.line + '행)', text: buf.join('\n') }); }
}
const reg = {}; (work.report && work.registeredNames || []).forEach(n => { reg[n] = true; });
const diffAtCommit = {}; ((work.report.commit || {}).windowBefore || { different: [] }).different.forEach(x => { diffAtCommit[x.name] = x; });
const rows = [];
for (const n of names) {
  const re = reFor(n);
  const hits = sources.filter(x => re.test(x.text)).map(x => ({ file: x.label, order: x.tag.order, line: x.tag.line, deferOrAsync: x.tag.defer || x.tag.async, when: x.tag.defer || x.tag.async ? 'IIFE 뒤(defer/async)' : (x.tag.order > iifeTag.order ? 'IIFE 뒤' : (commitTag && x.tag.order > commitTag.order ? 'commit 뒤·IIFE 앞' : 'commit 앞')) }));
  if (!hits.length) continue;
  const fp = { base: base.fingerprints.window[n], work: work.fingerprints.window[n], mock: mock.fingerprints.window[n] };
  rows.push({ name: n, registered: !!reg[n], assigners: hits, differentValueAtCommit: !!diffAtCommit[n], finalValueSame: fp.base === fp.work && fp.work === fp.mock, fingerprint: fp,
    winner: hits.some(h => h.when !== 'commit 앞') ? 'commit 뒤에도 대입하는 파일이 있다 — 아래 assigners 참고' : (reg[n] ? '등록 기관(commit) — 철거 전에는 IIFE 가 같은 값으로 다시 대입' : 'IIFE(등록되지 않은 이름 — 옛 배선 그대로)') });
}
const out = { tool: 'reports/TASK-ES-614/overlap-names.cjs', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(),
  order: { scriptTags: tags.length, externalTags: tags.filter(t => t.src).length, deferOrAsync: tags.filter(t => t.defer || t.async).map(t => ({ src: t.src, line: t.line })), commitTag: commitTag ? { order: commitTag.order, line: commitTag.line } : null, iifeTag: { order: iifeTag.order, line: iifeTag.line },
    tagsBetweenCommitAndIife: commitTag ? tags.filter(t => t.order > commitTag.order && t.order < iifeTag.order).length : null, inlineAfterIife: tags.filter(t => t.inline && t.order > iifeTag.order).map(t => t.line) },
  windowNames: names.length, overlapCount: rows.length, overlapRegistered: rows.filter(r => r.registered).length,
  differentValueAtCommit: Object.keys(diffAtCommit).sort(), differentValueAtCommitNotInTextScan: Object.keys(diffAtCommit).filter(n => !rows.some(r => r.name === n)).sort(),
  assignedAfterCommit: rows.filter(r => r.assigners.some(h => h.when !== 'commit 앞')).map(r => r.name), allFinalValuesSame: rows.every(r => r.finalValueSame), rows };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log('window 이름', names.length, '· 겹침', rows.length, '(등록됨', out.overlapRegistered + ')', '· commit 시점 다른 값', out.differentValueAtCommit.length, '· commit 뒤 대입', out.assignedAfterCommit.length, '· 최종 값 지문 동일', out.allFinalValuesSame, '· commit~IIFE 사이 태그', out.order.tagsBetweenCommitAndIife);
rows.forEach(r => console.log('  ', r.name, r.registered ? '[등록]' : '[미등록]', r.assigners.map(h => h.file + '(' + h.when + ')').join(', '), r.differentValueAtCommit ? '· commit 때 다른 값' : ''));
