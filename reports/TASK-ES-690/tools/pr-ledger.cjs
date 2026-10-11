#!/usr/bin/env node
'use strict';
// #TASK-ES-690 — DIR-003·DIR-004 완료 기록의 PR 대장(작업자 측정 도구, 판정 아님).
// 시작 커밋부터 끝 커밋까지 main 에 first-parent 로 들어온 병합 PR 마다, 사람이 손으로 옮겨 적지 않고 아래를 뽑는다.
//   - GitHub 기록: PR 번호·제목·병합 시각·병합 커밋·PR 머리, 법정 판정 댓글(github-actions 가 단 것 — 작업자는 쓸 수 없다)의 판정 글자·판정번호·심사한 커밋·주소, court 검사 결과
//   - 공식 지표: 그 병합 커밋과 바로 앞 커밋에서 scripts/module-metrics.js(그 커밋에 든 스크립트)를 돌린 값 — inlineScriptLines 등
//   - index.html 의 인라인 스크립트 블록과 그 안의 즉시 실행 함수(IIFE) 줄 수(@babel/parser)
// 지표를 재려면 커밋을 차례로 꺼내 볼 작업 폴더가 하나 필요하다(--scan-tree). 그 폴더는 detached 로 계속 바뀌므로 다른 일에 쓰지 않는 전용 폴더를 준다.
// 사용: NODE_PATH=<node_modules> node reports/TASK-ES-690/tools/pr-ledger.cjs --repo <git 저장소> --slug <owner/name> --from <시작 커밋> --to <끝 커밋> --scan-tree <전용 작업 폴더> --out <폴더>
const fs = require('fs'), path = require('path'), cp = require('child_process');
const arg = n => { const i = process.argv.indexOf('--' + n); return i >= 0 ? process.argv[i + 1] : null; };
const REPO = arg('repo'), SLUG = arg('slug'), FROM = arg('from'), TO = arg('to') || 'origin/main', SCAN = arg('scan-tree'), OUT = arg('out');
if (!REPO || !SLUG || !FROM || !SCAN || !OUT) { console.error('사용: node pr-ledger.cjs --repo <저장소> --slug <owner/name> --from <시작> --to <끝> --scan-tree <전용 작업 폴더> --out <폴더>'); process.exit(2); }
const parser = require('@babel/parser');
const env = Object.assign({}, process.env, { MSYS_NO_PATHCONV: '1' });
const git = (cwd, args) => cp.execFileSync('git', ['-C', cwd].concat(args), { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env });
const gh = args => cp.execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env });

