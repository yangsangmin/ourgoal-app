#!/usr/bin/env node
'use strict';
// #TASK-ES-620 조사 도구(작업자 측정, 판정 아님) — 한 트리에서 「실패하는 단언」을 줄 단위로 전부 모은다.
//   대상: package.json scripts.test 의 스크립트 전부 + 그 밖의 scripts/test-*.js(법정 baseTests 글롭) + tests/ 아래 *.test.js 전부.
//   방법: soft-assert-preload.cjs 를 NODE_OPTIONS 로 미리 읽혀(자식 프로세스도 따라 읽는다) 단언이 실패해도 던지지 않고 기록만 하게 한 뒤 하나씩 돌린다.
//   주의: 여기의 종료 코드는 「던지지 않는 단언」으로 돈 값이라 증거가 아니다. 종료 코드·검사 수는 run-plain.cjs 로 따로 잰다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-620/run-asserts.cjs <트리> <out.json>
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const TREE = path.resolve(process.argv[2]), OUT = path.resolve(process.argv[3]);
const PRELOAD = path.join(__dirname, 'soft-assert-preload.cjs');
const pkg = JSON.parse(fs.readFileSync(path.join(TREE, 'package.json'), 'utf8'));
const npmScripts = pkg.scripts.test.split('&&').map(s => s.trim().replace(/^node\s+/, ''));
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const rel = f => path.relative(TREE, f).replace(/\\/g, '/');
const otherScripts = fs.readdirSync(path.join(TREE, 'scripts')).filter(n => /^test-.*\.js$/.test(n)).map(n => 'scripts/' + n).filter(s => !npmScripts.includes(s)).sort();
const testFiles = walk(path.join(TREE, 'tests')).filter(f => /\.test\.js$/.test(f)).map(rel).sort();
const srcCache = {};
const linesOf = f => { if (!srcCache[f]) { try { srcCache[f] = fs.readFileSync(path.join(TREE, f), 'utf8').split(/\r?\n/); } catch (e) { srcCache[f] = []; } } return srcCache[f]; };
const CHECK_TITLE_RE = /\bcheck\(\s*(['"`])((?:[^\\]|\\.)*?)\1/; // court/vault-check.js 와 같은 꼴(읽기만 했다)
function titleAt(file, line) { const L = linesOf(file); for (let i = Math.min(line, L.length) - 1; i >= 0; i--) { const m = CHECK_TITLE_RE.exec(L[i]); if (m) return m[2].trim(); } return null; }

function runOne(entry, group) {
  const rec = path.join(os.tmpdir(), 'es620-soft-' + process.pid + '-' + Math.random().toString(36).slice(2) + '.jsonl');
  const env = Object.assign({}, process.env, { ES620_SOFT_OUT: rec, ES620_SOFT_ROOT: TREE, NODE_OPTIONS: ((process.env.NODE_OPTIONS || '') + ' --require ' + JSON.stringify(PRELOAD.replace(/\\/g, '/'))).trim() });
  const r = cp.spawnSync(process.execPath, [entry], { cwd: TREE, encoding: 'utf8', env, maxBuffer: 512 * 1024 * 1024, timeout: 600000 });
  let rows = [];
  try { rows = fs.readFileSync(rec, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch (e) { /* 기록 없음 = 실패한 단언 없음 */ }
  try { fs.unlinkSync(rec); } catch (e) { /* 무시 */ }
  const seen = new Set(), fails = [], other = [];
  for (const x of rows) {
    if (x.kind !== 'assert') { other.push({ kind: x.kind, entry: x.entry, at: x.at ? x.at.file + ':' + x.at.line : null, message: x.message || null, code: x.code === undefined ? null : x.code }); continue; }
    const file = x.at ? x.at.file : null, line = x.at ? x.at.line : null;
    const key = file + ':' + line + ':' + x.message;
    if (seen.has(key)) continue; seen.add(key);
    fails.push({ file, line, check: file && /^scripts\/(smoke-test|verify-integrity-gate)\.js$/.test(file) ? titleAt(file, line) : null, message: x.message, fn: x.fn, src: file ? (linesOf(file)[line - 1] || '').trim().slice(0, 400) : null, ranBy: x.entry });
  }
  return { entry, group, softExit: r.status, timedOut: !!(r.error && r.error.code === 'ETIMEDOUT'), failedAsserts: fails, otherEnds: other };
}

const out = { tool: 'reports/TASK-ES-620/run-asserts.cjs', type: '작업자 측정, 판정 아님 — 던지지 않는 단언으로 돌린 단언 전수 조사(종료 코드는 증거 아님)', tree: TREE, measuredAt: new Date().toISOString(), node: process.version, entries: [] };
for (const s of npmScripts) out.entries.push(runOne(s, 'npm-test'));
for (const s of otherScripts) out.entries.push(runOne(s, 'scripts-test-other'));
for (const f of testFiles) out.entries.push(runOne(f, 'tests'));
// 줄 단위 합집합(같은 시험 파일이 npm test 경로와 단독 실행 양쪽에서 돌아도 한 번만 센다)
const uniq = new Map();
for (const e of out.entries) for (const f of e.failedAsserts) { const k = f.file + ':' + f.line + ':' + f.message; if (!uniq.has(k)) uniq.set(k, f); }
out.failedAssertsUnique = [...uniq.values()].sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : a.line - b.line));
out.summary = { entries: out.entries.length, npmScripts, otherScripts: otherScripts.length, testFiles: testFiles.length, failedAssertLines: out.failedAssertsUnique.length, entriesWithOtherEnds: out.entries.filter(e => e.otherEnds.length).map(e => e.entry) };
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log(JSON.stringify(out.summary));
