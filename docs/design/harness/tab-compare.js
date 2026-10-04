'use strict';
/* tab-check.js 요약 JSON 두 개를 비교해 재현성(같은 커밋에서 두 번 잰 지표가 같은가)을 센다. (TASK-ES-349 · 노션 CORE-01)
 * 사용: node tab-compare.js <a.json> <b.json> [--out <diff.json>]
 * 장별 지표와 Dead-Click 결과를 항목마다 비교한다. 목록 이름(S1, H1 …)은 실행마다 번호가 달라질 수 있어 내용으로 풀어서 비교한다.
 */
const fs = require('fs'), path = require('path');

const argv = process.argv.slice(2);
const oi = argv.indexOf('--out');
const outFile = oi >= 0 ? path.resolve(argv[oi + 1]) : null;
const files = argv.filter((a, i) => a !== '--out' && (oi < 0 || i !== oi + 1));
if (files.length < 2) { console.error('사용: node tab-compare.js <a.json> <b.json> [--out <diff.json>]'); process.exit(2); }
const [A, B] = files.map(f => JSON.parse(fs.readFileSync(f, 'utf8')));

const SHOT_FIELDS = ['entered', 'docScrollHeight', 'heightRatio', 'noScroll', 'innerScrollers', 'smallTargets', 'smallTargetList', 'hiddenInteractive', 'hiddenInteractiveDetail',
  'importantNoneInScope', 'importantNoneInDoc', 'importantNoneRules', 'consoleErrors', 'consoleErrorsFromLoad', 'httpErrors', 'lvVisible', 'expVisible'];
const DEAD_FIELDS = ['candidates', 'clicked', 'reacted', 'deadCount', 'dead', 'covered', 'notClicked', 'sampledOut', 'alreadyInBase', 'cappedOut', 'mismatch', 'reactions', 'error'];
const SET_OF = { smallTargetList: 'smallTargetList', hiddenInteractiveDetail: 'hiddenInteractiveDetail', importantNoneRules: 'importantNoneRules' };

const resolve = (doc, field, v) => SET_OF[field] && typeof v === 'string' && doc.sets && doc.sets[SET_OF[field]] ? doc.sets[SET_OF[field]][v] : v;
const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);

const diffs = [];
let compared = 0;
const tabs = [...new Set([...Object.keys(A.tabs || {}), ...Object.keys(B.tabs || {})])];
for (const t of tabs) {
  const ta = A.tabs[t], tb = B.tabs[t];
  if (!ta || !tb) { diffs.push({ tab: t, what: '한쪽에만 있는 탭' }); continue; }
  const mb = new Map(tb.shots.map(s => [s.name, s]));
  for (const sa of ta.shots) {
    const sb = mb.get(sa.name);
    if (!sb) { diffs.push({ tab: t, shot: sa.name, what: 'B 에 없는 장' }); continue; }
    for (const f of SHOT_FIELDS) {
      compared++;
      const va = resolve(A, f, sa[f]), vb = resolve(B, f, sb[f]);
      if (!same(va, vb)) diffs.push({ tab: t, shot: sa.name, field: f, a: va, b: vb });
    }
  }
  for (const [k, da] of Object.entries(ta.deadClick || {})) {
    const db = (tb.deadClick || {})[k];
    if (!db) { diffs.push({ tab: t, deadClick: k, what: 'B 에 없는 Dead-Click 결과' }); continue; }
    for (const f of DEAD_FIELDS) {
      compared++;
      if (!same(da[f], db[f])) diffs.push({ tab: t, deadClick: k, field: f, a: da[f], b: db[f] });
    }
  }
}
const result = { a: { file: files[0], commit: A.commit, measuredAt: A.measuredAt }, b: { file: files[1], commit: B.commit, measuredAt: B.measuredAt },
  sameCommit: A.commit === B.commit, comparedValues: compared, differingValues: diffs.length, diffs };
if (outFile) fs.writeFileSync(outFile, JSON.stringify(result, null, 1) + '\n', 'utf8');
console.log('같은 커밋:', result.sameCommit, '| 비교한 값:', compared, '| 다른 값:', diffs.length);
for (const d of diffs.slice(0, 30)) console.log(' -', JSON.stringify(d).slice(0, 300));