// 1) first-parent 병합 목록(오래된 것부터)
const fromSha = git(REPO, ['rev-parse', FROM]).trim(), toSha = git(REPO, ['rev-parse', TO]).trim();
// --include-from: 시작 커밋 자신(= B1 PR 의 병합 커밋)도 대장 첫 줄에 넣는다. 「시작 값」은 그대로 시작 커밋에서 잰다.
const INCLUDE_FROM = process.argv.includes('--include-from');
const log = git(REPO, ['log', '--first-parent', '--reverse', '--format=%H%x09%P%x09%s', (INCLUDE_FROM ? fromSha + '^1' : fromSha) + '..' + toSha]).trim().split('\n').filter(Boolean);
const merges = log.map(l => { const [sha, parents, subject] = l.split('\t'); const m = /Merge pull request #(\d+)/.exec(subject) || /\(#(\d+)\)\s*$/.exec(subject); return { sha, firstParent: parents.split(' ')[0], pr: m ? Number(m[1]) : null, subject }; });

// 2) 커밋별 공식 지표 + 인라인 블록(중복 커밋은 한 번만)
const metricCache = {};
function metricsAt(sha) {
  if (metricCache[sha]) return metricCache[sha];
  git(SCAN, ['checkout', '-q', '--detach', sha]);
  let m = null, err = null;
  try { m = JSON.parse(cp.execFileSync(process.execPath, ['scripts/module-metrics.js'], { cwd: SCAN, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env })); } catch (e) { err = String(e && e.message).split('\n')[0].slice(0, 160); }
  const html = fs.readFileSync(path.join(SCAN, 'index.html'), 'utf8');
  const blocks = []; const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/g; let x;
  while ((x = re.exec(html))) { if (/\bsrc\s*=/.test(x[1])) continue; const body = x[2]; let iifeLines = 0, iifes = 0, topStatements = null;
    try { const ast = parser.parse(body, { sourceType: 'script', errorRecovery: true }); topStatements = ast.program.body.length; for (const st of ast.program.body) { if (st.type !== 'ExpressionStatement') continue; let c = st.expression; if (c.type === 'UnaryExpression') c = c.argument; if (c.type !== 'CallExpression') continue; const f = c.callee; if (f.type === 'FunctionExpression' || f.type === 'ArrowFunctionExpression') { iifes++; iifeLines += st.loc.end.line - st.loc.start.line + 1; } } } catch (e) { topStatements = null; }
    blocks.push({ startLine: html.slice(0, x.index).split('\n').length, bodyLines: body.split('\n').length, iifes, iifeLines, topStatements, hasCreateClientCall: /createClient\(/.test(body), declaresServerConstants: /SUPABASE_ANON_KEY\s*=/.test(body) }); }
  const jsFiles = git(SCAN, ['ls-files', 'js']).split('\n').filter(f => /\.js$/.test(f)).length;
  let cells = null; try { const mod = JSON.parse(fs.readFileSync(path.join(SCAN, 'docs', 'architecture', 'modules.json'), 'utf8')); cells = Array.isArray(mod.cells) ? mod.cells.length : Object.keys(mod.cells || {}).length; } catch (e) { cells = null; }
  const r = { sha: sha.slice(0, 8), metricsError: err, ratchet: m ? { inlineScriptLines: m.ratchet.inlineScriptLines, indexFunctionDecls: m.ratchet.indexFunctionDecls, windowAssignments: m.ratchet.windowAssignments, oversizeJsFiles: m.ratchet.oversizeJsFiles && m.ratchet.oversizeJsFiles.count, crossTabRefs: m.ratchet.crossTabRefs } : null,
    officialInlineBlocks: m && m.info ? m.info.inlineScriptBlocks : null, indexHtmlLines: html.split('\n').length - (html.endsWith('\n') ? 1 : 0), inlineBlocks: blocks,
    // 덩어리 = 서버 연결 상수나 연결 만들기가 들었거나 문이 가장 많은 인라인 블록 안의 즉시 실행 함수. 그 줄 수(없으면 0)
    lumpIifeLines: (() => { const b = blocks.filter(k => k.hasCreateClientCall || k.declaresServerConstants || k.bodyLines > 100); return b.reduce((n, k) => n + k.iifeLines, 0); })(),
    scriptTags: (html.match(/<script\b/g) || []).length, jsFiles, modulesJsonCells: cells };
  metricCache[sha] = r; return r;
}
const startM = metricsAt(fromSha);

// 3) PR 마다 GitHub 기록
const rows = [];
for (const mg of merges) {
  const after = metricsAt(mg.sha), before = metricsAt(mg.firstParent);
  const row = { pr: mg.pr, mergeCommit: mg.sha.slice(0, 8), subject: mg.subject.slice(0, 120), inlineBefore: before.ratchet && before.ratchet.inlineScriptLines, inlineAfter: after.ratchet && after.ratchet.inlineScriptLines };
  row.inlineDelta = (row.inlineBefore !== null && row.inlineAfter !== null && row.inlineBefore !== undefined && row.inlineAfter !== undefined) ? row.inlineAfter - row.inlineBefore : null;
  row.lumpIifeBefore = before.lumpIifeLines; row.lumpIifeAfter = after.lumpIifeLines;
  if (mg.pr) {
    try {
      const j = JSON.parse(gh(['pr', 'view', String(mg.pr), '-R', SLUG, '--json', 'number,title,createdAt,mergedAt,mergedBy,mergeCommit,headRefOid,headRefName,comments,statusCheckRollup,files,url']));
      row.title = j.title; row.createdAt = j.createdAt; row.mergedAt = j.mergedAt; row.mergedBy = j.mergedBy && j.mergedBy.login ? j.mergedBy.login : null; row.url = j.url; row.headRefOid = (j.headRefOid || '').slice(0, 8); row.branch = j.headRefName;
      row.ghMergeCommit = j.mergeCommit && j.mergeCommit.oid ? j.mergeCommit.oid.slice(0, 8) : null; row.mergeCommitMatches = row.ghMergeCommit === row.mergeCommit;
      const files = (j.files || []).map(f => f.path); row.files = files.length; row.touchesIndexHtml = files.includes('index.html'); row.touchesJs = files.some(f => /^js\//.test(f)); row.touchesTests = files.some(f => /^tests\//.test(f)); row.touchesDirectives = files.some(f => /^docs\/directives\//.test(f));
      const idx = (j.files || []).find(f => f.path === 'index.html'); row.indexHtmlAdded = idx ? idx.additions : 0; row.indexHtmlDeleted = idx ? idx.deletions : 0;
      const court = (j.statusCheckRollup || []).filter(c => (c.name || c.context) === 'court'); row.courtCheck = court.length ? (court[court.length - 1].conclusion || court[court.length - 1].state || null) : null;
      const verdicts = (j.comments || []).filter(c => c.author && c.author.login === 'github-actions' && /<!-- court-verdict -->/.test(c.body || ''));
      row.verdictComments = verdicts.length;
      if (verdicts.length) { const v = verdicts[verdicts.length - 1]; const meta = /<!-- court-meta head=([0-9a-f]+) verdictId=([0-9A-Fa-f]+)(?: run=(\d+))? -->/.exec(v.body) || []; const line = /\*\*판정:\s*([^*\n]+?)\*\*/.exec(v.body);
        const full = line ? line[1].trim() : null; row.verdict = full ? full.split(' — ')[0].trim() : null; row.verdictReason = full && full.indexOf(' — ') >= 0 ? full.split(' — ').slice(1).join(' — ').slice(0, 160) : null;
        // 판정 댓글의 항목 집계 줄(예: 「지시 항목 10건 중: 동작 보존 확인 6 · 글자만 확인 2 · 확인 못 함 2」)과 표의 「확인 못 함」 줄
        const items = /\*\*작업자가 적어 낸 지시 항목 (\d+)건 중:\s*([^*\n]+?)\*\*/.exec(v.body);
        row.verdictItems = items ? { total: Number(items[1]), text: items[2].trim() } : null;
        const pc = items ? /동작 보존 확인 (\d+)/.exec(items[2]) : null; row.preserveConfirmed = pc ? Number(pc[1]) : (items ? 0 : null);
        row.notConfirmed = (v.body.match(/^\|[^\n]*\*\*확인 못 함[^\n]*$/gm) || []).map(l => { const c = l.split('|').map(s => s.trim()); return { id: c[1], text: (c[2] || '').slice(0, 110), result: (c[3] || '').replace(/\*/g, '') }; });
        const hist = /<!-- court-history (.+?) -->/.exec(v.body); try { row.rejects = hist ? JSON.parse(hist[1]).rejects : null; } catch (e) { row.rejects = null; }
        row.verdictId = meta[2] || null; row.verdictHead = meta[1] ? meta[1].slice(0, 8) : null; row.verdictRun = meta[3] || null; row.verdictUrl = v.url; row.verdictHeadIsPrHead = !!(meta[1] && j.headRefOid && meta[1] === j.headRefOid); }
      else { row.verdict = null; row.verdictId = null; row.verdictUrl = null; }
    } catch (e) { row.ghError = String(e && e.message).split('\n')[0].slice(0, 200); }
  }
  rows.push(row);
}
const endM = metricsAt(toSha);
// 원래 자리로 돌려놓는다(전용 폴더지만 끝 커밋에 세워 둔다)
git(SCAN, ['checkout', '-q', '--detach', toSha]);

const by = (f) => rows.reduce((o, r) => { const k = f(r); o[k] = (o[k] || 0) + 1; return o; }, {});
const removed = rows.filter(r => r.inlineDelta !== null && r.inlineDelta < 0), grew = rows.filter(r => r.inlineDelta !== null && r.inlineDelta > 0);
const summary = {
  from: fromSha.slice(0, 8), to: toSha.slice(0, 8), merges: rows.length, withPrNumber: rows.filter(r => r.pr).length,
  start: startM, end: endM,
  verdictCounts: by(r => r.verdict || '(판정 댓글 없음)'), courtCheckCounts: by(r => r.courtCheck || '(없음)'),
  verdictHeadIsPrHead: { yes: rows.filter(r => r.verdictHeadIsPrHead === true).length, no: rows.filter(r => r.verdictHeadIsPrHead === false).map(r => r.pr) },
  lineRemovingPrs: { count: removed.length, totalRemoved: removed.reduce((n, r) => n + r.inlineDelta, 0), verdictCounts: removed.reduce((o, r) => { const k = r.verdict || '(판정 댓글 없음)'; o[k] = (o[k] || 0) + 1; return o; }, {}), list: removed.map(r => ({ pr: r.pr, delta: r.inlineDelta, verdict: r.verdict, verdictId: r.verdictId, preserveConfirmed: r.preserveConfirmed, notConfirmed: (r.notConfirmed || []).map(n => n.id + ' ' + n.result) })),
    notPassed: removed.filter(r => r.verdict !== '통과').map(r => ({ pr: r.pr, delta: r.inlineDelta, verdict: r.verdict, verdictId: r.verdictId, items: r.verdictItems && r.verdictItems.text, preserveConfirmed: r.preserveConfirmed, notConfirmed: r.notConfirmed, verdictUrl: r.verdictUrl })) },
  lineGrowingPrs: grew.map(r => ({ pr: r.pr, delta: r.inlineDelta, before: r.inlineBefore, after: r.inlineAfter, verdict: r.verdict, verdictId: r.verdictId, title: (r.title || '').slice(0, 90) })),
  touchesIndexHtml: rows.filter(r => r.touchesIndexHtml).length, touchesTests: rows.filter(r => r.touchesTests).map(r => r.pr), touchesDirectives: rows.filter(r => r.touchesDirectives).map(r => r.pr),
  mergedByCounts: by(r => r.mergedBy || '(모름)'), directivesMergedBy: rows.filter(r => r.touchesDirectives).map(r => ({ pr: r.pr, mergedBy: r.mergedBy })),
  rejectedThenPassed: rows.filter(r => r.rejects > 0).map(r => ({ pr: r.pr, rejects: r.rejects, verdict: r.verdict })),
  // index.html 을 바꾸는 PR 이 같은 때에 둘 이상 열려 있었는가(연 때 ~ 병합한 때가 겹치는 짝)
  indexHtmlOpenOverlaps: (() => { const a = rows.filter(r => r.touchesIndexHtml && r.createdAt && r.mergedAt); const o = []; for (let i = 0; i < a.length; i++) for (let k = i + 1; k < a.length; k++) { if (a[i].createdAt < a[k].mergedAt && a[k].createdAt < a[i].mergedAt) o.push([a[i].pr, a[k].pr]); } return o; })(),
  netInlineDelta: (endM.ratchet && startM.ratchet) ? endM.ratchet.inlineScriptLines - startM.ratchet.inlineScriptLines : null, sumOfDeltas: rows.reduce((n, r) => n + (r.inlineDelta || 0), 0) };
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'pr-ledger.json'), JSON.stringify({ tool: 'reports/TASK-ES-690/tools/pr-ledger.cjs', type: '작업자 측정 도구의 산출 — 판정 글자·판정번호·주소는 GitHub 의 법정 댓글에서 읽은 것', measuredAt: new Date().toISOString(), slug: SLUG, summary, rows }, null, 1) + '\n', { encoding: 'utf8' });
// 표(마크다운)
const esc = s => String(s === null || s === undefined ? '' : s).replace(/\|/g, '/');
const md = [];
md.push('# DIR-003·DIR-004 구간의 병합 PR 대장 (' + summary.from + ' → ' + summary.to + ')');
md.push('');
md.push('`reports/TASK-ES-690/tools/pr-ledger.cjs` 산출이다(손으로 옮겨 적은 칸 없음). 판정 글자·판정번호·주소는 GitHub 의 법정 댓글(github-actions)에서, 줄 수는 각 병합 커밋과 바로 앞 커밋에서 그 커밋의 `scripts/module-metrics.js` 를 돌려 읽었다.');
md.push('');
md.push('- 병합 ' + summary.merges + '건 · 판정: ' + Object.entries(summary.verdictCounts).map(([k, v]) => k + ' ' + v).join(' · ') + ' · court 검사: ' + Object.entries(summary.courtCheckCounts).map(([k, v]) => k + ' ' + v).join(' · '));
md.push('- 공식 지표 inlineScriptLines ' + (startM.ratchet && startM.ratchet.inlineScriptLines) + ' → ' + (endM.ratchet && endM.ratchet.inlineScriptLines) + ' (PR 별 증감의 합 ' + summary.sumOfDeltas + ') · 줄을 지운 PR ' + summary.lineRemovingPrs.count + '건(합 ' + summary.lineRemovingPrs.totalRemoved + ') · 줄이 늘어난 PR ' + grew.length + '건(' + grew.map(r => '#' + r.pr + ' +' + r.inlineDelta).join(' · ') + ')');
md.push('- 덩어리(IIFE) 줄 수 ' + startM.lumpIifeLines + ' → ' + endM.lumpIifeLines + ' · index.html ' + startM.indexHtmlLines + ' → ' + endM.indexHtmlLines + '줄 · js 파일 ' + startM.jsFiles + ' → ' + endM.jsFiles + ' · 세포(modules.json) ' + startM.modulesJsonCells + ' → ' + endM.modulesJsonCells);
md.push('');
md.push('| PR | 병합(UTC) | 인라인 줄 앞 → 뒤 | 증감 | 판정 | 판정번호 | 항목 집계(법정 댓글) | 심사 커밋 = PR 머리 | 판정 주소 | 제목 |');
md.push('|---|---|---|---|---|---|---|---|---|---|');
for (const r of rows) md.push('| ' + (r.pr ? '#' + r.pr : '(번호 없음 ' + r.mergeCommit + ')') + ' | ' + esc((r.mergedAt || '').replace('T', ' ').replace('Z', '')) + ' | ' + esc(r.inlineBefore) + ' → ' + esc(r.inlineAfter) + ' | ' + (r.inlineDelta === null ? '' : (r.inlineDelta > 0 ? '+' : '') + r.inlineDelta) + ' | ' + esc(r.verdict ? r.verdict.split('(')[0] : '(판정 댓글 없음)') + ' | ' + esc(r.verdictId) + ' | ' + esc(r.verdictItems ? r.verdictItems.total + '건: ' + r.verdictItems.text.split('(이 종류는 그걸로 충분)').join('') : '') + ' | ' + (r.verdictHeadIsPrHead === true ? '같음' : r.verdictHeadIsPrHead === false ? '다름(' + esc(r.verdictHead) + ' / ' + esc(r.headRefOid) + ')' : '') + ' | ' + esc(r.verdictUrl) + ' | ' + esc((r.title || r.subject || '').replace(/^\[[^\]]+\]\s*/, '').slice(0, 70)) + ' |');
fs.writeFileSync(path.join(OUT, 'pr-ledger.md'), md.join('\n') + '\n', { encoding: 'utf8' });
console.log(JSON.stringify({ merges: summary.merges, verdictCounts: summary.verdictCounts, court: summary.courtCheckCounts, inline: [startM.ratchet && startM.ratchet.inlineScriptLines, endM.ratchet && endM.ratchet.inlineScriptLines], sum: summary.sumOfDeltas, removing: summary.lineRemovingPrs.count, removingVerdicts: summary.lineRemovingPrs.verdictCounts, grew: summary.lineGrowingPrs.map(g => '#' + g.pr + ' +' + g.delta), lump: [startM.lumpIifeLines, endM.lumpIifeLines], index: [startM.indexHtmlLines, endM.indexHtmlLines], cells: [startM.modulesJsonCells, endM.modulesJsonCells], js: [startM.jsFiles, endM.jsFiles], headMismatch: summary.verdictHeadIsPrHead.no }));
