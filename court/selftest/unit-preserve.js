'use strict';
// 법정 자가시험 — 동작 보존 분열(preserve) 전용 단위 시험.
// 동작 보존 분열 심사 경로의 판정, 증명 검증, 기존 fix/new 불변성을 단위 수준에서 정밀 검증한다.
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
      t.ok(chatLib.cleared('b', '동작 보존 확인'), 'chat.cleared 에서 화면 동작 보존 확인 해제');
      t.ok(chatLib.cleared('s', '동작 보존 확인'), 'chat.cleared 에서 글자 확인 보존 확인 해제');
      t.ok(typeof reportLib.SCOPE_PRESERVE_NOTICE === 'string' && reportLib.SCOPE_PRESERVE_NOTICE.includes('기준 커밋(2회)과 작업 커밋(1회)'), 'report.SCOPE_PRESERVE_NOTICE 문구');

      const dist = reportLib.distributionLine({ total: 1, counts: { '동작 보존 확인': 1 } }, null);
      t.ok(dist.includes('동작 보존 확인 1'), '분포 출력에 동작 보존 확인 반영: ' + dist);
    },
  },
  {
    id: 'U-preserve-cell-split-proof',
    title: '동작 보존 CELL_SPLIT_PROOF 검증기: 토큰·누수·DOM/스토리지·변조감도가 정직하게 검증된다',
    run(t) {
      const dir = tempDir('split-proof');
      try {
        const validProof = {
          schema: 'cell-split-proof/1',
          proofs: { tokenResidualLeak: 'token.json' },
          baseSha: 'base123',
          headSha: 'head123',
          mutatorSensitivity: { ok: true, detectedMutations: 5 },
        };
        
        const validToken = {
          equiv: [
            { name: 'fn1', tokensOrig: 10, tokensNew: 10, same: true, tokensOrigArray: ['a','b'], tokensNewArray: ['a','b'] }
          ],
          restSame: true,
          tokens: { origRest: 5, newRest: 5, origRestArray: ['x'], newRestArray: ['x'] },
          leaksIIFEName: [],
          thisArgs: []
        };

        const claim = { id: 'C1', change: 'preserve', proof: 'proof.json' };
        
        const mockH = { captures: [{ dom: 'A', localStorage: 'B', sessionStorage: 'C', toast: 'D', err: 'E', modal: 'F' }] };
        const mockB = { captures: [{ dom: 'A', localStorage: 'B', sessionStorage: 'C', toast: 'D', err: 'E', modal: 'F' }] };
        const mockB2 = { captures: [{ dom: 'A', localStorage: 'B', sessionStorage: 'C', toast: 'D', err: 'E', modal: 'F' }] };
        const ctx = { scenarioResults: { H: mockH, B: mockB, B2: mockB2 }, base: { sha: '000000000000000000000000000000000000ba5e' }, head: { sha: '000000000000000000000000000000000000beef' } };

        writeTree(dir, { 'proof.json': validProof, 'token.json': validToken, 'moduleLoad.json': { newRegressionCount: 0 }, 'testSuite.json': { tests: { regressionCount: 0 } }, 'tab.json': { differingValues: 0 } });
        const resOk = preserveLib.verifyCellSplitProof(dir, claim, ctx);
        t.ok(resOk.ok, '정상 splitProof 검증 통과');

        // 1. 토큰 수 불일치
        writeTree(dir, { 'token.json': { ...validToken, equiv: [{ ...validToken.equiv[0], tokensNew: 11 }] } });
        const resTok = preserveLib.verifyCellSplitProof(dir, claim, ctx);
        t.ok(!resTok.ok && resTok.reason.includes('토큰 수 불일치'), '토큰 수 불일치 거절');

        // 2. 잔여 토큰 불일치
        writeTree(dir, { 'token.json': { ...validToken, tokens: { ...validToken.tokens, newRest: 6 } } });
        const resResid = preserveLib.verifyCellSplitProof(dir, claim, ctx);
        t.ok(!resResid.ok && resResid.reason.includes('잔여 토큰 수 불일치'), '잔여 토큰 수 불일치 거절');

        // 3. 접두 누수
        writeTree(dir, { 'token.json': { ...validToken, leaksIIFEName: ['leakedVar'] } });
        const resLeak = preserveLib.verifyCellSplitProof(dir, claim, ctx);
        t.ok(!resLeak.ok && resLeak.reason.includes('누수'), '누수 검출 거절');

        // 4. thisArgs > 0
        writeTree(dir, { 'token.json': { ...validToken, thisArgs: ['this'] } });
        const resThis = preserveLib.verifyCellSplitProof(dir, claim, ctx);
        t.ok(!resThis.ok && resThis.reason.includes('this/arguments'), 'thisArgs 검출 거절');

        // 5. DOM/스토리지 불일치
        const badCtx = { ...ctx, scenarioResults: { H: { captures: [{...mockH.captures[0], dom: 'X'}] }, B: mockB, B2: mockB2 } };
        writeTree(dir, { 'token.json': validToken });
        const resDom = preserveLib.verifyCellSplitProof(dir, claim, badCtx);
        t.ok(!resDom.ok && resDom.reason.includes('DOM 불일치'), 'DOM 동등성 실패 거절');

        // 6. 변조 감도 실패
        writeTree(dir, { 'proof.json': { ...validProof, mutatorSensitivity: { ok: false } } });
        const resMut = preserveLib.verifyCellSplitProof(dir, claim, ctx);
        t.ok(!resMut.ok && resMut.reason.includes('변조 방어'), '변조 감도 실패 거절');

        // 7. 증명 파일 누락
        const resMissing = preserveLib.verifyCellSplitProof(dir, { ...claim, proof: 'none.json' }, ctx);
        t.ok(!resMissing.ok && resMissing.reason.includes('proof.json 부재'), '증명 파일 누락 거절');
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    },
  },
  {
    id: 'U-preserve-judge-claim-truth',
    title: '동작 보존 주장 판정: 4조합(성공·작업실패·기준실패·흔들림) 및 실효하한·행동증명이 엄격히 판정된다',
    async run(t) {
      const dir = tempDir('judge-claim');
      const floors = grade.loadFloors();
      const config = scenarioLib.loadConfig();
      const steps = [
        { do: 'goto', path: '/index.html' },
        { do: 'click', selector: '#btn' },
        { expect: 'visible', selector: '#result' },
      ];
      const validProof = {
        schema: 'cell-split-proof/1',
        sourceFile: 'js/calc.js',
        splitFiles: ['js/calc-core.js', 'js/calc-ui.js'],
        baseTokenCount: 100,
        headTokenCount: 100,
        beforeResidualTokenCount: 10,
        afterResidualTokenCount: 10,
        leaksIIFEName: [],
        thisArgs: 0,
        stepEquivalence: { dom: true, storage: true, toast: true, console: true },
        mutatorSensitivity: { ok: true, detectedMutations: 3 },
      };

      writeTree(dir, {
        'sc.json': { id: 'test-sc', title: '보존 시험', steps },
        'proof.json': validProof,
      });

      const baseClaim = {
        id: 'C1',
        req: 'R1',
        kind: 'behavior',
        change: 'preserve',
        domain: 'ui-behavior',
        statement: '계산기 분열 후에도 버튼을 누르면 결과가 정상 노출된다',
        touches: ['js/calc.js'],
        scenario: 'sc.json',
        proof: 'proof.json',
      };

      const mockRes = (passed, failedStep = null, provesBehavior = true) => ({
        passed,
        failedStep,
        failKind: passed ? null : 'expect',
        provesBehavior,
        captures: [],
        steps: [
          { name: 'goto', detail: 'goto /index.html' },
          { name: 'click', detail: 'click #btn' },
          { name: 'expect', detail: 'visible #result' }
        ],
        fixtures: [],
        notes: [],
      });

      // 1. 정상 통과 조합 (B=pass, B2=pass, H=pass, proof=ok, provesBehavior=true)
      {
        let count = 0;
        const ctx = {
          claimsDir: dir,
          base: { url: 'http://base.test', sha: 'base123' },
          head: { url: 'http://head.test', sha: 'head123' },
          floors,
          config,
          outDir: null,
          runScenario: async ({ siteRev }) => {
            count++;
            return mockRes(true, null, true);
          },
        };
        const res = await claimsLib.judgeClaim(ctx, baseClaim);
        t.eq(res.outcome, claimsLib.OUTCOME.PRESERVED, '정상 보존 통과 판정: 보존됨');
        t.ok(res.meetsFloor, '실효하한 충족');
        t.eq(count, 3, '기준 2회, 작업 1회 총 3회 실행');
      }

      // 2. 작업 커밋 실패 (H=fail)
      {
        const ctx = {
          claimsDir: dir,
          base: { url: 'http://base.test', sha: 'base123' },
          head: { url: 'http://head.test', sha: 'head123' },
          floors,
          config,
          outDir: null,
          runScenario: async ({ siteRev }) => {
            if (siteRev === 'head123') return mockRes(false, 3);
            return mockRes(true);
          },
        };
        const res = await claimsLib.judgeClaim(ctx, baseClaim);
        t.eq(res.outcome, claimsLib.OUTCOME.NOT_WORKING, '작업 커밋 실패시 판정: 아직 안 됨');
      }

      // 3. 기준 커밋 실패 (B=fail, B2=fail)
      {
        const ctx = {
          claimsDir: dir,
          base: { url: 'http://base.test', sha: 'base123' },
          head: { url: 'http://head.test', sha: 'head123' },
          floors,
          config,
          outDir: null,
          runScenario: async ({ siteRev }) => {
            if (siteRev === 'head123') return mockRes(true);
            return mockRes(false, 2);
          },
        };
        const res = await claimsLib.judgeClaim(ctx, baseClaim);
        t.eq(res.outcome, claimsLib.OUTCOME.NO_TEST, '기준 커밋 실패시 판정: 시험 미제출');
      }

      // 4. 기준 커밋 흔들림 (B=pass, B2=fail)
      {
        let baseCount = 0;
        const ctx = {
          claimsDir: dir,
          base: { url: 'http://base.test', sha: 'base123' },
          head: { url: 'http://head.test', sha: 'head123' },
          floors,
          config,
          outDir: null,
          runScenario: async ({ siteRev }) => {
            if (siteRev === 'head123') return mockRes(true);
            baseCount++;
            return mockRes(baseCount === 1);
          },
        };
        const res = await claimsLib.judgeClaim(ctx, baseClaim);
        t.eq(res.outcome, claimsLib.OUTCOME.UNSTABLE, '기준 커밋 2회차 결과 불일치시: 흔들림');
      }

      // 5. 행동증명 부재 (provesBehavior=false)
      {
        const ctx = {
          claimsDir: dir,
          base: { url: 'http://base.test', sha: 'base123' },
          head: { url: 'http://head.test', sha: 'head123' },
          floors,
          config,
          outDir: null,
          runScenario: async () => mockRes(true, null, false),
        };
        const res = await claimsLib.judgeClaim(ctx, baseClaim);
        t.eq(res.outcome, claimsLib.OUTCOME.NO_TEST, '행동증명 부재시 판정: 시험 미제출');
      }

      // 6. 증명 검증 실패 시 -> OUTCOME.UNVERIFIED
      {
        const ctx = {
          claimsDir: dir,
          base: { url: 'http://base.test', sha: 'base123' },
          head: { url: 'http://head.test', sha: 'head123' },
          floors,
          config,
          outDir: null,
          runScenario: async () => mockRes(true, null, true),
        };
        const badClaim = { ...baseClaim, proof: 'nonexistent.json' };
        const res = await claimsLib.judgeClaim(ctx, badClaim);
        t.eq(res.outcome, claimsLib.OUTCOME.UNVERIFIED, '분열 증명 실패시 판정: 확인 부족');
      }

      fs.rmSync(dir, { recursive: true, force: true });
    },
  },
  {
    id: 'U-preserve-fix-new-regression',
    title: '기존 fix/new 불변성: 기존 진리표 4조합과 NOTHING_TO_FIX 판정이 완전히 보존된다',
    async run(t) {
      const dir = tempDir('fix-new-reg');
      const floors = grade.loadFloors();
      const config = scenarioLib.loadConfig();
      const steps = [
        { do: 'goto', path: '/index.html' },
        { do: 'click', selector: '#btn' },
        { expect: 'visible', selector: '#result' },
      ];
      writeTree(dir, { 'sc.json': { id: 'test-sc', title: '시험', steps } });

      const mockRes = (passed, failedStep = null, failKind = 'expect', provesBehavior = true) => ({
        passed,
        failedStep,
        failKind: passed ? null : failKind,
        provesBehavior,
        captures: [],
        steps: [
          { name: 'goto', detail: 'goto /index.html' },
          { name: 'click', detail: 'click #btn' },
          { name: 'expect', detail: 'visible #result' }
        ],
        fixtures: [],
        notes: [],
      });

      // 1. fix: H=pass, B=fail@symptom -> FIXED
      {
        const ctx = {
          claimsDir: dir,
          base: { url: 'http://base.test', sha: 'base' },
          head: { url: 'http://head.test', sha: 'head' },
          floors,
          config,
          outDir: null,
          runScenario: async ({ siteRev }) => (siteRev === 'head' ? mockRes(true) : mockRes(false, 3, 'expect')),
        };
        const claim = {
          id: 'C1',
          req: 'R1',
          kind: 'behavior',
          change: 'fix',
          symptom: 3,
          domain: 'ui-behavior',
          statement: '고침',
          touches: ['js/app.js'],
          scenario: 'sc.json',
        };
        const res = await claimsLib.judgeClaim(ctx, claim);
        t.eq(res.outcome, claimsLib.OUTCOME.CONFIRMED, 'fix 정상 해결: 확인됨');
      }

      // 2. fix: H=pass, B=pass -> NOTHING_TO_FIX
      {
        const ctx = {
          claimsDir: dir,
          base: { url: 'http://base.test', sha: 'base' },
          head: { url: 'http://head.test', sha: 'head' },
          floors,
          config,
          outDir: null,
          runScenario: async () => mockRes(true),
        };
        const claim = {
          id: 'C1',
          req: 'R1',
          kind: 'behavior',
          change: 'fix',
          symptom: 3,
          domain: 'ui-behavior',
          statement: '고침',
          touches: ['js/app.js'],
          scenario: 'sc.json',
        };
        const res = await claimsLib.judgeClaim(ctx, claim);
        t.eq(res.outcome, claimsLib.OUTCOME.NOTHING_TO_FIX, 'fix 양쪽 통과: 고칠 게 없었음');
      }

      // 3. new: H=pass, B=pass -> NOTHING_TO_FIX (절대 전역 통과로 바뀌지 않음)
      {
        const ctx = {
          claimsDir: dir,
          base: { url: 'http://base.test', sha: 'base' },
          head: { url: 'http://head.test', sha: 'head' },
          floors,
          config,
          outDir: null,
          runScenario: async () => mockRes(true),
        };
        const claim = {
          id: 'C1',
          req: 'R1',
          kind: 'behavior',
          change: 'new',
          domain: 'ui-behavior',
          statement: '신규',
          touches: ['js/app.js'],
          scenario: 'sc.json',
        };
        const res = await claimsLib.judgeClaim(ctx, claim);
        t.eq(res.outcome, claimsLib.OUTCOME.NOTHING_TO_FIX, 'new 양쪽 통과: 고칠 게 없었음 (보존됨으로 승격 불가)');
      }

      // 4. new: H=pass, B=fail -> WORKING
      {
        const ctx = {
          claimsDir: dir,
          base: { url: 'http://base.test', sha: 'base' },
          head: { url: 'http://head.test', sha: 'head' },
          floors,
          config,
          outDir: null,
          runScenario: async ({ siteRev }) => (siteRev === 'head' ? mockRes(true) : mockRes(false, 2, 'action')),
        };
        const claim = {
          id: 'C1',
          req: 'R1',
          kind: 'behavior',
          change: 'new',
          domain: 'ui-behavior',
          statement: '신규',
          touches: ['js/app.js'],
          scenario: 'sc.json',
        };
        const res = await claimsLib.judgeClaim(ctx, claim);
        t.eq(res.outcome, claimsLib.OUTCOME.CONFIRMED, 'new 신규 기능: 확인됨');
      }

      fs.rmSync(dir, { recursive: true, force: true });
    },
  },
  {
    id: 'U-preserve-headline-and-rollup',
    title: '동작 보존 요약 및 판정 헤드라인: rollup 집계 및 headline 이 preserve 정체성을 솔직히 반영한다',
    run(t) {
      const doc = { requirements: [{ id: 'R1', text: '분열 보존' }] };
      const preservedJudgment = {
        id: 'C1',
        req: 'R1',
        kind: 'behavior',
        change: 'preserve',
        outcome: claimsLib.OUTCOME.PRESERVED,
        achieved: 'L3',
        meetsFloor: true,
      };

      const rolled = claimsLib.rollup(doc, [preservedJudgment]);
      t.eq(rolled.counts['동작 보존 확인'], 1, 'rollup counts 에 동작 보존 확인 1건');
      t.eq(rolled.reqs[0].bucket, '동작 보존 확인', '지시 항목 버킷이 동작 보존 확인');

      // headline 검증
      const hl = judgeLib.headline({
        verdict: '통과',
        claims: [preservedJudgment],
        rollup: rolled,
      });
      t.ok(hl.includes('동작 보존 분열 시험이 전부 기준 커밋의 동작을 그대로 보존'), 'headline 보존 문구 반영: ' + hl);
    },
  },
];

module.exports = { TESTS };
