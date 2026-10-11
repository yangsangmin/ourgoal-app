'use strict';
// 로컬 법정 전체 실행(node court/judge.js --repo . --head <커밋> --out <임시 폴더>)이 남긴 verdict.json 을 요약해 court-local.json 으로 쓴다.
// 작업자 PC 에서 실행한 예비 점검 — 판정이 아니다. 판정은 GitHub 법정만 낸다. 값을 가공하지 않고 옮긴다.
// 사용: node reports/TASK-ES-646/tools/court-local.cjs <judge --out 폴더> <judge 종료 코드> <심사한 커밋> [덧붙일 말]
const fs = require('fs'), path = require('path');
const [OUTDIR, EXIT, HEADSHA, NOTE] = process.argv.slice(2);
const v = JSON.parse(fs.readFileSync(path.join(OUTDIR, 'verdict.json'), 'utf8'));
const out = {
  tool: 'node court/judge.js --repo . --head HEAD --out <임시 폴더> (법정 코드를 읽기만 쓴 작업자 PC 실행 — --quick 없이 화면 시나리오 포함)',
  type: '작업자 PC 에서 실행한 예비 점검 — 판정이 아니다. 판정은 GitHub 법정만 낸다',
  judgeExitCode: Number(EXIT), ranToEnd: fs.existsSync(path.join(OUTDIR, 'REPORT.md')),
  head: { sha: (v.head && v.head.sha) || HEADSHA }, base: v.base ? { sha: v.base.sha } : null, baseSource: v.baseSource || null,
  verdictId: v.verdictId || null, verdict: v.verdict, headline: v.headline, todo: v.todo,
  note: NOTE || null,
  coverage: v.coverage || null,
  vaultViolations: (v.vault && v.vault.violations) || [], vaultNeedsDecision: !!(v.vault && v.vault.needsDecision),
  findings: (v.findings || []).map(f => ({ severity: f.severity, title: f.title, text: String(f.text || '').slice(0, 400) })),
  notChecked: v.notChecked || [], envSensitive: v.envSensitive || [],
  rollup: v.rollup ? { total: v.rollup.total, counts: v.rollup.counts, reqs: v.rollup.reqs.map(r => ({ id: r.id, bucket: r.bucket, note: r.note, floor: r.floor, claims: r.claims })) } : null,
  claims: (v.claims || []).map(c => ({ id: c.id, req: c.req, kind: c.kind, change: c.change, outcome: c.outcome, achieved: c.achieved, floor: c.floor, meetsFloor: c.meetsFloor, toolLimit: c.toolLimit || null, notes: c.notes,
    scenario: c.evidence && c.evidence.type === 'scenario' ? { head: c.evidence.head && { passed: c.evidence.head.passed, provesBehavior: c.evidence.head.provesBehavior, exceptions: (c.evidence.head.exceptions || []).length }, base: c.evidence.base && { passed: c.evidence.base.passed, provesBehavior: c.evidence.base.provesBehavior }, base2: c.evidence.base2 && { passed: c.evidence.base2.passed, provesBehavior: c.evidence.base2.provesBehavior }, splitProof: c.evidence.splitProof || null } : undefined })),
  reheard: (v.reheard || []).length, claimBudget: v.claimBudget || null,
};
fs.writeFileSync(path.join(__dirname, '..', 'court-local.json'), JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify({ exit: out.judgeExitCode, verdict: out.verdict, headline: out.headline, counts: out.rollup && out.rollup.counts, findings: out.findings.map(f => f.severity + ':' + f.title), outcomes: out.claims.reduce((a, c) => { a[c.outcome] = (a[c.outcome] || 0) + 1; return a; }, {}) }, null, 1));
