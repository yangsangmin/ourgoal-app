'use strict';
/* TASK-ES-355 (노션 CORE-02, GOALS-24 흡수) 실계정 2개 확인 하네스.
 * 테스트 계정 두 개(A·B)를 이메일 로그인해 헤드리스 브라우저 여러 개로 시나리오(real-account-scenarios.md)를 재생한다.
 * 결과는 시나리오별 통과/실패/못 함 JSON. 작업자 쪽 예비 증거이며 판정이 아니다(판정은 법정만).
 *
 * 사용:
 *   node real-account-check.js [--out 결과.json] [--only ID,ID] [--include-withdraw] [--headful]
 *   node real-account-check.js --mock <APP_DIR> [--out 결과.json]   (가짜 Supabase 로 배선만 점검, 결과에 mode:"mock")
 * 환경 변수(값은 파일·로그에 쓰지 않는다):
 *   OG_APP_URL, OG_TEST_A_EMAIL, OG_TEST_A_PASSWORD, OG_TEST_B_EMAIL, OG_TEST_B_PASSWORD
 *   선택: OG_TEST_C_EMAIL, OG_TEST_C_PASSWORD, OG_CHROME, OG_PUPPETEER (닉네임은 로그인 뒤 화면에서 읽는다)
 * 안전:
 *   - 필수 환경 변수가 하나라도 없으면 브라우저를 띄우지 않고 어디에도 접속하지 않은 채 '계정 없음 — 재생 안 함'(종료 코드 2).
 *   - 주소에 'ogtest' 가 없거나 A·B 가 같으면 접속하지 않고 종료(종료 코드 3). 실사용 계정 오입력 방지.
 *   - 만드는 데이터에는 runTag 를 붙이고, 끝에 그 표식이 붙은 자기 행만 지운 뒤 지운 목록을 cleanup 에 남긴다.
 */
const fs = require('fs'), path = require('path');
const steps = require('./real-account-steps.js');

const REQUIRED_ENV = ['OG_APP_URL', 'OG_TEST_A_EMAIL', 'OG_TEST_A_PASSWORD', 'OG_TEST_B_EMAIL', 'OG_TEST_B_PASSWORD'];
const ACCOUNT_MARK = /ogtest/i;
const NO_ACCOUNT_MSG = '계정 없음 — 재생 안 함';

function parseArgs(argv){
  const a = { out: null, only: null, includeWithdraw: false, headful: false, mock: null };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--out') a.out = path.resolve(argv[++i]);
    else if (k === '--only') a.only = String(argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (k === '--include-withdraw') a.includeWithdraw = true;
    else if (k === '--headful') a.headful = true;
    else if (k === '--mock') a.mock = path.resolve(argv[++i] || '.');
  }
  return a;
}

function makeRunTag(){
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return 'ogtest-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + p(d.getHours()) + p(d.getMinutes()) + '-' + Math.random().toString(36).slice(2, 6);
}

/* 계정 조건 점검. 값은 돌려주지 않고 무엇이 없는지 이름만 돌려준다. */
function checkEnv(env){
  const missing = REQUIRED_ENV.filter((k) => !String(env[k] || '').trim());
  if (missing.length) return { ok: false, code: 2, reason: NO_ACCOUNT_MSG, missing };
  const a = String(env.OG_TEST_A_EMAIL).trim().toLowerCase(), b = String(env.OG_TEST_B_EMAIL).trim().toLowerCase();
  const bad = [];
  if (!ACCOUNT_MARK.test(a)) bad.push('OG_TEST_A_EMAIL 에 ogtest 없음');
  if (!ACCOUNT_MARK.test(b)) bad.push('OG_TEST_B_EMAIL 에 ogtest 없음');
  if (a === b) bad.push('A·B 주소가 같음');
  if (env.OG_TEST_C_EMAIL && !ACCOUNT_MARK.test(String(env.OG_TEST_C_EMAIL))) bad.push('OG_TEST_C_EMAIL 에 ogtest 없음');
  if (!/^https?:\/\//.test(String(env.OG_APP_URL))) bad.push('OG_APP_URL 이 http(s) 주소가 아님');
  if (bad.length) return { ok: false, code: 3, reason: '계정 조건 위반 — 접속 안 함', problems: bad };
  return { ok: true };
}

function accountsFromEnv(env){
  const acc = {
    A: { label: 'A', email: env.OG_TEST_A_EMAIL.trim(), password: env.OG_TEST_A_PASSWORD},
    B: { label: 'B', email: env.OG_TEST_B_EMAIL.trim(), password: env.OG_TEST_B_PASSWORD}
  };
  if (env.OG_TEST_C_EMAIL && env.OG_TEST_C_PASSWORD) acc.C = { label: 'C', email: env.OG_TEST_C_EMAIL.trim(), password: env.OG_TEST_C_PASSWORD};
  return acc;
}

function summarize(results){
  const s = { '통과': 0, '실패': 0, '못 함': 0 };
  results.forEach((r) => { s[r.status] = (s[r.status] || 0) + 1; });
  return s;
}

function writeOut(out, data){
  const text = JSON.stringify(data, null, 2) + '\n';
  if (out) { fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, text, 'utf8'); }
  return text;
}

