'use strict';
// sweep 모의 적용 사본의 측정 모음(작업자 측정, 판정 아님). 모의 = 기준 커밋의 git 작업 폴더에 고친 생성기를 mock-config.json("groups":"all")으로 돌리고 module-specs --write 까지 한 것. 실제 적용은 0 이다.
// 이 수치는 측정 시점 main 의 참고값이다 — 구역 이전(다른 PR)이 병합되면 문이 없는 구획이 늘어 값이 달라진다. 실제 sweep PR 은 그때의 index.html 로 다시 잰다.
// 사용: node mock-measure.cjs <작업 트리> <기준 작업 폴더> <모의 작업 폴더> <raw 폴더> <생성기 메타.json>
//   raw 폴더: tests-all.{base,mock}.json · npm-test.{base,mock}.{log,exit} · crc.{base,mock}.json(대조 탐침 --fingerprints) · scenario.json(scenario-local)
const fs = require('fs'), path = require('path'), cp = require('child_process');
const parser = require('@babel/parser');
const [WORK_ARG, BASE, MOCK, RAW, META] = process.argv.slice(2);
const WORK = path.resolve(WORK_ARG), DIR = path.join(WORK, 'reports', 'TASK-ES-661');
const rj = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const git = (d, a) => cp.execFileSync('git', a, { cwd: d, encoding: 'utf8' }).trim();
const node = (cwd, args) => cp.spawnSync(process.execPath, args, { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const meta = rj(META);

// 1) 토큰열(주석 제외) 동일 · 사라진 줄은 실행 글자 없는 줄뿐 — 생성기와 따로
const scriptOf = text => {
  const ls = text.split('\n').map(l => l.replace(/\r$/, '')); let s = -1, e = -1;
  for (let i = 0; i < ls.length; i++) if (ls[i].trim() === '<script>' && (ls[i + 1] || '').trim() === '(function(){' && (ls[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
  for (let i = s; i < ls.length; i++) if (ls[i].startsWith('</script>')) { e = i; break; }
  const ast = parser.parse(ls.slice(s, e).join('\n'), { sourceType: 'script', tokens: true });
  const toks = ast.tokens.filter(t => typeof t.type !== 'string' && t.type.label !== 'eof');
  const codeLine = new Set(); for (const t of toks) for (let l = t.loc.start.line + s; l <= t.loc.end.line + s; l++) codeLine.add(l);
  return { ls, s, e, sig: toks.map(t => (t.type.label || '') + ' ' + (t.value === undefined ? '' : String(t.value))), codeLine };
};
const bt = fs.readFileSync(path.join(BASE, 'index.html'), 'utf8'), mt = fs.readFileSync(path.join(MOCK, 'index.html'), 'utf8');
const b = scriptOf(bt), m = scriptOf(mt);
const removed = []; { let j = 0; for (let i = 0; i < b.ls.length; i++) { if (j < m.ls.length && b.ls[i] === m.ls[j]) j++; else removed.push(i + 1); } var restSame = j === m.ls.length; }
const tokens = { count: [b.sig.length, m.sig.length], same: b.sig.length === m.sig.length && b.sig.every((v, i) => v === m.sig[i]), removedLines: removed.length, removedLinesWithCode: removed.filter(l => b.codeLine.has(l)).length, removedOutsideScript: removed.filter(l => l <= b.s || l > b.e).length, restSame };

// 2) 종류별 표(생성기와 따로 만든 집계)
const survey = (tree, name) => { const out = path.join(DIR, name); const r = node(WORK, [path.join(DIR, 'tools', 'sweep-survey.cjs'), path.join(tree, 'index.html'), out]); if (r.status !== 0) throw new Error('survey 실패: ' + r.stderr); return rj(out); };
const sb = survey(BASE, 'sweep-survey.base.json'), sm = survey(MOCK, 'sweep-survey.mock.json');

// 3) 사라지는 낱말이 시험·가드 글자에 있는가(정적 후보 — 실측은 아래 시험 비교)
const pinFiles = fs.readdirSync(path.join(BASE, 'tests')).filter(f => f.endsWith('.js')).map(f => 'tests/' + f)
  .concat(fs.existsSync(path.join(BASE, 'tests', 'helpers')) ? fs.readdirSync(path.join(BASE, 'tests', 'helpers')).filter(f => f.endsWith('.js')).map(f => 'tests/helpers/' + f) : [])
  .concat(['scripts/smoke-test.js', 'scripts/verify-integrity-gate.js', 'scripts/verify-all-clicks.js', 'scripts/test-shipyard-modular.js', 'scripts/module-guard.js', 'scripts/module-metrics.js']).filter(f => fs.existsSync(path.join(BASE, f)));
const pinText = Object.fromEntries(pinFiles.map(f => [f, fs.readFileSync(path.join(BASE, f), 'utf8')]));
const wordHits = meta.vanishedWords.map(w => { const re = new RegExp('(^|[^\\w$])' + w.replace(/\$/g, '\\$') + '($|[^\\w$])'); return { word: w, files: pinFiles.filter(f => re.test(pinText[f])) }; }).filter(x => x.files.length);

// 4) 모듈 로드 · 지문 · 시나리오 · 시험 · npm test · 지표 · 지도 도구
const ml = require(path.join(WORK, 'court', 'probes', 'module-load.js'));
const mlc = ml.compare(ml.probeModules(BASE), ml.probeModules(MOCK), mt);
const cb = rj(path.join(RAW, 'crc.base.json')), cm = rj(path.join(RAW, 'crc.mock.json'));
const fp = {}; for (const k of ['scope', 'window']) { const fb = cb.fingerprints[k], fw = cm.fingerprints[k], names = Object.keys(fb); fp[k] = { names: names.length, diff: names.filter(n => JSON.stringify(fb[n]) !== JSON.stringify(fw[n])) }; }
const sc = rj(path.join(RAW, 'scenario.json'));
const tb = rj(path.join(RAW, 'tests-all.base.json')), tm = rj(path.join(RAW, 'tests-all.mock.json'));
const tdiff = Object.keys(tb).filter(k => !tm[k] || tb[k].exit !== tm[k].exit || tb[k].okLines !== tm[k].okLines);
const npm = {};
for (const label of ['base', 'mock']) {
  const log = fs.readFileSync(path.join(RAW, 'npm-test.' + label + '.log'), 'utf8'), exit = Number(fs.readFileSync(path.join(RAW, 'npm-test.' + label + '.exit'), 'utf8').replace(/[^0-9]/g, ''));
  const ls = log.split(/\r?\n/);
  npm[label] = { exit, checkLines: ls.filter(l => /^\s*✓/.test(l)).length, okLines: ls.filter(l => /^\s*ok\b/.test(l)).length, summaryLines: ls.filter(l => /\d+개 통과, \d+개 실패|총 \d+개 검사 중 \d+개 통과|ALL PASS|100% COMPLETE/.test(l)).map(l => l.trim()) };
}
npm.same = npm.base.exit === npm.mock.exit && npm.base.checkLines === npm.mock.checkLines && npm.base.okLines === npm.mock.okLines && JSON.stringify(npm.base.summaryLines) === JSON.stringify(npm.mock.summaryLines);
const metrics = d => JSON.parse(node(d, ['scripts/module-metrics.js']).stdout).ratchet;
const mb = metrics(BASE), mm = metrics(MOCK);
const guard = node(MOCK, ['scripts/module-guard.js']);
// 지도 도구: 사본에서 지도를 다시 쓰고(--write — 기준·모의 작업 폴더는 측정 뒤 지운다) 묶음 제목을 맞댄다. 유형 도구는 지도가 지금 index.html 과 같을 때만 돈다
const mapRun = d => { const r = node(d, ['scripts/inline-script-map.js', '--root', d, '--write']); let titles = null; try { titles = rj(path.join(d, 'docs', 'architecture', 'inline-script-map.json')).groups.map(g => g.title); } catch (_) { /* 못 읽으면 null */ } return { status: r.status, groups: titles && titles.length, titles }; };
const typesRun = d => { const r = node(d, ['scripts/inline-hard-types.js', '--root', d]); return { status: r.status }; };
const mapB = mapRun(BASE), mapM = mapRun(MOCK);
const tools = { inlineScriptMap: { base: { status: mapB.status, groups: mapB.groups }, mock: { status: mapM.status, groups: mapM.groups }, sameTitles: !!mapB.titles && JSON.stringify(mapB.titles) === JSON.stringify(mapM.titles) }, inlineHardTypes: { base: typesRun(BASE), mock: typesRun(MOCK) } };

const out = { task: 'TASK-ES-661', type: '작업자 측정, 판정 아님', note: '측정 시점 main(' + git(BASE, ['rev-parse', 'HEAD']).slice(0, 8) + ')의 참고값이다. 구역 이전이 병합되면 문이 없는 구획이 늘어 값이 달라진다. 실제 적용은 0 이다(모의 작업 폴더는 측정 뒤 지운다).',
  baseHead: git(BASE, ['rev-parse', 'HEAD']), config: 'reports/TASK-ES-661/mock-config.json',
  generator: { emptyGroups: meta.emptyGroups, deleted: meta.deleted, kept: meta.kept, gapLinesBefore: meta.gapLinesBefore, gapLinesAfter: meta.gapLinesAfter, htmlLines: [meta.htmlLinesBefore, meta.htmlLinesAfter], targets: meta.targets },
  independentSurvey: { before: { iifeLines: sb.iifeLines, lineKinds: sb.lineKinds, emptyGroups: sb.groups.empty, emptyGroupHeaderLines: sb.emptyGroups.headerLines, emptyGroupCommentLines: sb.emptyGroups.commentLines, emptyGroupBlankLines: sb.emptyGroups.blankLines },
    after: { iifeLines: sm.iifeLines, lineKinds: sm.lineKinds, emptyGroups: sm.groups.empty, emptyGroupHeaderLines: sm.emptyGroups.headerLines, emptyGroupCommentLines: sm.emptyGroups.commentLines, emptyGroupBlankLines: sm.emptyGroups.blankLines },
    agreesWithGenerator: sb.emptyGroups.commentLines + sb.emptyGroups.blankLines === meta.deleted.lines && sb.iifeLines - sm.iifeLines === meta.deleted.lines && sm.emptyGroups.commentLines + sm.emptyGroups.blankLines === 0 && sb.lineKinds.stmt === sm.lineKinds.stmt && sb.lineKinds['comment:header'] === sm.lineKinds['comment:header'] && sb.lineKinds['comment:slot'] === sm.lineKinds['comment:slot'] },
  tokens,
  vanishedWords: { count: meta.vanishedWords.length, inTestOrGuardFiles: wordHits, inTestOrGuardFilesCount: wordHits.length, scannedFiles: pinFiles.length, note: '지운 주석에만 남아 있던 식별자 꼴 낱말(4자 이상) 가운데 시험·가드 파일 글자에도 나오는 것. 나온다고 붙잡힌 것은 아니다(시험이 세포 합본에서 찾는 이름이 대부분) — 붙잡혔는지는 아래 시험 비교가 잰다.' },
  moduleLoad: { regressions: mlc.regressions, counts: mlc.counts },
  fingerprints: { scopeNames: fp.scope.names, scopeDiff: fp.scope.diff, windowNames: fp.window.names, windowDiff: fp.window.diff, scopeLost: cm.namesFrom.scopeLost, scopeAdded: cm.namesFrom.scopeAdded, mismatches: [cb.counts.mismatches, cm.counts.mismatches] },
  scenario: { allPassedBoth: sc.allPassedBoth, rows: Object.keys(sc.scenarios).map(id => ({ id, base: sc.scenarios[id].runs.base.passed, base2: sc.scenarios[id].runs.base2.passed, mock: sc.scenarios[id].runs.work.passed, exceptionsMock: (sc.scenarios[id].runs.work.exceptions || []).length })) },
  testsAll: { files: Object.keys(tb).length, differingCount: tdiff.length, differing: tdiff.map(k => ({ file: k, base: [tb[k].exit, tb[k].okLines], mock: tm[k] ? [tm[k].exit, tm[k].okLines] : null })), nonZeroExit: [Object.keys(tb).filter(k => tb[k].exit !== 0).length, Object.keys(tm).filter(k => tm[k].exit !== 0).length] },
  npmTest: npm,
  metrics: { inlineScriptLines: [mb.inlineScriptLines, mm.inlineScriptLines], delta: mm.inlineScriptLines - mb.inlineScriptLines, indexFunctionDecls: [mb.indexFunctionDecls, mm.indexFunctionDecls], windowAssignments: [mb.windowAssignments, mm.windowAssignments] },
  moduleGuard: { exitCode: guard.status },
  mapTools: tools,
  pinnedComments: { list: meta.kept, count: meta.kept.length, note: '이 시점 main 에서는 지운 주석 가운데 시험·가드가 붙잡은 것이 없었다(keep 0 으로 돌린 모의 사본의 시험 결과가 기준과 같다).' } };
out.ok = tokens.same && tokens.removedLinesWithCode === 0 && tokens.removedOutsideScript === 0 && tokens.restSame && tokens.removedLines === meta.deleted.lines && out.independentSurvey.agreesWithGenerator
  && mlc.regressions.length === 0 && fp.scope.diff.length === 0 && fp.window.diff.length === 0 && cm.namesFrom.scopeLost.length === 0 && cm.namesFrom.scopeAdded.length === 0 && sc.allPassedBoth === true
  && tdiff.length === 0 && npm.same && npm.mock.exit === 0 && out.metrics.delta === -meta.deleted.lines && guard.status === 0 && tools.inlineScriptMap.mock.status === 0 && tools.inlineScriptMap.sameTitles === true && tools.inlineHardTypes.mock.status === 0;
fs.writeFileSync(path.join(DIR, 'mock-apply.json'), JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify({ ok: out.ok, deleted: meta.deleted, tokens, survey: out.independentSurvey.agreesWithGenerator, words: [meta.vanishedWords.length, wordHits.length], ml: mlc.regressions, fp: [fp.scope.diff.length, fp.window.diff.length], sc: sc.allPassedBoth, tests: tdiff.length, npm: [npm.base.exit, npm.mock.exit, npm.base.checkLines, npm.mock.checkLines, npm.same], metrics: out.metrics, guard: guard.status, tools }));
