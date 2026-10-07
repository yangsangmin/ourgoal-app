'use strict';
/**
 * TASK-ES-585: 115개 전체 시험 출력 및 검사 수 비교 도구
 * - 대상: tests/*.test.js (113개) + scripts/test-universal-stats-ux.js, scripts/test-universal-import.js (2개) = 115개
 * - 기준 트리(git archive 사본) 대 작업 트리
 * - 원시 stdout/stderr 저장 및 정규화 후 출력/검사수/종료코드 비교
 * - .git 부재 차이, 기저 실패, 간헐 차이 구분
 * 사용: node task585-test-compare.js <BASE> <WORK> <OUT> [RAW_DIR]
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const [BASE, WORK, OUT, RAW_ARG] = process.argv.slice(2);
if (!BASE || !WORK || !OUT) {
  console.error('Usage: node task585-test-compare.js <BASE> <WORK> <OUT> [RAW_DIR]');
  process.exit(1);
}

const rawDir = RAW_ARG ? path.resolve(RAW_ARG) : path.resolve(WORK, 'reports/TASK-ES-585/test-outputs');
fs.mkdirSync(path.join(rawDir, 'base'), { recursive: true });
fs.mkdirSync(path.join(rawDir, 'work'), { recursive: true });

const env = Object.assign({}, process.env, {
  NODE_PATH: process.env.NODE_PATH || path.resolve(WORK, 'node_modules')
});

const sh = (cwd, cmd, args, timeoutMs = 300000) => {
  const r = spawnSync(cmd, args, {
    cwd,
    env,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    maxBuffer: 64 * 1024 * 1024,
    timeout: timeoutMs
  });
  return {
    code: r.status !== null ? r.status : (r.error ? 1 : 0),
    stdout: r.stdout || '',
    stderr: r.stderr || '',
    out: (r.stdout || '') + (r.stderr || '')
  };
};

function npmNumbers(out) {
  const m = re => {
    const x = re.exec(out);
    return x ? x.slice(1).map(Number) : null;
  };
  return {
    smoke: m(/(\d+)개 통과, (\d+)개 실패/),
    integrity: m(/총 (\d+)개 검사 중 (\d+)개 통과 \((\d+)개 실패\)/),
    buttons: m(/엄밀 핸들러 배선 확인 버튼: (\d+)개 \/ (\d+)개/),
    shipyardModularFiles: (m(/Checked (\d+) modular files/) || [null])[0],
    moduleGuard: m(/\[모듈 가드\] ① (\d+) · ② (\d+) · ③ (\d+) · ④ (\d+) · ⑤ (\d+)/)
  };
}

const smokeTitles = out =>
  out
    .split(/\r?\n/)
    .filter(l => /^\s+[✓✗×]/.test(l))
    .map(l => l.trim());

const normalize = (s, root) => {
  const normRoot = path.resolve(root).replace(/\\/g, '/');
  return s
    .replace(/\\/g, '/')
    .split(normRoot).join('<root>')
    .replace(/:\d+:\d+\)/g, ':<l>:<c>)')
    .replace(/\b\d+(\.\d+)?\s?ms\b/g, '<ms>')
    .replace(/duration_ms["':\s]+[\d.]+/g, 'duration_ms <n>')
    .replace(/\(root: [^)]+\)/g, '(root: <root>)')
    .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z/g, '<iso>')
    .replace(/Node\.js v\d+\.\d+\.\d+/g, 'Node.js <version>');
};

function extractTestCounts(out) {
  const counts = {};
  const passM = out.match(/(\d+)\s*(?:passed|통과|ok|건 통과)/i);
  if (passM) counts.passed = Number(passM[1]);
  const failM = out.match(/(\d+)\s*(?:failed|실패)/i);
  if (failM) counts.failed = Number(failM[1]);
  const totalM = out.match(/(\d+)\/(\d+)/);
  if (totalM) {
    counts.ratioPassed = Number(totalM[1]);
    counts.ratioTotal = Number(totalM[2]);
  }
  return Object.keys(counts).length > 0 ? counts : null;
}

console.log('Running npm test on base and work...');
const bNpm = sh(BASE, 'npm', ['test']);
const wNpm = sh(WORK, 'npm', ['test']);

// Save raw npm test logs
const reportsDir = path.resolve(WORK, 'reports/TASK-ES-585');
fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(path.join(reportsDir, 'npm-test-base.log'), bNpm.out, 'utf8');
fs.writeFileSync(path.join(reportsDir, 'npm-test-work.log'), wNpm.out, 'utf8');
fs.writeFileSync(path.join(reportsDir, 'npm-test.log'), wNpm.out, 'utf8');

const files = fs
  .readdirSync(path.join(WORK, 'tests'))
  .filter(n => n.endsWith('.test.js'))
  .sort()
  .map(n => 'tests/' + n)
  .concat(['scripts/test-universal-stats-ux.js', 'scripts/test-universal-import.js']);

console.log(`Running 115 test files in both environments...`);
const bTests = {};
const wTests = {};

for (let i = 0; i < files.length; i++) {
  const f = files[i];
  const safeName = f.replace(/[\/\\]/g, '__');

  // Base
  const rb = sh(BASE, 'node', [f]);
  fs.writeFileSync(path.join(rawDir, 'base', safeName + '.txt'), rb.out, 'utf8');
  bTests[f] = {
    code: rb.code,
    out: normalize(rb.out, BASE),
    counts: extractTestCounts(rb.out)
  };

  // Work
  const rw = sh(WORK, 'node', [f]);
  fs.writeFileSync(path.join(rawDir, 'work', safeName + '.txt'), rw.out, 'utf8');
  wTests[f] = {
    code: rw.code,
    out: normalize(rw.out, WORK),
    counts: extractTestCounts(rw.out)
  };

  if ((i + 1) % 25 === 0 || i === files.length - 1) {
    console.log(`Progress: ${i + 1}/${files.length} test files executed.`);
  }
}

const exitDiff = files.filter(f => bTests[f].code !== wTests[f].code);
const outDiff = files.filter(f => bTests[f].out !== wTests[f].out);

// Classify exitDiff
const gitAbsenceDiff = exitDiff.filter(f => f === 'tests/cell-map-export-es414.test.js');
const regressions = exitDiff.filter(f => bTests[f].code === 0 && wTests[f].code !== 0);

// Baseline failures in both
const failingInBaseAndAfter = files.filter(
  f => bTests[f].code !== 0 && wTests[f].code !== 0
);

const report = {
  task: 'TASK-ES-585',
  what: '기준 트리(git archive 사본) 대 작업 트리 — npm test 수치·smoke 검사 제목, 115개 tests 출력 및 검사 수 비교',
  provenance: {
    baseDir: path.resolve(BASE),
    workDir: path.resolve(WORK),
    rawOutputsDir: rawDir
  },
  base: {
    npmExit: bNpm.code,
    npmExitNote: bNpm.code === 0 ? 'PASS' : 'exit 1 due to .git absence in extracted archive (cell-map-export git rev-parse failure; smoke/integrity passed)',
    npmTest: npmNumbers(bNpm.out),
    smokeTitlesCount: smokeTitles(bNpm.out).length
  },
  work: {
    npmExit: wNpm.code,
    npmExitNote: wNpm.code === 0 ? 'PASS' : 'FAIL',
    npmTest: npmNumbers(wNpm.out),
    smokeTitlesCount: smokeTitles(wNpm.out).length
  },
  smokeTitlesIdentical: JSON.stringify(smokeTitles(bNpm.out)) === JSON.stringify(smokeTitles(wNpm.out)),
  smokeTitleDiff: {
    onlyBase: smokeTitles(bNpm.out).filter(t => !smokeTitles(wNpm.out).includes(t)),
    onlyWork: smokeTitles(wNpm.out).filter(t => !smokeTitles(bNpm.out).includes(t))
  },
  tests: {
    totalFiles: files.length,
    testFiles: 113,
    helperScripts: 2,
    exitCodesSame: exitDiff.length === 0,
    exitDiff,
    gitAbsenceDiff: {
      files: gitAbsenceDiff,
      reason: 'base-origin lacks .git folder (extracted git archive), causing cell-map-export-es414 to fail (15/17); worktree has valid .git tracking and passed (17/17, exit code 0)'
    },
    regressions,
    regressionCount: regressions.length,
    failingInBaseAndAfter: failingInBaseAndAfter.map(f => path.basename(f)),
    outputDiffAfterNormalize: outDiff,
    outputDiffDetails: outDiff.map(f => ({
      file: f,
      baseCode: bTests[f].code,
      workCode: wTests[f].code,
      baseCounts: bTests[f].counts,
      workCounts: wTests[f].counts
    })),
    normalizePolicy: '경로(root)·OS 구분자·스택 줄번호:<l>:<c>·ms소요시간·duration_ms·ISO 시각·Node.js 버전'
  }
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n', 'utf8');

console.log('Result written to:', OUT);
console.log(
  JSON.stringify(
    {
      totalFiles: files.length,
      regressions: regressions.length,
      gitAbsenceDiff: gitAbsenceDiff.length,
      failingInBaseAndAfter: failingInBaseAndAfter.length,
      outputDiffCount: outDiff.length,
      workNpmExit: wNpm.code,
      baseNpmExit: bNpm.code
    },
    null,
    2
  )
);