/* 계정이 없을 때: 브라우저도 서버도 건드리지 않고 시나리오 전부를 '못 함'으로 적는다 */
function noAccountResult(chk, runTag){
  return {
    tool: 'docs/design/harness/real-account-check.js', task: 'TASK-ES-355', mode: 'none',
    status: chk.reason, missingEnv: chk.missing || [], problems: chk.problems || [],
    network: '접속 0 (브라우저를 띄우지 않음)', runTag, startedAt: new Date().toISOString(),
    scenarios: steps.SCENARIOS.map((s) => ({ id: s.id, tab: s.tab, source: s.source, status: '못 함', failedStep: { step: 'preflight', saw: chk.reason } })),
    summary: { '통과': 0, '실패': 0, '못 함': steps.SCENARIOS.length },
    cleanup: { deleted: [], leftover: [] }
  };
}

async function main(argv){
  const args = parseArgs(argv);
  const runTag = makeRunTag();
  let ctx;
  if (args.mock) {
    ctx = await steps.mockContext(args.mock, runTag, args);
  } else {
    const chk = checkEnv(process.env);
    if (!chk.ok) {
      const res = noAccountResult(chk, runTag);
      writeOut(args.out, res);
      console.log(chk.reason + (chk.missing ? ' (없는 변수: ' + chk.missing.join(', ') + ')' : '') + (chk.problems ? ' (' + chk.problems.join(' / ') + ')' : ''));
      console.log('시나리오 ' + res.scenarios.length + '개 모두 못 함. 접속 0.' + (args.out ? ' 결과: ' + args.out : ''));
      return chk.code;
    }
    ctx = await steps.liveContext(process.env.OG_APP_URL.replace(/\/+$/, ''), accountsFromEnv(process.env), runTag, args);
  }
  const results = [];
  try {
    for (const sc of steps.SCENARIOS) {
      if (args.only && !args.only.includes(sc.id)) continue;
      results.push(await steps.runScenario(ctx, sc));
      console.log('[' + sc.id + '] ' + results[results.length - 1].status);
    }
  } finally {
    await steps.cleanup(ctx);
    await steps.closeAll(ctx);
  }
  const res = {
    tool: 'docs/design/harness/real-account-check.js', task: 'TASK-ES-355', mode: ctx.mode,
    note: ctx.mode === 'mock' ? '가짜 Supabase(두 브라우저가 노드 쪽 메모리 서버 공유) — 배선 점검이며 실계정 확인이 아니다' : '실계정 재생 — 작업자 예비 증거, 판정 아님',
    appUrl: ctx.mode === 'mock' ? 'local static server' : ctx.base,
    accounts: Object.keys(ctx.accounts), runTag, startedAt: ctx.startedAt, finishedAt: new Date().toISOString(),
    scenarios: results, summary: summarize(results), cleanup: ctx.cleanupLog
  };
  writeOut(args.out, res);
  console.log(JSON.stringify(res.summary) + (args.out ? ' 결과: ' + args.out : ''));
  if (ctx.cleanupLog.leftover.length) console.log('경고: 지우지 못한 테스트 데이터 ' + ctx.cleanupLog.leftover.length + '건 — cleanup.leftover 확인');
  return res.summary['실패'] ? 1 : 0;
}

if (require.main === module) {
  main(process.argv.slice(2)).then((code) => process.exit(code), (e) => { console.error(e && e.stack || e); process.exit(4); });
}

module.exports = { main, checkEnv, noAccountResult, REQUIRED_ENV, NO_ACCOUNT_MSG };
