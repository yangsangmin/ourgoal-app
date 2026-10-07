'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const claimsLib = require('../claims');
const judgeLib = require('../judge');
const chatLib = require('../chat');
const reportLib = require('../report');
const grade = require('../lib/grade');
const scenarioLib = require('../lib/scenario');
const preserveLib = require('../lib/preserve');

function tempDir(tag) { return fs.mkdtempSync(path.join(os.tmpdir(), 'court-unit-preserve-' + tag + '-')); }
function writeTree(dir, files) {
  for (const [rel, body] of Object.entries(files)) {
    const fp = path.join(dir, rel);
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, typeof body === 'string' ? body : JSON.stringify(body, null, 2), 'utf8');
  }
}

const TESTS = [
  {
    id: 'U-preserve-contracts',
    title: '동작 보존 계약: 상수가 전 모듈에 걸쳐 일치하고 기존 검증 경로와 결합된다',
    run(t) {
      t.eq(chatLib.BUCKET_PRESERVED, '동작 보존 확인', 'chat.BUCKET_PRESERVED 상수');
      t.eq(claimsLib.OUTCOME.PRESERVED, '보존됨', 'claims.OUTCOME.PRESERVED 상수');
      t.ok(claimsLib.CHANGES.includes('preserve'), 'claims.CHANGES 에 preserve 포함');
      t.ok(judgeLib.OK_BUCKETS.includes('동작 보존 확인'), 'judge.OK_BUCKETS 에 동작 보존 확인 포함');
      t.ok(judgeLib.REHEARD_OK.includes(claimsLib.OUTCOME.PRESERVED), 'judge.REHEARD_OK 에 보존됨 포함');
      t.ok(chatLib.cleared('b', '동작 보존 확인'), 'chat.cleared 가 동작 보존 확인을 인정');
    },
  },
  {
    id: 'U-preserve-judge-claim-truth',
    title: '동작 보존 심사 진리표: 양쪽 통과/실패, 흔들림, 공허 시나리오, 확인 못 함 처리가 올바르다',
    async run(t) {
      const dir = tempDir('judge-claim');
      const floors = grade.loadFloors();
      const config = scenarioLib.loadConfig();
      const steps = [{ do: 'goto', path: '/index.html' }, { do: 'click', selector: '#btn' }, { expect: 'visible', selector: '#result' }];
      writeTree(dir, { 'sc.json': { id: 'test-sc', title: '시험', steps }, 'proof.json': { proof: true, proofs: {} } });

      const baseClaim = { id: 'C1', req: 'R1', kind: 'behavior', change: 'preserve', domain: 'ui-behavior', statement: '보존', touches: ['js/app.js'], scenario: 'sc.json', proof: 'proof.json' };
      
      const mockRes = (passed, failedStep = null, failKind = 'expect', provesBehavior = true, ext = {}) => ({
        passed, failedStep, failKind: passed ? null : failKind, provesBehavior,
        states: [{ stepId: 1, dom: 'A', localStorage: '{}', sessionStorage: '{}', toast: 'D', errCount: 0, modal: 'E' }],
        steps: steps.map(s => ({ name: s.do || s.expect, detail: '' })),
        fixtures: [], notes: [], exceptions: [], ...ext
      });

      // 1. 공허한 시나리오
      {
        const ctx = { claimsDir: dir, base: { url: 'b', sha: 'b' }, head: { url: 'h', sha: 'h' }, floors, config, outDir: null, scenario: { id: 'sc', title: 'sc', steps: [] } };
        const res = await preserveLib.judgePreserve(ctx, baseClaim, { notes: [] });
        t.eq(res.outcome, claimsLib.OUTCOME.NO_TEST, '공허 시나리오 판정: 시험 미제출');
      }

      // 2. 정상 보존 통과 (mock verifyCellSplitProof)
      {
        const ctx = { claimsDir: dir, base: { url: 'b', sha: 'base123' }, head: { url: 'h', sha: 'head123' }, floors, config, outDir: null, scenario: { id: 'sc', title: 'sc', steps }, mockOverrides: {} };
        const origVerify = preserveLib.verifyCellSplitProof;
        preserveLib.verifyCellSplitProof = () => ({ ok: true, details: { ignoredKeys: [] } });
        let runCount = 0;
        const origRun = scenarioLib.runScenario;
        scenarioLib.runScenario = async () => { runCount++; return mockRes(true); };
        
        try {
           const res = await preserveLib.judgePreserve(ctx, baseClaim, { notes: [] });
           t.eq(res.outcome, claimsLib.OUTCOME.PRESERVED, '정상 보존 통과 판정: 보존됨');
           t.eq(runCount, 3, '기준 2회, 작업 1회 총 3회 실행');
        } finally {
           preserveLib.verifyCellSplitProof = origVerify;
           scenarioLib.runScenario = origRun;
        }
      }

      // 3. 작업 커밋 실패
      {
        const ctx = { claimsDir: dir, base: { url: 'b', sha: 'b' }, head: { url: 'h', sha: 'h' }, floors, config, outDir: null, scenario: { id: 'sc', title: 'sc', steps } };
        const origRun = scenarioLib.runScenario;
        scenarioLib.runScenario = async ({ siteRev }) => (siteRev === 'h' ? mockRes(false, 2, 'action') : mockRes(true));
        try {
           const res = await preserveLib.judgePreserve(ctx, baseClaim, { notes: [] });
           t.eq(res.outcome, claimsLib.OUTCOME.NOT_WORKING, '작업 커밋 실패시 판정: 아직 안 됨');
        } finally { scenarioLib.runScenario = origRun; }
      }

      // 4. 기준 커밋 실패
      {
        const ctx = { claimsDir: dir, base: { url: 'b', sha: 'b' }, head: { url: 'h', sha: 'h' }, floors, config, outDir: null, scenario: { id: 'sc', title: 'sc', steps } };
        const origRun = scenarioLib.runScenario;
        scenarioLib.runScenario = async ({ siteRev }) => (siteRev === 'h' ? mockRes(true) : mockRes(false, 2, 'action'));
        try {
           const res = await preserveLib.judgePreserve(ctx, baseClaim, { notes: [] });
           t.eq(res.outcome, claimsLib.OUTCOME.UNVERIFIED, '기준 커밋 실패시 판정: 확인 못 함');
        } finally { scenarioLib.runScenario = origRun; }
      }

      // 5. 기준 흔들림
      {
        const ctx = { claimsDir: dir, base: { url: 'b', sha: 'b' }, head: { url: 'h', sha: 'h' }, floors, config, outDir: null, scenario: { id: 'sc', title: 'sc', steps } };
        const origRun = scenarioLib.runScenario;
        let count = 0;
        scenarioLib.runScenario = async ({ siteRev }) => { if (siteRev === 'h') return mockRes(true); count++; return mockRes(count === 1); };
        try {
           const res = await preserveLib.judgePreserve(ctx, baseClaim, { notes: [] });
           t.eq(res.outcome, claimsLib.OUTCOME.UNSTABLE, '기준 커밋 2회차 결과 불일치시: 흔들림');
        } finally { scenarioLib.runScenario = origRun; }
      }
      fs.rmSync(dir, { recursive: true, force: true });
    },
  },
  {
    id: 'U-preserve-states-mismatch',
    title: '상태 비교: DOM, 저장값 불일치 처리 및 무시된 동적 값',
    async run(t) {
      const dir = tempDir('state-mismatch');
      const floors = grade.loadFloors();
      const config = scenarioLib.loadConfig();
      const steps = [{ do: 'goto', path: '/' }, { do: 'click', selector: 'x' }, { expect: 'visible', selector: 'y' }];
      
      const baseClaim = { id: 'C1', req: 'R1', kind: 'behavior', change: 'preserve', domain: 'ui-behavior', statement: '보존', scenario: 'sc.json', proof: 'proof.json' };
      const ctx = { claimsDir: dir, base: { url: 'b', sha: 'base123' }, head: { url: 'h', sha: 'head123' }, floors, config, outDir: null, scenario: { id: 'sc', title: 'sc', steps } };
      
      const origVerify = preserveLib.verifyCellSplitProof;
      preserveLib.verifyCellSplitProof = () => ({ ok: true, details: { ignoredKeys: [] } });
      const origRun = scenarioLib.runScenario;

      // 1. DOM 불일치 (작업 커밋에서만 다름) -> NOT_WORKING
      scenarioLib.runScenario = async ({ siteRev, outDir }) => ({
        passed: true, provesBehavior: true,
        states: [{ stepId: 1, dom: siteRev === 'head123' ? 'A_head' : 'A_base', localStorage: '{}', sessionStorage: '{}', toast: '', errCount: 0, modal: '' }],
        steps: steps.map(s => ({ name: 'wait', detail: '' })), exceptions: []
      });
      try {
        const res = await preserveLib.judgePreserve(ctx, baseClaim, { notes: [] });
        t.eq(res.outcome, claimsLib.OUTCOME.NOT_WORKING, 'DOM 불일치시 돌려보냄(아직 안 됨)');
        t.ok(res.notes.join('').toLowerCase().includes('dom'), '메모에 DOM 불일치 사유 포함');
      } finally {}

      // 2. 동적 DOM 무시 (기준 2회차 다름) -> UNVERIFIED
      let runCount = 0;
      scenarioLib.runScenario = async ({ siteRev }) => {
        runCount++;
        return {
          passed: true, provesBehavior: true,
          states: [{ stepId: 1, dom: runCount === 3 ? 'A_dynamic2' : 'A_dynamic1', localStorage: '{}', sessionStorage: '{}', toast: '', errCount: 0, modal: '' }],
          steps: steps.map(s => ({ name: 'wait', detail: '' })), exceptions: []
        };
      };
      try {
        const res2 = await preserveLib.judgePreserve(ctx, baseClaim, { notes: [] });
        t.eq(res2.outcome, claimsLib.OUTCOME.UNVERIFIED, '기준 2회차 다르면 DOM 검증 누락으로 UNVERIFIED');
      } finally {}

      preserveLib.verifyCellSplitProof = origVerify;
      scenarioLib.runScenario = origRun;
      fs.rmSync(dir, { recursive: true, force: true });
    }
  },
  {
    id: 'U-preserve-headline-and-rollup',
    title: '동작 보존 요약 및 판정 헤드라인: rollup 집계 및 headline 이 preserve 정체성을 솔직히 반영한다',
    run(t) {
      const doc = { requirements: [{ id: 'R1', text: '분열 보존' }] };
      const preservedJudgment = {
        id: 'C1', req: 'R1', kind: 'behavior', change: 'preserve',
        outcome: claimsLib.OUTCOME.PRESERVED, achieved: 'L3', meetsFloor: true,
      };

      const rolled = claimsLib.rollup(doc, [preservedJudgment]);
      t.eq(rolled.counts['동작 보존 확인'], 1, 'rollup counts 에 동작 보존 확인 1건');
      t.eq(rolled.reqs[0].bucket, '동작 보존 확인', '지시 항목 버킷이 동작 보존 확인');

      const hl = judgeLib.headline({ verdict: '통과', claims: [preservedJudgment], rollup: rolled });
      t.ok(hl.includes('동작 보존 분열 시험이 전부 기준 커밋의 동작을 그대로 보존'), 'headline 보존 문구 반영: ' + hl);
    },
  },
  {
    id: 'U-preserve-source-shell-injection',
    title: '셸 문자 든 파일 이름 거절',
    run(t) {
      const { recomputeSplit } = require('../lib/preserve-source.js');
      const res = recomputeSplit({ repoDir: 'dir', baseSha: 'a', headSha: 'b', config: { cells: [{file: 'a; rm -rf /'}], task: 'T', slot: 1 }, changedFiles: ['a; rm -rf /'] });
      t.ok(!res.ok, '비정상 파일명 거절됨');
      t.ok(res.reason.includes('Invalid path'), '사유에 Invalid path');
    }
  },
  {
    id: 'U-preserve-judgeclaim-passes-repodir',
    title: '동작 보존 주장: judgeClaim 이 분열 증명 검증에 저장소 경로(repoDir)를 넘기고, 진짜 저장소에서 git diff 가 성공한다(TASK-ES-597)',
    async run(t) {
      const { execFileSync } = require('node:child_process');
      const repo = tempDir('repo');
      const g = args => execFileSync('git', ['-C', repo, '-c', 'user.name=court-selftest', '-c', 'user.email=court-selftest@users.noreply.github.com', '-c', 'commit.gpgsign=false', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
      g(['init', '-q']);
      writeTree(repo, { 'index.html': '<p>a</p>\n' });
      g(['add', '-A']); g(['commit', '-q', '-m', 'base']);
      const baseSha = g(['rev-parse', 'HEAD']);
      writeTree(repo, { 'index.html': '<p>b</p>\n' });
      g(['add', '-A']); g(['commit', '-q', '-m', 'head']);
      const headSha = g(['rev-parse', 'HEAD']);

      const claimsDir = tempDir('claims');
      const steps = [{ do: 'goto', path: '/index.html' }, { do: 'click', selector: '#btn' }, { expect: 'visible', selector: '#result' }];
      writeTree(claimsDir, { 'sc.json': { id: 'selftest-repodir', title: '시험', steps }, 'proof.json': { task: 'TASK-SELFTEST', cells: [] } });
      const claim = { id: 'C1', req: 'R1', kind: 'behavior', change: 'preserve', domain: 'ui-behavior', statement: '보존', touches: ['index.html'], scenario: 'sc.json', proof: 'proof.json' };
      const pass = { passed: true, failedStep: null, failKind: null, provesBehavior: true, states: [], steps: [], fixtures: [], notes: [], exceptions: [] };

      const origVerify = preserveLib.verifyCellSplitProof;
      let seen = null;
      preserveLib.verifyCellSplitProof = (dir, c, vctx) => { seen = vctx; return origVerify(dir, c, vctx); };
      try {
        const ctx = { claimsDir, base: { url: 'b', sha: baseSha }, head: { url: 'h', sha: headSha }, floors: grade.loadFloors(), config: scenarioLib.loadConfig(), repoDir: repo, outDir: null, runScenario: async () => pass };
        const res = await claimsLib.judgeClaim(ctx, claim);
        t.ok(seen !== null, '분열 증명 검증까지 도달함');
        t.eq(seen && seen.repoDir, repo, '분열 증명 검증에 넘긴 repoDir 가 법정의 저장소 경로와 같다');
        const sp = res.evidence && res.evidence.splitProof;
        t.ok(!!sp, '판정 증거에 분열 증명 결과가 남음');
        const reason = (sp && sp.reason) || '';
        t.ok(!/Git diff 실행 실패/.test(reason), 'git diff 가 저장소 안에서 성공함(사유: ' + (reason || '없음') + ')');
        t.ok(!/repoDir\) 누락/.test(reason), 'repoDir 누락 사유가 아님');
      } finally {
        preserveLib.verifyCellSplitProof = origVerify;
      }

      const missing = preserveLib.verifyCellSplitProof(claimsDir, claim, { base: { sha: baseSha }, head: { sha: headSha }, scenarioResults: { H: pass } });
      t.ok(!missing.ok && /repoDir\) 누락/.test(missing.reason), 'repoDir 없이 부르면 git 을 돌리지 않고 법정 내부 결함으로 알린다: ' + missing.reason);
      fs.rmSync(repo, { recursive: true, force: true });
      fs.rmSync(claimsDir, { recursive: true, force: true });
    },
  },
];

module.exports = { TESTS };
