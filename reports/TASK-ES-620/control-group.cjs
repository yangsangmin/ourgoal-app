#!/usr/bin/env node
'use strict';
// #TASK-ES-620 대조군(작업자 측정, 판정 아님) — 넓힌 단언이 「등록」 갈래에서도 진짜로 재는지 본다.
// 고친 시험지를 얹은 모의 철거 사본(옛 배선 글자 없음)의 복사본에서, 한 세포의 등록을 일부러 깨뜨리고 그 이름의 단언만 실패로 바뀌는지 잰다.
//   V1 그 세포 파일의 등록 블록을 통째로 지움            → 그 세포가 등록한 이름의 단언만 실패해야 한다
//   V2 등록 블록의 window 목록에서 한 이름만 뺌(값은 남김) → 그 이름의 단언만 실패해야 한다
//   V3 index.html 에서 그 세포의 <script src> 태그를 뺌   → V1 과 같아야 한다(읽지 않는 세포의 등록은 등록이 아니다)
//   V4 그 세포가 키트에 그 이름을 다는 줄을 지움          → 그 이름의 단언만 실패해야 한다(정의 없는 등록)
//   V5 index.html 에서 commit 태그를 뺌                  → 넓힌 단언 전부가 실패해야 한다(기관이 내주지 않는다)
// 실패 단언은 soft-assert-preload.cjs 로 줄 단위로 모으고, 변형 전(같은 복사본) 결과와 맞대어 「새로 실패한 줄」만 본다.
// 사용: NODE_PATH=… node reports/TASK-ES-620/control-group.cjs <고친 시험지를 얹은 모의 철거 사본> <changed-assertions.json …> --out <out.json>
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const argv = process.argv.slice(2);
const SRC = path.resolve(argv[0]);
const OUT = path.resolve(argv[argv.indexOf('--out') + 1]);
const tables = argv.slice(1).filter((a, i, all) => !a.startsWith('--') && !(i > 0 && all[i - 1].startsWith('--'))).map(f => JSON.parse(fs.readFileSync(path.resolve(f), 'utf8')));
const PRELOAD = path.join(__dirname, 'soft-assert-preload.cjs');
const optv = (k, d) => (argv.indexOf(k) >= 0 ? argv[argv.indexOf(k) + 1] : d);
const CELL = optv('--cell', 'js/tabs/goals/attachments.js'), ONE = optv('--one', 'openAttachmentViewer'); // 깨뜨릴 세포 파일과, 한 이름만 깨뜨리는 변형(V2·V4)의 이름
const START = '/* ==== [세포 등록 시작 · gen-cell-provide.js]', END = '/* ==== [세포 등록 끝] ==== */';

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'es620-control-'));
fs.cpSync(SRC, scratch, { recursive: true, filter: s => !/[\\/](\.git|node_modules)([\\/]|$)/.test(s) && path.basename(s) !== '.git' });
const read = rel => fs.readFileSync(path.join(scratch, rel), 'utf8');
const write = (rel, s) => fs.writeFileSync(path.join(scratch, rel), s, { encoding: 'utf8' });

// 넓힌 단언 줄(파일 → 단언 줄 번호 → 이름들)
const rows = tables.flatMap(t => t.changed);
const lineNames = {};
for (const r of rows) { if (!r.assertion) continue; const k = r.file + ':' + r.assertion.line; (lineNames[k] = lineNames[k] || new Set()).add(r.name); }
const entries = [...new Set(rows.map(r => r.file))].sort();

