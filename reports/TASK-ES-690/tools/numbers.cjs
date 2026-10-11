#!/usr/bin/env node
'use strict';
// #TASK-ES-690 — 지시함 완료 기록에 적는 숫자 문장을 대장(pr-ledger.json)에서 만든다(손으로 옮겨 적지 않는다).
//   node reports/TASK-ES-690/tools/numbers.cjs                       문장을 찍는다(measure-lines.md 도 쓴다)
//   node reports/TASK-ES-690/tools/numbers.cjs --check <ACTIVE.md>   그 문장들이 지시함에 글자 그대로 있는지, 채우지 않은 자리표(【 】)가 남았는지 본다(다르면 종료 1)
const fs = require('fs'), path = require('path');
const DIR = path.resolve(__dirname, '..');
const L = JSON.parse(fs.readFileSync(path.join(DIR, 'pr-ledger.json'), 'utf8'));
const S = L.summary, rows = L.rows;
const n = x => String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const short = v => String(v || '').split('(')[0];
const cnt = (list, f) => list.filter(f).length;
const removed = rows.filter(r => r.inlineDelta !== null && r.inlineDelta < 0), grew = rows.filter(r => r.inlineDelta !== null && r.inlineDelta > 0);
const notPassedRemoved = removed.filter(r => short(r.verdict) !== '통과');
const end = S.end, start = S.start;
const blocks = (end.officialInlineBlocks || []).map(b => b.lines);
const pairs = (S.indexHtmlOpenOverlaps || []).map(p => '#' + Math.min(p[0], p[1]) + '·#' + Math.max(p[0], p[1]));
const F = {
  range: '병합 PR ' + rows.length + '건(#' + rows[0].pr + ' ~ #' + rows[rows.length - 1].pr + ', main ' + S.from + ' → ' + S.to + ')',
  verdicts: '법정 판정 「통과」 ' + cnt(rows, r => short(r.verdict) === '통과') + '건 · 「확인 부족」 ' + cnt(rows, r => short(r.verdict) === '확인 부족') + '건 · 판정 댓글 없음 ' + cnt(rows, r => !r.verdict) + '건 · court 검사 성공 ' + cnt(rows, r => r.courtCheck === 'SUCCESS') + '건 · 돌려보냄 누적이 1 이상인 PR ' + cnt(rows, r => r.rejects > 0) + '건',
  inline: '공식 지표 inlineScriptLines ' + n(start.ratchet.inlineScriptLines) + ' → ' + n(end.ratchet.inlineScriptLines),
  blocks: '남은 인라인 블록 ' + blocks.length + '개의 줄 수 ' + blocks.join(' · ') + '(합 ' + blocks.reduce((a, b) => a + b, 0) + ')',
  lump: '덩어리(인라인 IIFE) ' + n(start.lumpIifeLines) + '줄 → ' + n(end.lumpIifeLines) + '줄',
  size: 'index.html ' + n(start.indexHtmlLines) + ' → ' + n(end.indexHtmlLines) + '줄 · 세포(modules.json) ' + start.modulesJsonCells + ' → ' + end.modulesJsonCells + '개 · js 파일 ' + start.jsFiles + ' → ' + end.jsFiles + '개 · script 태그 ' + start.scriptTags + ' → ' + end.scriptTags + '개',
  others: '그 밖의 공식 지표: index.html 함수 선언 ' + start.ratchet.indexFunctionDecls + ' → ' + end.ratchet.indexFunctionDecls + ' · window 대입 ' + start.ratchet.windowAssignments + ' → ' + end.ratchet.windowAssignments + ' · 800줄 넘는 js ' + start.ratchet.oversizeJsFiles + ' → ' + end.ratchet.oversizeJsFiles + ' · 탭 사이 참조 ' + start.ratchet.crossTabRefs + ' → ' + end.ratchet.crossTabRefs,
  removed: '줄을 지운 PR ' + removed.length + '건(합 ' + n(Math.abs(removed.reduce((a, r) => a + r.inlineDelta, 0))) + '줄): 「통과」 ' + cnt(removed, r => short(r.verdict) === '통과') + '건 · 「확인 부족」 ' + notPassedRemoved.length + '건(' + notPassedRemoved.map(r => '#' + r.pr).join(' · ') + ')',
  removedNotPassed: '「확인 부족」 ' + notPassedRemoved.length + '건의 법정 항목 집계: ' + notPassedRemoved.map(r => '#' + r.pr + ' 동작 보존 확인 ' + r.preserveConfirmed + ' · 확인 못 함 ' + (r.notConfirmed || []).length).join(' / '),
  grew: '줄이 늘어난 PR ' + grew.length + '건: ' + grew.map(r => '#' + r.pr + '(+' + r.inlineDelta + ', ' + n(r.inlineBefore) + ' → ' + n(r.inlineAfter) + ')').join(' · '),
  overlaps: 'index.html 을 바꾸는 PR 이 같은 때에 둘 열려 있던 짝 ' + pairs.length + '건(' + pairs.join(', ') + ')',
  headMismatch: '판정 댓글이 심사한 커밋이 PR 머리와 다른 PR ' + S.verdictHeadIsPrHead.no.length + '건(' + S.verdictHeadIsPrHead.no.map(p => '#' + p).join(' · ') + ')',
};
// 철거 PR = 제목에 「배선 철거」·「재철거」·「철거 2차」가 든, index.html 을 바꾼 PR(「모의 철거」를 말하는 own 적용 PR 은 아니다)
const allUnwire = rows.filter(r => /배선 철거|재철거|철거 2차/.test(r.title || '') && r.touchesIndexHtml);
const unwire = allUnwire.filter(r => r.inlineDelta !== null && r.inlineDelta < 0);
F.unwire = '철거 PR ' + allUnwire.length + '건 가운데 줄 수가 준 것 ' + unwire.length + '건(' + unwire.map(r => '#' + r.pr + ' ' + r.inlineDelta).join(' · ') + ')';
F.mergedBy = '병합한 계정: ' + Object.entries(S.mergedByCounts || {}).map(([k, v]) => k + ' ' + v + '건').join(' · ') + ' — 지시함을 바꾼 PR ' + (S.directivesMergedBy || []).map(d => '#' + d.pr + '(' + d.mergedBy + ')').join(' · ');
const lines = Object.keys(F).map(k => '- ' + F[k]);
module.exports = { F, ledger: L };
if (require.main !== module) return;
const ci = process.argv.indexOf('--check');
if (ci >= 0) {
  const doc = fs.readFileSync(process.argv[ci + 1], 'utf8'); const OPTIONAL = ['mergedBy']; /* 지시함 본문에는 안 쓰고 PR 본문에만 쓰는 문장 */ const miss = Object.keys(F).filter(k => OPTIONAL.indexOf(k) < 0 && !doc.includes(F[k])); const holes = (doc.match(/【[^】]*】/g) || []);
  console.log(JSON.stringify({ fragments: Object.keys(F).length, missing: miss, placeholders: holes.length, firstPlaceholders: holes.slice(0, 5) }, null, 1));
  process.exit(miss.length || holes.length ? 1 : 0);
}
fs.writeFileSync(path.join(DIR, 'measure-lines.md'), '# 지시함 완료 기록에 적는 숫자 문장 (pr-ledger.json 에서 만든 것)\n\n' + lines.join('\n') + '\n', { encoding: 'utf8' });
console.log(lines.join('\n'));
