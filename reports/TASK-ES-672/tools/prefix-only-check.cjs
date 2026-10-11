'use strict';
// 한도 준수 실측(작업자 측정, 판정 아님): 옮긴 구간의 글자가 「생성기가 붙인 이름 접두 L.」 말고는 한 글자도 바뀌지 않았는지를
// 생성기·검사기와 따로, 줄 단위 바이트 비교로 잰다.
//  ① 기준 index.html 의 옮긴 구간 줄(gen-inline-hard-meta.json plan 의 segment)과 세포 파일의 「생성기 표지」 아래 줄을 1:1 로 맞댄다.
//  ② 세포 줄에서 `L.<통로 이름>` 의 `L.` 만 지우면(통로 이름 = meta.bridged) 기준 줄과 바이트 단위로 같아야 한다. 다르면 그 줄을 싣는다.
//  ③ 지운 `L.` 의 수 = 생성기가 적은 바꿔 쓰기 수(meta.edits).
//  ④ 돈 관련 낱말이 든 줄(기준 구간)이 세포에서도 같은 수·같은 글자(접두 제외)인지, 세포에 새로 생긴 돈 관련 줄이 없는지.
// 사용: node prefix-only-check.cjs <기준 index.html> <작업 트리> <gen-inline-hard-meta.json> <proof.json> <out.json>
const fs = require('fs'), path = require('path');
const [BASE_HTML, WORK, META, PROOF, OUT] = process.argv.slice(2);
const meta = JSON.parse(fs.readFileSync(META, 'utf8')), proof = JSON.parse(fs.readFileSync(PROOF, 'utf8'));
const baseLines = fs.readFileSync(BASE_HTML, 'utf8').split(/\r?\n/);
const names = meta.bridged.map(b => b.n).sort((a, b) => b.length - a.length).map(n => n.replace(/\$/g, '\\$'));
const stripRe = new RegExp('(^|[^A-Za-z0-9_$.])L\\.(' + names.join('|') + ')(?![A-Za-z0-9_$])', 'g');
const MONEY = /credit|subscription|paywall|OURGOAL_CONFIG|광고|구독|결제|크레딧|유료|가격|과금|payment|price|premium/i;
const out = { tool: 'reports/TASK-ES-672/tools/prefix-only-check.cjs', type: '작업자 측정, 판정 아님', bridgedNames: meta.bridged.map(b => b.n), segments: [], totals: { lines: 0, identicalLines: 0, prefixOnlyLines: 0, otherDiffLines: 0, strippedPrefixes: 0 } };
for (const cell of proof.cells) {
  const cellLines = fs.readFileSync(path.join(WORK, cell.file), 'utf8').split(/\r?\n/);
  for (const p of meta.plan.filter(x => x.cell === cell.key && x.action !== 'keep')) {
    const [a, b] = p.segment;
    const mark = '/* ---- 이전 전 index.html ' + a + '~' + b + '줄(#' + meta.task + ' 생성기 표지) ---- */';
    const at = cellLines.findIndex(l => l.trim() === mark);
    if (at < 0) throw new Error('표지 없음: ' + mark);
    const skip = p.action === 'wrap' ? 1 : 0; // 감싼 문은 표지 다음에 함수 머리 한 줄이 있다
    const seg = { file: cell.file, names: p.names, action: p.action, baseLines: [a, b], lines: b - a + 1, identical: 0, prefixOnly: 0, otherDiff: [], strippedPrefixes: 0, moneyLinesBase: 0, moneyLinesCell: 0, moneyLinesSameAfterStrip: true };
    for (let i = 0; i < seg.lines; i++) {
      const bl = baseLines[a - 1 + i], cl = cellLines[at + 1 + skip + i];
      let n = 0; const stripped = cl.replace(stripRe, (m, pre, nm) => { n++; return pre + nm; });
      if (cl === bl) seg.identical++;
      else if (stripped === bl) { seg.prefixOnly++; seg.strippedPrefixes += n; }
      else seg.otherDiff.push({ baseLine: a + i, base: bl.slice(0, 200), cell: cl.slice(0, 200) });
      if (MONEY.test(bl)) { seg.moneyLinesBase++; if (stripped !== bl) seg.moneyLinesSameAfterStrip = false; }
      if (MONEY.test(cl)) seg.moneyLinesCell++;
    }
    out.segments.push(seg);
    out.totals.lines += seg.lines; out.totals.identicalLines += seg.identical; out.totals.prefixOnlyLines += seg.prefixOnly; out.totals.otherDiffLines += seg.otherDiff.length; out.totals.strippedPrefixes += seg.strippedPrefixes;
  }
}
out.generatorEdits = meta.edits;
out.moneyLines = { base: out.segments.reduce((s, x) => s + x.moneyLinesBase, 0), cell: out.segments.reduce((s, x) => s + x.moneyLinesCell, 0), allSameAfterStrip: out.segments.every(x => x.moneyLinesSameAfterStrip) };
// 세포 파일에서 옮긴 구간 밖의 줄(머리 설명·껍데기·키트 대입)에 돈 관련 낱말이 든 줄 — 생성기 머리 설명(설정 title·desc)에서만 나올 수 있다
out.moneyWordsOutsideMovedLines = [];
for (const cell of proof.cells) {
  const cellLines = fs.readFileSync(path.join(WORK, cell.file), 'utf8').split(/\r?\n/);
  const inside = new Set();
  for (const p of meta.plan.filter(x => x.cell === cell.key && x.action !== 'keep')) { const mark = '/* ---- 이전 전 index.html ' + p.segment[0] + '~' + p.segment[1] + '줄(#' + meta.task + ' 생성기 표지) ---- */'; const at = cellLines.findIndex(l => l.trim() === mark); for (let i = 0; i <= p.segment[1] - p.segment[0] + 1 + (p.action === 'wrap' ? 1 : 0); i++) inside.add(at + i); }
  cellLines.forEach((l, i) => { if (!inside.has(i) && MONEY.test(l)) out.moneyWordsOutsideMovedLines.push({ file: cell.file, line: i + 1, text: l.trim().slice(0, 160) }); });
}
// #TASK-ES-672 에서 더함: 「템플릿 마켓」 단추를 연결하는 줄(돈 근처)은 접두 말고 글자가 그대로여야 한다 — 그 줄들을 글자째 따로 싣는다.
const WATCH = /proTplMarketBtn|marketBtn|openTemplateMarketModal|clonedTpl/;
out.marketLines = [];
for (const cell of proof.cells) {
  const cellLines = fs.readFileSync(path.join(WORK, cell.file), 'utf8').split(/\r?\n/);
  for (const p of meta.plan.filter(x => x.cell === cell.key && x.action !== 'keep')) {
    const [a, b] = p.segment;
    const at = cellLines.findIndex(l => l.trim() === '/* ---- 이전 전 index.html ' + a + '~' + b + '줄(#' + meta.task + ' 생성기 표지) ---- */');
    for (let i = 0; i <= b - a; i++) {
      const bl = baseLines[a - 1 + i], cl = cellLines[at + 1 + (p.action === 'wrap' ? 1 : 0) + i];
      if (!WATCH.test(bl)) continue;
      let n = 0; const stripped = cl.replace(stripRe, (m, pre, nm) => { n++; return pre + nm; });
      out.marketLines.push({ file: cell.file, baseLine: a + i, base: bl.trim(), cell: cl.trim(), prefixesAdded: n, sameAfterStrip: stripped === bl });
    }
  }
}
out.marketLinesAllSame = out.marketLines.length > 0 && out.marketLines.every(x => x.sameAfterStrip);
out.ok = out.marketLinesAllSame && out.totals.otherDiffLines === 0 && out.totals.strippedPrefixes === meta.edits && out.moneyLines.base === out.moneyLines.cell && out.moneyLines.allSameAfterStrip;
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log(JSON.stringify({ ok: out.ok, market: [out.marketLines.length, out.marketLinesAllSame], totals: out.totals, edits: meta.edits, money: out.moneyLines, outside: out.moneyWordsOutsideMovedLines, otherDiff: out.segments.flatMap(s => s.otherDiff).slice(0, 3) }));
