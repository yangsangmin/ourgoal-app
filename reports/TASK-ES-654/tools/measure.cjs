#!/usr/bin/env node
'use strict';
// TASK-ES-654 — 작업자 측정 요약(판정 아님). 손으로 옮긴 수치 0: 전부 git·적용 기록·npm test 원시 로그에서 센다.
//   node reports/TASK-ES-654/tools/measure.cjs --raw <npm test 원시 로그 폴더(저장소 밖)> --base <고치기 전 커밋>
// 원시 로그 폴더에는 npm-test.<이름>.log / .exit 쌍이 있다(base = 고치기 전 작업 폴더, work = 적용 뒤, 있으면 final = main 을 합친 뒤).
// 원시 로그는 커밋하지 않는다(로그 해시만 싣는다).
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const argv = process.argv.slice(2);
const opt = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const ROOT = path.resolve(path.join(__dirname, '..', '..', '..'));
const RAW = opt('--raw');
const BASE = opt('--base');
if (!RAW || !BASE) { process.stderr.write('사용: node measure.cjs --raw <원시 로그 폴더> --base <고치기 전 커밋>\n'); process.exit(2); }
const git = a => execFileSync('git', ['-C', ROOT].concat(a), { encoding: 'utf8' }).trim();

const KERNEL = '01_OURGOAL_SUPREME_CONSTITUTION_FULL.md';
const ARCHIVE = 'docs/rules/archive/AGENTS_KERNEL_v2026.10.11-ALIGNED.md';
const FILES = [KERNEL, 'docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md', 'docs/rules/CONSTITUTION_VERSIONS.md', 'docs/rules/TICKETS.md', 'AGENTS.md', 'CLAUDE.md', 'GEMINI.md'];

function npmLog(name) {
  const p = path.join(RAW, 'npm-test.' + name + '.log');
  if (!fs.existsSync(p)) return null;
  const s = fs.readFileSync(p, 'utf8');
  const gate = s.match(/총 (\d+)개 검사 중 (\d+)개 통과 \((\d+)개 실패\)/);
  const smoke = s.match(/(\d+)개 통과, (\d+)개 실패/);
  return {
    exitCode: Number(fs.readFileSync(path.join(RAW, 'npm-test.' + name + '.exit'), 'utf8').trim()),
    checkLines: (s.match(/✓/g) || []).length,
    failLines: (s.match(/✗|✖/g) || []).length,
    logLines: s.split('\n').length - 1,
    smokeTest: smoke ? { passed: Number(smoke[1]), failed: Number(smoke[2]) } : null,
    integrityGate: gate ? { total: Number(gate[1]), passed: Number(gate[2]), failed: Number(gate[3]) } : null,
    logSha256: crypto.createHash('sha256').update(s).digest('hex'),
  };
}
const run = n => { const r = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports/TASK-ES-654/raw/apply-run' + n + '.json'), 'utf8')); return { applied: r.steps.filter(s => s.status === 'applied').length, already: r.steps.filter(s => s.status === 'already').length, written: r.written.length }; };
const numstat = git(['diff', '--numstat', BASE, '--'].concat(FILES)).split('\n').filter(Boolean).map(l => { const [a, d, f] = l.split('\t'); return { file: f, added: Number(a), deleted: Number(d) }; });
const hunks = f => git(['diff', '-U0', BASE, '--', f]).split('\n').filter(l => l.startsWith('@@')).map(l => l.replace(/^(@@ [^@]+ @@).*$/, '$1'));
const baseKernelBlob = git(['rev-parse', BASE + ':' + KERNEL]);
const archiveBlob = git(['hash-object', ARCHIVE]);
const base = npmLog('base'), work = npmLog('work'), fin = npmLog('final');
// appendix 는 종료코드 1(불일치)이어도 JSON 을 낸다 — 그 JSON 을 그대로 읽는다.
function appendix(args) {
  let outText;
  try { outText = execFileSync('node', [path.join(ROOT, 'court', 'appendix.js')].concat(args), { encoding: 'utf8' }); }
  catch (e) { outText = e.stdout || ''; }
  try { return JSON.parse(outText); } catch (_) { return null; }
}
const versions = appendix(['--versions']);
const check = appendix(['--check', path.join(ROOT, 'docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md')]);
function selftest(name) {
  const p = path.join(RAW, 'selftest-unit.' + name + '.log');
  if (!fs.existsSync(p)) return null;
  const m = fs.readFileSync(p, 'utf8').match(/자가시험: 기대대로 (\d+)\/(\d+)/);
  return m ? { asExpected: Number(m[1]), total: Number(m[2]), scope: '--unit-only(일부만 실행)' } : null;
}
const prRun = n => { const p = path.join(ROOT, 'reports/TASK-ES-654/raw/apply-pr-run' + n + '.json'); if (!fs.existsSync(p)) return null; const r = JSON.parse(fs.readFileSync(p, 'utf8')); return { applied: r.steps.filter(s => s.status === 'applied').length, already: r.steps.filter(s => s.status === 'already').length, written: r.written.length }; };

const out = {
  task: 'TASK-ES-654',
  note: '작업자 측정이며 판정이 아니다. 원시 로그는 저장소 밖(작업 PC 임시 폴더)에 두고 여기에는 스크립트가 센 값과 로그 해시만 싣는다.',
  base: { commit: git(['rev-parse', BASE]), kernelBlob: baseKernelBlob },
  treeAtMeasure: { parentCommit: git(['rev-parse', 'HEAD']), uncommittedChanges: git(['status', '--porcelain', '--untracked-files=no']) !== '', note: 'uncommittedChanges 가 true 면 이 측정 파일과 PR 번호 기입을 커밋하기 직전의 작업 폴더에서 잰 것이다' },
  apply: { run1: run(1), run2: run(2), prNumberRun1: prRun(1), prNumberRun2: prRun(2) },
  appendix: {
    versions: versions ? { ok: versions.ok, version: versions.version, statuteCurrent: versions.statuteCurrent, ledgerLast: versions.ledgerLast, problems: versions.problems.length } : null,
    check: check ? { ok: check.ok, mismatches: check.mismatches.length } : null,
  },
  courtSelftestUnitOnly: selftest('final'),
  archive: { file: ARCHIVE, blob: archiveBlob, sameAsBaseKernelBlob: archiveBlob === baseKernelBlob },
  diffVsBase: numstat,
  kernelHunks: hunks(KERNEL),
  statuteHunks: hunks('docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md'),
  pointersChanged: numstat.filter(x => ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md'].includes(x.file)).length,
  npmTest: {
    command: 'npm test (NODE_PATH=C:/dev/ourgoal-app/node_modules, 전경)',
    labels: 'base = 고치기 전 작업 폴더(' + (opt('--npm-base') || '미기재') + ') · work = 같은 커밋에 적용만 한 뒤 · final = origin/main 을 합치고 PR 번호를 기입한 뒤',
    base, work, final: fin,
    baseAndWorkLogsIdentical: !!(base && work) && base.logSha256 === work.logSha256,
  },
};
fs.writeFileSync(path.join(ROOT, 'reports/TASK-ES-654/measurement.json'), JSON.stringify(out, null, 2) + '\n', { encoding: 'utf8' });
process.stdout.write(JSON.stringify(out, null, 2) + '\n');