function failing() {
  const set = new Map();
  for (const entry of entries) {
    const rec = path.join(os.tmpdir(), 'es620-control-' + process.pid + '-' + Math.random().toString(36).slice(2) + '.jsonl');
    const env = Object.assign({}, process.env, { ES620_SOFT_OUT: rec, ES620_SOFT_ROOT: scratch, NODE_OPTIONS: ((process.env.NODE_OPTIONS || '') + ' --require ' + JSON.stringify(PRELOAD.replace(/\\/g, '/'))).trim() });
    cp.spawnSync(process.execPath, [entry], { cwd: scratch, encoding: 'utf8', env, maxBuffer: 512 * 1024 * 1024, timeout: 600000 });
    let recs = [];
    try { recs = fs.readFileSync(rec, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch (e) { /* 기록 없음 */ }
    try { fs.unlinkSync(rec); } catch (e) { /* 무시 */ }
    for (const x of recs) if (x.kind === 'assert' && x.at) set.set(x.at.file + ':' + x.at.line, x.message);
  }
  return set;
}

const wiring = require(path.join(scratch, 'tests', 'helpers', 'wiring-exposed.js'));
const reg = wiring.registry();
const cellNames = Object.keys(reg.entries).filter(n => reg.entries[n].file === CELL);
const widenedNames = [...new Set(rows.map(r => r.name))].sort();
const cellWidened = widenedNames.filter(n => cellNames.includes(n));

const base = failing();
const out = { tool: 'reports/TASK-ES-620/control-group.cjs', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), node: process.version, source: SRC,
  legacyWiringInTree: rows.filter(r => r.legacyText && read('index.html').includes(r.legacyText.trim())).map(r => r.name),
  entries, cell: CELL, cellRegisteredNames: cellNames.sort(), widenedNames, widenedNamesOfCell: cellWidened, baselineFailingWidenedLines: [...base.keys()].filter(k => lineNames[k]), variants: [] };

function variant(id, what, mutate, expectNames) {
  const keep = { [CELL]: read(CELL), 'index.html': read('index.html') };
  const applied = mutate();
  const now = failing();
  for (const f of Object.keys(keep)) write(f, keep[f]);
  const fresh = [...now.keys()].filter(k => !base.has(k)).sort();
  const names = new Set(); const unmapped = [];
  for (const k of fresh) { if (lineNames[k]) lineNames[k].forEach(n => names.add(n)); else unmapped.push(k + ' ' + now.get(k)); }
  const got = [...names].sort(), exp = expectNames.slice().sort();
  // 그 이름을 재는 넓힌 단언 줄이 빠짐없이 실패했는가(이름 하나에 단언이 여러 줄일 수 있다)
  const expLines = Object.keys(lineNames).filter(k => [...lineNames[k]].some(n => exp.includes(n))).sort();
  const res = { id, what, mutationApplied: applied, newlyFailingLines: fresh.length, newlyFailingNames: got, expectedNames: exp, expectedLines: expLines.length,
    namesAsExpected: JSON.stringify(got) === JSON.stringify(exp), linesAsExpected: JSON.stringify(fresh) === JSON.stringify(expLines), unmappedNewFailures: unmapped };
  out.variants.push(res);
  console.log(id, '새로 실패한 줄', fresh.length, '/ 기대', expLines.length, '· 이름 일치', res.namesAsExpected, '· 줄 일치', res.linesAsExpected, '· 그 밖', unmapped.length);
}

variant('V1', CELL + ' 의 등록 블록을 통째로 지움', () => { const s = read(CELL), a = s.indexOf(START), b = s.indexOf(END, a); if (a < 0 || b < 0) return false; write(CELL, s.slice(0, a) + s.slice(b + END.length)); return true; }, cellWidened);
variant('V2', '등록 블록의 window 목록에서 ' + ONE + ' 만 뺌(값·windowOnly 는 남김)', () => {
  const s = read(CELL), a = s.indexOf(START), w = s.indexOf('window: [', a), z = s.indexOf(']', w);
  if (a < 0 || w < 0 || z < 0) return false;
  const items = s.slice(w + 'window: ['.length, z).split(',').map(x => x.trim()).filter(Boolean);
  if (!items.includes("'" + ONE + "'")) return false;
  write(CELL, s.slice(0, w) + 'window: [' + items.filter(x => x !== "'" + ONE + "'").join(', ') + s.slice(z));
  return true;
}, [ONE]);
variant('V3', 'index.html 에서 ' + CELL + ' 의 <script src> 태그를 뺌', () => { const h = read('index.html'), t = '<script src="' + CELL + '"></script>'; if (!h.includes(t)) return false; write('index.html', h.replace(t, '')); return true; }, cellWidened);
variant('V4', CELL + ' 가 키트에 ' + ONE + ' 를 다는 줄(K.' + ONE + ' = ' + ONE + ';)을 지움', () => { const s = read(CELL), t = 'K.' + ONE + ' = ' + ONE + ';'; if (!s.includes(t)) return false; write(CELL, s.replace(t, '')); return true; }, [ONE]);
variant('V5', 'index.html 에서 commit 태그(js/core/cell-registry-commit.js)를 뺌', () => { const h = read('index.html'), t = '<script src="js/core/cell-registry-commit.js"></script>'; if (!h.includes(t)) return false; write('index.html', h.replace(t, '')); return true; }, widenedNames);

out.summary = { variants: out.variants.length, allAsExpected: out.variants.every(v => v.mutationApplied && v.namesAsExpected && v.linesAsExpected && v.unmappedNewFailures.length === 0) };
try { fs.rmSync(scratch, { recursive: true, force: true }); } catch (e) { /* 임시 폴더 정리 실패는 무시 */ }
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log(JSON.stringify(out.summary));
