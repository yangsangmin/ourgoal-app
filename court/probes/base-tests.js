'use strict';
// 법정(court) — 기준 시험지 채점(L2 부품만 돌려 봄).
// "기준 커밋(base)의 시험지로 작업 커밋(head)의 제품을 채점한다."
//  - 작업자가 테스트 파일을 어떻게 고쳤든 판정에는 쓰지 않는다 → 있던 기준을 고쳐서 통과시키는 길이 구조적으로 막힌다.
//  - 테스트 파일 수정 자체는 막지 않는다 → 라벨 하나 바꿔도 글자 핀이 깨지는 이 저장소에서 정상 작업이 교착에 빠지지 않는다.
//  - 기준 커밋에서 통과하던 검사가 작업 커밋에서 깨지면, 주장 파일의 retire 에 사유가 적혀 있어야 한다. 말없이 깨지면 돌려보낸다.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function copyDir(src, dst) { fs.cpSync(src, dst, { recursive: true, force: true }); }

// head 제품 트리 위에 base 의 시험지만 덮어 쓴 폴더를 만든다.
function makeOverlay(headDir, baseDir, testFiles, destDir) {
  copyDir(headDir, destDir);
  for (const rel of testFiles) {
    const from = path.join(baseDir, rel), to = path.join(destDir, rel);
    if (!fs.existsSync(from)) continue;
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
  return destDir;
}

function parseTitles(output, runner) {
  const pass = new RegExp(runner.pass), fail = new RegExp(runner.fail);
  const passed = [], failed = [];
  for (const line of output.split(/\r?\n/)) {
    let m = fail.exec(line); if (m) { failed.push(m[1].trim()); continue; }
    m = pass.exec(line); if (m) passed.push(m[1].trim());
  }
  return { passed, failed };
}

// PR 의 제품 코드가 테스트 안에서 실행되므로 자식 프로세스 + 권한 제한(지정 폴더 밖 쓰기·프로세스 실행 금지)으로 돌린다.
function runOne(treeDir, runner, nodeModules, scratchTmp) {
  const script = path.join(treeDir, runner.file);
  if (!fs.existsSync(script)) return { ran: false, reason: runner.file + ' 없음' };
  const allowed = process.allowedNodeEnvironmentFlags;
  const perm = allowed.has('--permission') ? '--permission' : (allowed.has('--experimental-permission') ? '--experimental-permission' : null);
  const flags = [];
  if (perm) {
    flags.push(perm, '--allow-fs-read=' + treeDir, '--allow-fs-read=' + scratchTmp, '--allow-fs-write=' + scratchTmp);
    if (nodeModules) flags.push('--allow-fs-read=' + nodeModules);
  }
  const env = { PATH: process.env.PATH || '', TMPDIR: scratchTmp, TEMP: scratchTmp, TMP: scratchTmp, TZ: 'Asia/Seoul' };
  if (nodeModules) env.NODE_PATH = nodeModules;
  if (process.platform === 'win32') { env.SystemRoot = process.env.SystemRoot || ''; env.USERPROFILE = scratchTmp; }
  const r = spawnSync(process.execPath, [...flags, script], { cwd: treeDir, encoding: 'utf8', env, timeout: 180000, maxBuffer: 128 * 1024 * 1024 });
  if (r.error) return { ran: false, reason: String(r.error.message || r.error) };
  const t = parseTitles((r.stdout || '') + '\n' + (r.stderr || ''), runner);
  return { ran: true, exit: r.status, isolated: !!perm, passed: t.passed, failed: t.failed, tail: ((r.stderr || '') + (r.stdout || '')).slice(-400) };
}

// 깨진 검사가 "글자 핀"(코드·문서에 특정 글자가 있는지만 보는 검사)인지 "실행형"(제품 함수를 실제로 돌리는 검사)인지.
function classifyCheck(baseTestSource, title) {
  const i = baseTestSource.indexOf(title);
  if (i < 0) return 'unknown';
  const rest = baseTestSource.slice(i);
  const next = rest.slice(title.length).search(/\n\s*check\(/);
  const block = next < 0 ? rest.slice(0, 6000) : rest.slice(0, title.length + next);
  return /\bfns\.|extractFunction|require\(\s*['"]\.\.\/(api|js)\/|\bvm\.|new Function|runInContext|sandbox|deepStrictEqual|deepEqual/.test(block) ? 'exec' : 'text-pin';
}

function probeBaseTests(ctx) {
  const { baseDir, headDir, vault, nodeModules } = ctx;
  const out = { ran: false, runners: [], newlyBroken: [], toolErrors: [], insufficient: [] };
  const runners = (vault.baseTestRunners || []).filter(r => fs.existsSync(path.join(baseDir, r.file)));
  if (!runners.length) { out.insufficient.push('기준 커밋에 돌릴 시험지가 없다'); return out; }
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'court-basetests-'));
  const scratchTmp = path.join(work, 'tmp'); fs.mkdirSync(scratchTmp, { recursive: true });
  try {
    const testFiles = [];
    const scriptsDir = path.join(baseDir, 'scripts');
    const { matcher } = require('../vault-check');
    const isBaseTest = matcher(vault.baseTests);
    if (fs.existsSync(scriptsDir)) for (const n of fs.readdirSync(scriptsDir)) if (isBaseTest('scripts/' + n)) testFiles.push('scripts/' + n);
    const overlay = makeOverlay(headDir, baseDir, testFiles, path.join(work, 'overlay'));
    for (const runner of runners) {
      const onBase = runOne(baseDir, runner, nodeModules, scratchTmp);
      const onHead = runOne(overlay, runner, nodeModules, scratchTmp);
      if (!onBase.ran || !onHead.ran) { out.toolErrors.push('기준 시험지 ' + runner.file + ' 실행 실패: ' + (onBase.reason || onHead.reason)); continue; }
      if (onBase.passed.length + onBase.failed.length === 0) { out.toolErrors.push('기준 시험지 ' + runner.file + ' 가 기준 커밋에서 검사를 하나도 출력하지 않았다(의존성 없음으로 추정): ' + onBase.tail.replace(/\s+/g, ' ').slice(0, 200)); continue; }
      const okOnBase = new Set(onBase.passed);
      const src = fs.readFileSync(path.join(baseDir, runner.file), 'utf8');
      const broken = onHead.failed.filter(t => okOnBase.has(t));
      const vanished = onBase.passed.filter(t => !onHead.passed.includes(t) && !onHead.failed.includes(t));
      out.runners.push({ file: runner.file, isolated: onHead.isolated, base: { passed: onBase.passed.length, failed: onBase.failed.length }, head: { passed: onHead.passed.length, failed: onHead.failed.length }, vanished: vanished.length });
      for (const t of broken) out.newlyBroken.push({ file: runner.file, check: t, kind: classifyCheck(src, t) });
      if (vanished.length) out.toolErrors.push('기준 시험지 ' + runner.file + ' 가 작업 커밋에서 끝까지 돌지 못했다(검사 ' + vanished.length + '개가 출력되지 않음) — 제품 코드가 시험 실행 자체를 죽였을 수 있다: ' + onHead.tail.replace(/\s+/g, ' ').slice(0, 200));
      out.ran = true;
    }
  } catch (e) {
    out.toolErrors.push('기준 시험지 채점 중 오류: ' + String((e && e.message) || e));
  } finally {
    try { fs.rmSync(work, { recursive: true, force: true }); } catch (_) { /* 임시 폴더 정리 실패는 무시 */ }
  }
  return out;
}

module.exports = { probeBaseTests, makeOverlay, parseTitles, classifyCheck, runOne };
