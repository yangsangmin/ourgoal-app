#!/usr/bin/env node
'use strict';
// #TASK-ES-676 측정 모음(작업자 측정, 판정 아님). 기준 트리(origin/main 임시 worktree)와 작업 트리(생성기를 proof.json 으로 돌린 것)를 맞댄다. #TASK-ES-671 의 측정(reports/TASK-ES-671/tools/measure-671.cjs)을 본떴다.
//  ① 글자: 옮긴 줄을 기준과 줄 단위로 맞댄다 — 접두 `L.` 말고 다른 줄 0 · 접두 수 = 생성기 바꿔 쓰기 수. 서버 주소·공개 키 선언 두 줄은 옮기지 않았다 — index.html 에 바이트 그대로 있고 세포 파일에는 없다.
//     index.html 은 「기준에서 구역 줄을 빼고 부르는 줄·머리 가져오기 줄·script 태그를 넣은 것」과 줄 단위로 같다(되짚기).
//  ② 시점: 시점 탐침(order-probe.cjs — 정의·노출·window 대입 사건의 순서)이 기준과 글자 그대로 같다. 가짜 연결 라이브러리 방식도 같다.
//  ③ 값: 손잡이 탐침(handle-probe.cjs) · 상태 탐침(상태 기관이 맡은 이름 전부) · 등록 기관 대조 탐침 지문.
//  ④ 화면·시험: 시나리오(기준 2회 · 작업 1회) · 모듈 로드 · npm test · 시험 하나씩 · 지표 · 모듈 가드 · 무결성 게이트.
//  ⑤ 남은 것: finalize 전제까지 남은 문을 종류별로(finalize-gap.json).
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-676/tools/measure-676.cjs <작업 트리> <기준 트리>
//   먼저: reports/TASK-ES-676/raw/npm-test.{base,work}.{log,exit} · tests-{base,work}.json(reports/TASK-ES-614/run-tests-each.cjs) · region-meta.json(생성기 메타) · scenarios/*.json
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const WORK = path.resolve(process.argv[2] || '.'), BASE = path.resolve(process.argv[3]);
const TASK = 'TASK-ES-676', REL = 'reports/' + TASK + '/', DIR = path.join(WORK, 'reports', TASK), TYPE = '작업자 측정, 판정 아님';
const rj = f => JSON.parse(fs.readFileSync(path.isAbsolute(f) ? f : path.join(DIR, f), 'utf8'));
const wj = (f, o) => fs.writeFileSync(path.join(DIR, f), JSON.stringify(o, null, 1) + '\n', { encoding: 'utf8' });
const git = (d, a) => cp.execFileSync('git', a, { cwd: d, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }).trim();
const node = (cwd, args, env) => cp.spawnSync(process.execPath, args, { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env: Object.assign({}, process.env, env || {}) });
const must = (r, what) => { if (r.status !== 0) throw new Error(what + ' 실패: ' + ((r.stderr || '') + (r.stdout || '')).slice(0, 400)); return r; };
const LF = s => s.replace(/\r\n/g, '\n');
const meta = rj('region-meta.json'), proof = rj('proof.json');
const stripL = l => l.replace(/(^|[^\w$.])L\.(?=[A-Za-z_$])/g, '$1');
const cellBody = text => { const ls = text.split('\n'), out = {}; let cur = null; for (const l of ls) { const m = l.match(/^  function (\w+)\(\) \{ \/\* \[#/); if (m) { cur = m[1]; out[cur] = []; continue; } if (cur && new RegExp('^  \\} /\\* ' + cur + ' \\*/$').test(l)) { cur = null; continue; } if (cur) out[cur].push(l); } return out; };

// ── ① 글자
const before = LF(fs.readFileSync(path.join(BASE, 'index.html'), 'utf8')), after = LF(fs.readFileSync(path.join(WORK, 'index.html'), 'utf8')), bl = before.split('\n'), al = after.split('\n');
const cellFiles = Object.keys(meta.files), cells = Object.fromEntries(cellFiles.map(f => [f, LF(fs.readFileSync(path.join(WORK, f), 'utf8'))]));
const KEYLINE = /^\s*var SUPABASE_(URL|ANON_KEY) = /;
const segs = meta.regions.map(g => { const lines = bl.slice(g.segment[0] - 1, g.segment[1]), got = (cellBody(cells[g.file])[g.name] || []);
  const row = { region: g.name, file: g.file, baseLines: g.segment, lines: lines.length, statements: g.statements.length, identical: 0, prefixOnly: 0, otherDiff: [], strippedPrefixes: 0, generatorEdits: g.edits, locals: g.locals, headersMoved: g.headersMoved, keyLines: 0, keyLinesIdentical: 0 };
  if (lines.length !== got.length) { row.otherDiff.push({ why: '줄 수가 다르다', base: lines.length, cell: got.length }); return row; }
  lines.forEach((l, i) => { const c = got[i], st = stripL(c); if (c === l) row.identical++; else if (st === l) { row.prefixOnly++; row.strippedPrefixes += (c.length - l.length) / 2; } else row.otherDiff.push({ line: g.segment[0] + i, base: l.slice(0, 160), cell: c.slice(0, 160) });
    if (KEYLINE.test(l)) { row.keyLines++; if (Buffer.from(c, 'utf8').equals(Buffer.from(l, 'utf8'))) row.keyLinesIdentical++; } });
  return row; });
const sum = f => segs.reduce((a, s) => a + f(s), 0);
const words = { type: TYPE, tool: REL + 'tools/measure-676.cjs', segments: segs,
  totals: { regions: segs.length, statements: sum(s => s.statements), lines: sum(s => s.lines), identical: sum(s => s.identical), prefixOnly: sum(s => s.prefixOnly), otherDiffLines: sum(s => s.otherDiff.length), strippedPrefixes: sum(s => s.strippedPrefixes), generatorEdits: meta.edits },
  serverKeyLines: (() => { const inBase = bl.filter(l => KEYLINE.test(l)), inWork = al.filter(l => KEYLINE.test(l)); return { movedLines: sum(s => s.keyLines), inBaseIndex: inBase.length, inWorkIndex: inWork.length, workIndexByteIdenticalToBase: inBase.length === inWork.length && inBase.every((l, i) => Buffer.from(l, 'utf8').equals(Buffer.from(inWork[i], 'utf8'))), cellFilesMentioningTheNames: cellFiles.filter(f => /SUPABASE_(URL|ANON_KEY)/.test(cells[f])).length,
    note: '서버 주소·공개 키 선언 두 줄(값 글자는 이 파일에 적지 않는다): 옮긴 줄 가운데 수 · 기준과 작업 index.html 에 있는 수 · 작업의 그 줄이 기준 줄과 바이트로 같은가 · 새 세포 파일 가운데 그 이름이 나오는 파일 수' }; })() };
words.ok = words.totals.otherDiffLines === 0 && words.totals.strippedPrefixes === meta.edits && words.serverKeyLines.movedLines === 0 && words.serverKeyLines.inWorkIndex === 2 && words.serverKeyLines.workIndexByteIdenticalToBase === true && words.serverKeyLines.cellFilesMentioningTheNames === 0;
// 되짚기: 기준 줄에서 구역 줄을 빼고 그 자리에 부르는 줄 하나, 머리 자리에 가져오기 줄, script 태그 줄을 바꾼 것이 작업 index.html 과 같은가
const segAt = new Map(meta.regions.map(g => [g.segment[0], g])), inSeg = n => meta.regions.some(g => n >= g.segment[0] && n <= g.segment[1]);
const callLine = g => '  ' + g.name + '(); /* [#' + TASK + '] 로드 중 구역(주석·빈 줄 포함 ' + g.lines + '줄) → ' + g.file + ' 의 ' + g.name + ' 로 옮김 — 원래 자리에서 부른다 */';
const headStart = meta.head.insertAfterLine, tagLines = new Set(meta.tags.map(t => t.line));
const rebuilt = [], replayNotes = { tagLinesChanged: 0, headLinesInserted: 0, callLines: 0, removedLines: 0 };
// 머리 줄과 태그 줄은 작업 파일에서 읽어 「꼴」만 본다(가져오기 줄 = `  var <이름> = <kitVar>.<이름>;` · 머리 주석 한 줄 · 태그 줄 = 기준 줄에 새 script 태그 글자만 끼운 것)
const headWork = al.slice(headStart, headStart + meta.head.lines);
const kitVarOf = Object.fromEntries(proof.cells.map(c => [c.key, c.kitVar]));
const headExpected = meta.imports.map(i => '  var ' + i.n + ' = ' + kitVarOf[i.cell] + '.' + i.n + ';');
const headImportLines = headWork.filter(l => /^\s*var /.test(l)), headOtherLines = headWork.filter(l => !/^\s*var /.test(l));
bl.forEach((t, k) => { const n = k + 1;
  if (tagLines.has(n)) { rebuilt.push(al[rebuilt.length]); replayNotes.tagLinesChanged++; return; } // 태그 줄은 작업 줄을 쓰고, 아래 tagLineIsBasePlusNewTags 가 「새 태그 글자만 끼웠는가」를 따로 본다
  if (segAt.has(n)) { rebuilt.push(callLine(segAt.get(n))); replayNotes.callLines++; }
  if (inSeg(n)) { replayNotes.removedLines++; return; }
  rebuilt.push(t);
  if (n === headStart) { for (const h of headWork) rebuilt.push(h); replayNotes.headLinesInserted += headWork.length; } });
const tagCheck = meta.tags.map(tg => { const b = bl[tg.line - 1], a = al[tg.line - 1], tag = '<script src="' + tg.file + '"></script>'; return { file: tg.file, line: tg.line, workHasTag: a.includes(tag), baseHasTag: b.includes(tag) }; });
const tagLineOk = [...tagLines].every(n => { let a = al[n - 1]; for (const tg of meta.tags.filter(q => q.line === n)) a = a.split('<script src="' + tg.file + '"></script>').join(''); return a === bl[n - 1]; });
const replay = { rebuiltEqualsWork: rebuilt.length === al.length && rebuilt.every((t, i) => t === al[i]), baseLines: bl.length, workLines: al.length, notes: replayNotes,
  firstDiff: (() => { for (let i = 0; i < Math.max(rebuilt.length, al.length); i++) if (rebuilt[i] !== al[i]) return { line: i + 1, rebuilt: (rebuilt[i] || '').slice(0, 140), work: (al[i] || '').slice(0, 140) }; return null; })(),
  headImportsEqualExpected: JSON.stringify(headImportLines) === JSON.stringify(headExpected), headOtherLines: headOtherLines.length, headOtherLinesAreComments: headOtherLines.every(l => /^\s*\/\*.*\*\/\s*$/.test(l)),
  tagLineIsBasePlusNewTags: tagLineOk, tags: tagCheck,
  note: '기준 index.html 에서 구역 줄(생성기 기록의 segment)을 빼고 그 첫 줄 자리에 부르는 줄 하나를, 머리 이음매 자리 뒤에 머리 줄(주석 1 + 가져오기 줄)을 넣고, script 태그 줄은 작업 줄을 쓴 것 == 작업 index.html. 가져오기 줄은 설정의 이름·키트 변수로 만든 글자와 같고, 태그 줄에서 새 script 태그 글자를 빼면 기준 줄과 같다' };
wj('prefix-only-check.json', Object.assign({}, words, { replay }));

// ── ② 시점
const op = path.join(DIR, 'tools', 'order-probe.cjs');
for (const [tree, out, fake] of [[BASE, 'order-probe.base.json'], [BASE, 'order-probe.base2.json'], [WORK, 'order-probe.work.json'], [BASE, 'order-probe-fake.base.json', 1], [WORK, 'order-probe-fake.work.json', 1]]) must(node(WORK, [op, tree, path.join(DIR, out)].concat(fake ? ['--fake-client'] : [])), '시점 탐침 ' + out);
const oB = rj('order-probe.base.json'), oB2 = rj('order-probe.base2.json'), oW = rj('order-probe.work.json'), ofB = rj('order-probe-fake.base.json'), ofW = rj('order-probe-fake.work.json');
const evSame = (a, b) => JSON.stringify(a.result.events) === JSON.stringify(b.result.events) && JSON.stringify(a.result.scopeNamesAt) === JSON.stringify(b.result.scopeNamesAt);
// 생성기가 통로 getter 를 다시 달면(meta.exposed — 구역 본문이 통로로 읽는 이름인데 index.html 에 getter 가 없을 때) 머리 자리에 expose 문 하나가 생긴다.
// 작업 쪽 사건 줄에서 그 사건(`E:index.html:<이름 수>`) 하나를 빼면 기준과 글자 그대로 같아지는 자리를 찾는다. 없으면(다른 차이가 있으면) 거짓.
const GETTER_EVENT = 'E:index.html:' + meta.exposed.length;
const alignExtra = (a, b) => { if (!meta.exposed.length) return { same: evSame(a, b), extraEvents: 0 }; const be = JSON.stringify(a.result.events), bc = JSON.stringify(a.result.scopeNamesAt), we = b.result.events, wc = b.result.scopeNamesAt;
  for (let i = 0; i < we.length; i++) { if (we[i] !== GETTER_EVENT) continue; if (JSON.stringify(we.slice(0, i).concat(we.slice(i + 1))) === be && JSON.stringify(wc.slice(0, i).concat(wc.slice(i + 1))) === bc) return { same: true, extraEvents: 1, event: GETTER_EVENT, names: meta.exposed, index: i, scopeNamesBefore: wc[i], scopeNamesAfter: wc[i + 1], scopeNamesUnchanged: wc[i] === wc[i + 1] }; }
  return { same: false, extraEvents: we.length - a.result.events.length }; };
const order = { total: [oB.result.total, oW.result.total], defines: [oB.result.defines.length, oW.result.defines.length], baseRepeatSame: evSame(oB, oB2), sameAsBase: evSame(oB, oW), sameAsBaseExceptNewGetterExpose: alignExtra(oB, oW).same, newGetterExpose: alignExtra(oB, oW), windowSets: { base: oB.result.windowSets, work: oW.result.windowSets }, indexOf: { base: oB.result.indexOf, work: oW.result.indexOf },
  exceptions: [oB.boot.exceptions.length, oW.boot.exceptions.length], spyErrors: [oB.result.errors.length, oW.result.errors.length],
  fake: { sameAsBase: evSame(ofB, ofW), sameAsBaseExceptNewGetterExpose: alignExtra(ofB, ofW).same, total: [ofB.result.total, ofW.result.total], base: ofB.result.fake, work: ofW.result.fake, createClientIndex: [ofB.result.indexOf.createClient, ofW.result.indexOf.createClient], defineSbIndex: [ofB.result.indexOf.sb, ofW.result.indexOf.sb] },
  note: '부팅 동안의 사건(상태 기관 정의 · 통로 노출 · window 대입 · 가짜 연결 만들기)을 일어난 차례로 적은 줄과, 사건마다 그 순간 통로에 달려 있던 이름 수가 기준과 작업에서 글자 그대로 같은가' };

// ── ③ 값
const hp = path.join(DIR, 'tools', 'handle-probe.cjs');
for (const [tree, out, fake] of [[BASE, 'handle-probe.base.json'], [BASE, 'handle-probe.base2.json'], [WORK, 'handle-probe.work.json'], [BASE, 'handle-probe-fake.base.json', 1], [WORK, 'handle-probe-fake.work.json', 1]]) must(node(WORK, [hp, tree, path.join(DIR, out)].concat(fake ? ['--fake-client'] : [])), '손잡이 탐침 ' + out);
const hB = rj('handle-probe.base.json'), hB2 = rj('handle-probe.base2.json'), hW = rj('handle-probe.work.json'), kB = rj('handle-probe-fake.base.json'), kW = rj('handle-probe-fake.work.json');
const same = (a, b) => !!a.result && !!b.result && JSON.stringify(a.result) === JSON.stringify(b.result);
const sc0 = (hW.result || {}).shareContent || {}, fk = (((kW.result || {}).sb) || {}).fake || null;
const handles = { baseRepeatSame: same(hB, hB2), sameAsBase: same(hB, hW), exceptions: [hB.boot.exceptions.length, hW.boot.exceptions.length], exceptionsSameText: JSON.stringify(hB.boot.exceptions) === JSON.stringify(hW.boot.exceptions),
  sb: { accessor: [hB.result.sb.accessor, hW.result.sb.accessor], owner: [hB.result.sb.owner, hW.result.sb.owner], valueKind: [hB.result.sb.valueKind, hW.result.sb.valueKind], partInitGotScopeSb: [hB.result.sb.partInitGotScopeSb, hW.result.sb.partInitGotScopeSb], strictWrite: hW.result.sb.write },
  fakeClient: { sameAsBase: same(kB, kW), work: fk, workOneCreateCallSameObjectEverywhere: !!fk && fk.createCalls.length === 1 && fk.scopeIsFakeClient === true && fk.windowIsFakeClient === true && fk.partInitGotFakeClient === true },
  shareContent: { nameAtAssign: [hB.result.shareContent.nameSeenAtAssign, sc0.nameSeenAtAssign], sourceHash: [hB.result.shareContent.sourceHash, sc0.sourceHash], windowSame: [hB.result.shareContent.windowSame, sc0.windowSame], forwardSame: JSON.stringify(hB.result.shareContent.forward) === JSON.stringify(sc0.forward), nameReads: [hB.result.shareContent.nameReadsAfterCalls, sc0.nameReadsAfterCalls] },
  MOCK_GROUPS: { work: hW.result.MOCK_GROUPS, same: JSON.stringify(hB.result.MOCK_GROUPS) === JSON.stringify(hW.result.MOCK_GROUPS) },
  note: '손잡이 탐침(#TASK-ES-673 의 것을 그대로 본뜸 — 서버 연결 객체 · 공유 함수 · 모임 목록 · 닫기 단추 · 템플릿 하위 탭 넷 · 피드 캐시)의 기록이 기준과 작업에서 통째로 같은가. 이번에는 주인 표시·기관 종류·함수 이름도 그대로여야 한다(가리지 않고 맞댄다)' };
// 상태 탐침: 상태 기관이 맡은 이름 전부 + 인라인에 남은 상태 이름 + 이번에 옮긴 window 손잡이
const probe = path.join(WORK, 'reports', 'TASK-ES-636', 'state-probe.cjs');
const tmpNames = path.join(os.tmpdir(), 'es676-names-' + process.pid + '.json'); fs.writeFileSync(tmpNames, JSON.stringify({ names: ['sb'] }), { encoding: 'utf8' });
const tmpOut = path.join(os.tmpdir(), 'es676-probe0-' + process.pid + '.json'); must(node(WORK, [probe, BASE, tmpOut, '--names', tmpNames]), '상태 탐침(이름 뽑기)');
const NAMES = (rj(tmpOut).organNames || []).concat(['state', '_promptEncyclopediaOpen', 'saveGoogleToken', 'daysFromNow']).filter((n, i, a) => a.indexOf(n) === i);
try { fs.unlinkSync(tmpNames); fs.unlinkSync(tmpOut); } catch (_) { /* 임시 파일 정리 실패는 결과에 영향 없음 */ }
wj('probe-names.json', { note: '상태 탐침에 넣는 이름 — 기준 트리에서 상태 기관이 맡은 이름 전부 + 인라인에 남은 상태 이름 둘 + 구역 본문이 통로로 읽는 이름 둘(saveGoogleToken · daysFromNow)', names: NAMES });
for (const [tree, out] of [[BASE, 'state-probe.base.json'], [BASE, 'state-probe.base2.json'], [WORK, 'state-probe.work.json']]) must(node(WORK, [probe, tree, path.join(DIR, out), '--names', path.join(DIR, 'probe-names.json')]), '상태 탐침 ' + out);
const pB = rj('state-probe.base.json'), pB2 = rj('state-probe.base2.json'), pW = rj('state-probe.work.json');
const FIELDS = ['accessor', 'owner', 'value', 'onWindow', 'windowValue', 'windowSame', 'organKind', 'writeRoundtrip', 'restored', 'error'];
const pdiff = (x, y) => Object.keys(x.names || {}).filter(n => FIELDS.some(f => JSON.stringify(x.names[n][f]) !== JSON.stringify(((y.names || {})[n] || {})[f])));
const intrinsic = pdiff(pB, pB2), differing = pdiff(pB, pW).filter(n => !intrinsic.includes(n));
const stateProbe = { names: NAMES.length, intrinsicVariance: intrinsic, differing, differingRegrownGetter: differing.filter(n => meta.exposed.includes(n)), differingBeyondRegrownGetter: differing.filter(n => !meta.exposed.includes(n)), regrownDetail: differing.filter(n => meta.exposed.includes(n)).map(n => ({ name: n, base: pB.names[n], work: pW.names[n] })), organNames: [(pB.organNames || []).length, (pW.organNames || []).length], organNamesSame: JSON.stringify(pB.organNames) === JSON.stringify(pW.organNames), exceptions: [pB.guestBoot.exceptions.length, pW.guestBoot.exceptions.length],
  writable: [pB, pW].map(p => { const v = Object.values(p.names || {}).filter(x => x.accessor === 'get+set'); return { names: v.length, roundtripOk: v.filter(x => x.writeRoundtrip === true && x.restored === true).length }; }),
  windowCopy: [pB, pW].map(p => { const v = Object.values(p.names || {}).filter(x => x.onWindow); return { onWindow: v.length, same: v.filter(x => x.windowSame === true).length }; }) };
// 등록 기관 대조 탐침
const cmp = path.join(WORK, 'scripts', 'probes', 'cell-registry-compare.js');
must(node(WORK, [cmp, BASE, path.join(DIR, 'cell-registry-compare.base.json'), '--fingerprints']), '대조 탐침(기준)');
must(node(WORK, [cmp, WORK, path.join(DIR, 'cell-registry-compare.json'), '--fingerprints', '--names-from', path.join(DIR, 'cell-registry-compare.base.json')]), '대조 탐침(작업)');
const cb = rj('cell-registry-compare.base.json'), cw = rj('cell-registry-compare.json');
const fp = {}; for (const k of ['scope', 'window']) { const fb = cb.fingerprints[k], fw = cw.fingerprints[k], ns = Object.keys(fb); fp[k] = { names: ns.length, diff: ns.filter(n => JSON.stringify(fb[n]) !== JSON.stringify(fw[n]) && !intrinsic.includes(n)) }; }

// ── ④ 화면·시험
const scn = fs.readdirSync(path.join(DIR, 'scenarios')).filter(f => f.endsWith('.json')).sort().map(f => path.join(DIR, 'scenarios', f));
must(node(WORK, [path.join(WORK, 'reports', 'TASK-ES-659', 'tools', 'scenario-local.cjs'), BASE, WORK, path.join(DIR, 'scenario-local.json')].concat(scn)), '시나리오 실행');
const sc = rj('scenario-local.json');
const ml = require(path.join(WORK, 'court', 'probes', 'module-load.js'));
const mlc = ml.compare(ml.probeModules(BASE), ml.probeModules(WORK), after);
const one = {}; for (const f of cellFiles) { try { one[f] = ml.loadOne(path.join(WORK, f)); } catch (e) { one[f] = { threw: String(e && e.message || e) }; } }
wj('module-load.json', { tool: 'court/probes/module-load.js (읽기 전용)', type: TYPE, regressions: mlc.regressions, insufficient: mlc.insufficient, counts: mlc.counts, newFilesLoadOne: one });
function readLog(label) { const T = LF(fs.readFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.log'), 'utf8')).split('\n'), exit = Number((/exit=(\d+)/.exec(fs.readFileSync(path.join(DIR, 'raw', 'npm-test.' + label + '.exit'), 'utf8')) || [])[1]);
  const norm = s => s.trim().replace(/\d+(\.\d+)?\s?ms\b/g, 'Nms').replace(/[A-Za-z]:[\\/][^\s"')]+/g, '<path>');
  return { exit, ok: T.filter(l => /^\s*✓ /.test(l)).length, okDot: T.filter(l => /^\s*ok · /.test(l)).length, fail: T.filter(l => /^\s*(✗|✖|not ok|FAIL\b)/.test(l)).length, summary: T.filter(l => /(\d+개 통과|검증 결과|ALL PASS|COMPLETE|\[검증 \d+\/\d+\])/.test(l)).map(norm), checks: T.filter(l => /^\s*(✓ |ok · )/.test(l)).map(norm) }; }
const nb = readLog('base'), nw = readLog('work'), ms = a => { const m = {}; a.forEach(x => { m[x] = (m[x] || 0) + 1; }); return m; }, mb0 = ms(nb.checks), mw0 = ms(nw.checks);
const onlyBase = Object.keys(mb0).filter(k => (mw0[k] || 0) < mb0[k]), onlyWork = Object.keys(mw0).filter(k => (mb0[k] || 0) < mw0[k]);
const npm = { base: { exit: nb.exit, ok: nb.ok, okDot: nb.okDot, fail: nb.fail }, work: { exit: nw.exit, ok: nw.ok, okDot: nw.okDot, fail: nw.fail }, sameSummary: JSON.stringify(nb.summary) === JSON.stringify(nw.summary), onlyBase, onlyWork };
npm.same = npm.sameSummary && nb.exit === 0 && nw.exit === 0 && nb.ok === nw.ok && nb.okDot === nw.okDot && nb.fail === 0 && nw.fail === 0;
// 검사 줄 차이는 모듈 수를 찍는 줄(세포가 둘 늘어 숫자가 달라지는 줄)일 수 있다 — 숫자를 가리고 다시 맞댄다
const numless = s => s.replace(/\d+/g, 'N'); const mbN = ms(nb.checks.map(numless)), mwN = ms(nw.checks.map(numless));
npm.onlyBaseIgnoringNumbers = Object.keys(mbN).filter(k => (mwN[k] || 0) < mbN[k]); npm.onlyWorkIgnoringNumbers = Object.keys(mwN).filter(k => (mbN[k] || 0) < mwN[k]);
wj('npm-test-compare.json', npm);
const tB = rj('tests-base.json'), tW = rj('tests-work.json');
const fset = t => new Set(t.testFiles.filter(x => x.exit !== 0).map(x => x.file)), fB = fset(tB), fW = fset(tW), tail = (t, f) => (t.testFiles.find(x => x.file === f) || {}).tail || null;
const scripts = tW.scripts.map(s => { const b = tB.scripts.find(x => x.script === s.script) || {}; return { script: s.script, exit: [b.exit, s.exit], ok: [b.ok, s.ok], okDot: [b.okDot, s.okDot], fails: [(b.fails || []).length, (s.fails || []).length] }; });
const testsEach = { testFiles: [tB.testFiles.length, tW.testFiles.length], failed: [fB.size, fW.size], onlyWork: [...fW].filter(x => !fB.has(x)), onlyBase: [...fB].filter(x => !fW.has(x)), sameFailTails: [...fW].filter(x => fB.has(x)).every(x => tail(tW, x) === tail(tB, x)), scripts, scriptsSame: scripts.every(x => x.exit[0] === x.exit[1] && x.ok[0] === x.ok[1] && x.okDot[0] === x.okDot[1] && x.fails[0] === x.fails[1]) };
testsEach.sameAsBase = testsEach.scriptsSame && !testsEach.onlyWork.length && !testsEach.onlyBase.length && testsEach.sameFailTails;
const metrics = d => require(path.join(d, 'scripts', 'module-metrics.js')).measure(d).ratchet;
const mB = metrics(BASE), mW = metrics(WORK), guard = node(WORK, ['scripts/module-guard.js', '--quiet']), gate = node(WORK, ['scripts/verify-integrity-gate.js']);
const baseline = JSON.parse(fs.readFileSync(path.join(WORK, 'docs', 'architecture', 'module-baseline.json'), 'utf8')), baselineB = JSON.parse(fs.readFileSync(path.join(BASE, 'docs', 'architecture', 'module-baseline.json'), 'utf8'));
const lastOf = j => j.history[j.history.length - 1].metrics.inlineScriptLines;
const baseHead = git(BASE, ['rev-parse', 'HEAD']);
const numstat = git(WORK, ['diff', '--numstat', baseHead, '--']).split('\n').filter(Boolean).map(l => { const [a, d, f] = l.split('\t'); return { file: f, insertions: Number(a), deletions: Number(d) }; });
const all = numstat.map(x => x.file).concat(git(WORK, ['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean)).filter((f, i, a) => a.indexOf(f) === i && !f.startsWith('.claude/'));
const vaultRe = /^(court\/|AGENTS\.md$|CLAUDE\.md$|GEMINI\.md$|01_OURGOAL_SUPREME_CONSTITUTION_FULL\.md$|\.agent\/rules\/|docs\/rules\/(OURGOAL_ABSOLUTE_INTEGRITY_RULES\.md|CONSTITUTION_VERSIONS\.md|ESSENCE_OURGOAL\.md|rules\.json|rules-control\.json|branch-protection.*\.json|archive\/)|\.github\/|\.githooks\/|scripts\/essence-gate\.js$|scripts\/install-essence-gate\.js$|scripts\/verify-integrity-gate\.js$|package\.json$)/;
const productRe = /^(js\/.*|index\.html|ui\.js|sw\.js|.*\.css)$/;
const changed = { productFiles: all.filter(f => productRe.test(f)).sort(), indexHtml: numstat.find(x => x.file === 'index.html') || null, testsChanged: all.filter(f => /^tests\//.test(f)), vaultChanged: all.filter(f => vaultRe.test(f)), generatorChanged: all.filter(f => /^docs\/design\/harness\/module-split\/.*\.js$/.test(f)), mapsChanged: all.filter(f => /(cell-map\.json|inline-script-map\.json|INLINE-SCRIPT-MAP\.md)$/.test(f)), organChanged: all.filter(f => ['js/core/app-state.js', 'js/core/app-scope.js', 'js/core/cell-registry.js'].includes(f)) };
changed.productFilesAreIndexAndNewCells = JSON.stringify(changed.productFiles) === JSON.stringify(['index.html'].concat(cellFiles).sort());

// ── ⑤ finalize 전제까지 남은 것
must(node(WORK, [path.join(DIR, 'tools', 'finalize-gap-676.cjs'), WORK, path.join(DIR, 'finalize-gap.json')]), 'finalize 전제 조사');
const gap = rj('finalize-gap.json');
must(node(WORK, [path.join(DIR, 'tools', 'finalize-gap-676.cjs'), BASE, path.join(DIR, 'finalize-gap.base.json')]), 'finalize 전제 조사(기준)');
const gapB = rj('finalize-gap.base.json'), kindRow = (g, k) => (g.byKind.find(x => x.kind === k) || { statements: 0, lines: 0 });
const gapCompare = ['handle', 'regionImport', 'regionCall', 'otherImport', 'expose', 'functionDecl', 'stateVar', 'define', 'ifStmt', 'windowAssign', 'otherCall', 'other'].map(k => ({ kind: k, label: (gap.byKind.concat(gapB.byKind).find(x => x.kind === k) || {}).label || k, statements: [kindRow(gapB, k).statements, kindRow(gap, k).statements], lines: [kindRow(gapB, k).lines, kindRow(gap, k).lines] })).filter(r => r.statements[0] || r.statements[1]);

const out = { schema: 'ourgoal.region-2.measurement/1', task: TASK, type: TYPE + ' — 판정은 GitHub 법정만 낸다', measuredAt: new Date().toISOString(), baseHead, config: REL + 'proof.json',
  generator: { regions: meta.regions.map(g => ({ name: g.name, file: g.file, segment: g.segment, lines: g.lines, statements: g.statements.length, locals: g.locals, edits: g.edits, headersMoved: g.headersMoved })), edits: meta.edits, bridged: meta.bridged.map(b => b.n), exposed: meta.exposed, imports: meta.imports.length, htmlLines: [meta.htmlLinesBefore, meta.htmlLinesAfter], files: meta.files },
  changed, prefixOnly: { ok: words.ok, totals: words.totals, serverKeyLines: words.serverKeyLines }, replay,
  order, handles, stateProbe,
  fingerprints: { scopeNames: fp.scope.names, scopeDiff: fp.scope.diff, windowNames: fp.window.names, windowDiff: fp.window.diff, scopeLost: cw.namesFrom.scopeLost, scopeAdded: cw.namesFrom.scopeAdded, mismatches: [cb.counts.mismatches, cw.counts.mismatches] },
  scenarios: { allPassedBoth: sc.allPassedBoth, rows: Object.keys(sc.scenarios).map(id => ({ id, base: sc.scenarios[id].runs.base.passed, base2: sc.scenarios[id].runs.base2.passed, work: sc.scenarios[id].runs.work.passed, exceptionsWork: (sc.scenarios[id].runs.work.exceptions || []).length })) },
  moduleLoad: { regressions: mlc.regressions.length, insufficient: mlc.insufficient.map(i => i.file + ': ' + i.note), newFilesLoadOneOk: Object.values(one).every(r => r && r.ok === true) },
  npmTest: npm, testsEach,
  metrics: { inlineScriptLines: [mB.inlineScriptLines, mW.inlineScriptLines], delta: mW.inlineScriptLines - mB.inlineScriptLines, indexFunctionDecls: [mB.indexFunctionDecls, mW.indexFunctionDecls], windowAssignments: [mB.windowAssignments, mW.windowAssignments], crossTabRefs: [mB.crossTabRefs, mW.crossTabRefs], oversizeJsFiles: [mB.oversizeJsFiles.count, mW.oversizeJsFiles.count] },
  baseline: { recordedBefore: lastOf(baselineB), recorded: lastOf(baseline), recordedEqualsMeasured: lastOf(baseline) === mW.inlineScriptLines, historyGrewBy: baseline.history.length - baselineB.history.length },
  moduleGuard: { exitCode: guard.status }, integrityGate: { exitCode: gate.status, result: ((gate.stdout || '').split('\n').find(l => /검증 결과/.test(l)) || '').trim() },
  finalizeGap: { generatorSays: gap.generator.message, blockingStatements: gap.totals.blockingStatements, blockingLines: gap.totals.blockingLines, allowedStatements: gap.totals.allowedStatements, before: gapB.totals, after: gap.totals, byKindBeforeAfter: gapCompare } };
out.ok = words.ok && replay.rebuiltEqualsWork && replay.headImportsEqualExpected && replay.tagLineIsBasePlusNewTags && order.baseRepeatSame && order.sameAsBaseExceptNewGetterExpose && order.fake.sameAsBaseExceptNewGetterExpose && handles.baseRepeatSame && handles.sameAsBase && handles.fakeClient.sameAsBase
  && stateProbe.differingBeyondRegrownGetter.length === 0 && stateProbe.organNamesSame && fp.scope.diff.length === 0 && fp.window.diff.length === 0 && cw.namesFrom.scopeLost.length === 0 && sc.allPassedBoth === true && mlc.regressions.length === 0 && out.moduleLoad.newFilesLoadOneOk
  && testsEach.sameAsBase && nw.exit === 0 && nb.exit === 0 && guard.status === 0 && gate.status === 0 && changed.testsChanged.length === 0 && changed.vaultChanged.length === 0 && changed.generatorChanged.length === 0 && changed.productFilesAreIndexAndNewCells;
wj('measurement.json', out);
console.log(JSON.stringify({ ok: out.ok, prefix: words.totals, key: words.serverKeyLines, replay: [replay.rebuiltEqualsWork, replay.firstDiff, replay.headImportsEqualExpected, replay.headOtherLines, replay.tagLineIsBasePlusNewTags, replay.notes], order: { total: order.total, repeat: order.baseRepeatSame, same: order.sameAsBase, sameExcept: order.sameAsBaseExceptNewGetterExpose, getter: order.newGetterExpose, fake: order.fake.sameAsBase, fakeExcept: order.fake.sameAsBaseExceptNewGetterExpose, win: order.windowSets.work, fakeIdx: [order.fake.createClientIndex, order.fake.defineSbIndex] }, handles: { repeat: handles.baseRepeatSame, same: handles.sameAsBase, fake: handles.fakeClient.sameAsBase, fakeOne: handles.fakeClient.workOneCreateCallSameObjectEverywhere, sb: handles.sb, share: handles.shareContent }, state: stateProbe, fp: [fp.scope.names, fp.scope.diff, fp.window.names, fp.window.diff, cw.namesFrom.scopeLost, cw.namesFrom.scopeAdded], sc: out.scenarios.rows.map(r => r.id + ':' + r.base + r.base2 + r.work + ':' + r.exceptionsWork), ml: out.moduleLoad, npm: [npm.base, npm.work, npm.same, npm.onlyBase.length, npm.onlyWork.length, npm.onlyBaseIgnoringNumbers, npm.onlyWorkIgnoringNumbers], each: { same: testsEach.sameAsBase, failed: testsEach.failed, onlyWork: testsEach.onlyWork, scripts: testsEach.scripts }, metrics: out.metrics, baseline: out.baseline, guard: guard.status, gate: out.integrityGate, changed, gap: out.finalizeGap }, null, 1));
