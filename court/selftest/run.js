#!/usr/bin/env node
'use strict';
// 법정 자가시험 — "법정도 같은 방식으로 의심한다".
// 일부러 만든 가짜를 법정에 넣어 가짜는 전부 걸러지고 정직한 작업은 통과하는지 단언한다. 법정이 거짓 합격을 내는 순간 이 시험이 먼저 깨져야 한다.
//   node court/selftest/run.js [--unit-only] [--filter <이름 일부>] [--isolate] [--keep] [--verbose]
//   --unit-only  브라우저가 필요 없는 단위 시험(+별표 대조)만
//   --filter     사례 id·제목에 이 글자가 들어간 것만
//   --isolate    묶어서 돌리는 주장 단위 가짜를 하나씩 따로 돌린다(느리지만 가짜끼리 서로 가려 주지 못한다)
//   --keep       합성 저장소·판정서 폴더를 지우지 않는다(어긋난 사례를 들여다볼 때)
// 종료코드: 0 전부 기대대로 · 1 하나라도 어긋남. 마지막 줄: "자가시험: 기대대로 N/N"
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
// 전용 임시 폴더: 법정이 만드는 court-judge-*·court-chrome-* 등을 전부 이 아래로 몰아넣고, 끝나면 이 폴더만 지운다.
// 공용 임시 폴더에서 이름으로 골라 지우면 같은 시각에 법정을 돌리는 다른 세션의 스냅샷까지 지운다(실제로 그랬다 — 2026-09-21).
const PRIVATE_TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'court-selftest-'));
for (const k of ['TMPDIR', 'TEMP', 'TMP']) process.env[k] = PRIVATE_TMP;
const { createLab } = require('./lab'); // 불러오는 순간 GIT_DIR 등 위치 변수를 환경에서 지운다(훅 안에서 돌 때 합성 커밋이 진짜 저장소로 새는 것을 막는다)
const { CASES, FRAGMENTS, buildBundle } = require('./cases');
const { UNIT_TESTS, APPENDIX_TEST } = require('./unit');
const { judge, EXIT } = require('../judge');
const grade = require('../lib/grade');
const report = require('../report');

function parseArgs(argv) {
  const a = { unitOnly: false, filter: null, isolate: false, keep: false, verbose: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--unit-only') a.unitOnly = true; else if (k === '--isolate') a.isolate = true; else if (k === '--keep') a.keep = true; else if (k === '--verbose') a.verbose = true;
    else if (k === '--filter') { a.filter = argv[++i]; if (!a.filter) throw new Error('--filter 뒤에 찾을 글자가 없다'); }
    else throw new Error('알 수 없는 인자: ' + k);
  }
  return a;
}

// 단언 수집기. 첫 어긋남에서 던지지 않고 전부 모은다 — 한 사례에서 무엇무엇이 어긋났는지 한 번에 보여 주기 위해서다.
function collector() {
  const bad = [];
  return {
    bad,
    ok(cond, label) { if (!cond) bad.push(label); },
    eq(actual, expected, label) { if (actual !== expected) bad.push(label + ' — 기대 ' + JSON.stringify(expected) + ' / 실제 ' + JSON.stringify(actual === undefined ? null : actual)); },
  };
}

const sec = ms => (ms / 1000).toFixed(1) + '초';
const results = [];
function record(id, title, bad, ms, note) {
  results.push({ id, title, ok: bad.length === 0, bad, ms });
  console.log((bad.length === 0 ? '  [기대대로] ' : '  [어긋남]   ') + id + ' ' + title + (note ? ' → ' + note : '') + ' (' + sec(ms) + ')');
  for (const b of bad) console.log('               · ' + b);
}

async function runTest(test) {
  const t = collector(); const t0 = Date.now();
  try { await test.run(t); } catch (e) { t.bad.push('시험 실행 중 예외: ' + String((e && e.stack) || e).split('\n').slice(0, 3).join(' | ')); }
  record(test.id, test.title, t.bad, Date.now() - t0);
}

// 정리는 전용 임시 폴더 하나만 지운다. 공용 임시 폴더의 court-judge-* 를 이름으로 골라 지우지 않는다 — 누가 만든 것인지 증명할 수 없기 때문이다.
function removePrivateTmp() {
  if (!path.basename(PRIVATE_TMP).startsWith('court-selftest-')) return; // 이름이 다르면 이 프로세스가 만든 폴더가 아니다
  for (let i = 0; i < 5; i++) { try { fs.rmSync(PRIVATE_TMP, { recursive: true, force: true }); return; } catch (_) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300); } }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  keepTmp = args.keep;
  const match = (id, title) => !args.filter || (id + ' ' + title).toLowerCase().includes(args.filter.toLowerCase());
  const tAll = Date.now();
  console.log('법정 자가시험 — 가짜는 전부 걸러지고 정직한 작업은 통과해야 한다 (node ' + process.version + ')');

  console.log('\n[1] 단위 시험(브라우저 불필요)');
  for (const u of UNIT_TESTS.filter(u => match(u.id, u.title))) await runTest(u);
  console.log('\n[2] 별표↔JSON 대조');
  if (match(APPENDIX_TEST.id, APPENDIX_TEST.title)) await runTest(APPENDIX_TEST);

  if (!args.unitOnly) {
    const outRoot = fs.mkdtempSync(path.join(PRIVATE_TMP, 'out-'));
    const labs = new Map();
    const labFor = variant => { const k = variant || 'standard'; if (!labs.has(k)) labs.set(k, createLab({ variant: k })); return labs.get(k); };
    const ctxBase = { grade, exitOf: verdict => EXIT[verdict] };
    const runJudge = async (lab, head, quick, tag) => judge({ repo: lab.dir, head, quick, out: path.join(outRoot, tag) });
    const brief = v => v.verdict + (v.headline ? ' — ' + v.headline.slice(0, 70) : '');

    try {
      const cases = CASES.filter(c => match(c.id, c.title));
      const order = { none: 0, quick: 1, full: 2 };
      cases.sort((a, b) => order[a.mode] - order[b.mode]);
      const quickish = cases.filter(c => c.mode !== 'full'), full = cases.filter(c => c.mode === 'full');

      const runCase = async c => {
        const t = collector(); const t0 = Date.now(); let note = '';
        try {
          const lab = labFor(c.lab);
          const built = c.build(lab);
          const v = await runJudge(lab, built.head, c.mode === 'quick', c.id);
          const ctx = { ...ctxBase };
          if (c.id === 'F24') { // 종료코드는 표만 믿지 않고 법정을 실제 명령으로도 돌려 본다
            const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'judge.js'), '--repo', lab.dir, '--head', built.head, '--quick', '--out', path.join(outRoot, c.id + '-cli')], { encoding: 'utf8', timeout: 120000 });
            ctx.cliExit = r.status;
          }
          note = brief(v);
          if (args.verbose) for (const l of report.firstLines(v)) console.log('      | ' + l);
          c.check(t, v, ctx);
        } catch (e) { t.bad.push('사례 실행 중 예외: ' + String((e && e.stack) || e).split('\n').slice(0, 3).join(' | ')); }
        record(c.id, c.title, t.bad, Date.now() - t0, note);
      };

      console.log('\n[3] 가짜·정직 사례 — 화면 점검 없이 걸러져야 하는 것(빠른 점검)');
      for (const c of quickish) await runCase(c);

      console.log('\n[4] 묶음 사례(주장 단위 가짜·회귀 가짜) — ' + (args.isolate ? '하나씩 따로' : '묶어서 법정 1회씩') + '(화면 점검 포함)');
      const frags = FRAGMENTS.filter(f => match(f.id, f.title));
      const groups = args.isolate ? frags.map(f => ({ name: f.id, frags: [f] })) : [...new Set(frags.map(f => f.bundle))].map(b => ({ name: '묶음' + b, frags: frags.filter(f => f.bundle === b) }));
      for (const g of groups) {
        const t0 = Date.now(); let v = null, err = null;
        const expectVerdict = g.frags.some(f => f.alone === '돌려보냄') ? '돌려보냄' : '확인 부족';
        try {
          const lab = labFor('standard');
          const tag = g.frags.map(f => f.id).join('-');
          const built = buildBundle(lab, 'bundle/' + tag.toLowerCase(), 'LAB-' + (g.frags.length > 1 ? 'BUNDLE-' + g.frags[0].bundle : g.frags[0].id), g.frags);
          v = await runJudge(lab, built.head, false, tag);
          if (args.verbose) for (const l of report.firstLines(v)) console.log('      | ' + l);
        } catch (e) { err = '법정 실행 중 예외: ' + String((e && e.stack) || e).split('\n').slice(0, 3).join(' | '); }
        const ms = Date.now() - t0;
        console.log('  (' + g.name + ': ' + g.frags.map(f => f.id).join('·') + ' → ' + (v ? brief(v) : '실행 실패') + ', ' + sec(ms) + ')');
        for (const f of g.frags) {
          const t = collector();
          if (err) t.bad.push(err);
          else {
            try { f.check(t, v, ctxBase); } catch (e) { t.bad.push('단언 중 예외: ' + String((e && e.message) || e)); }
            t.eq(v.verdict, expectVerdict, f.id + ' 가 든 작업 커밋의 판정');
          }
          record(f.id, f.title, t.bad, Math.round(ms / g.frags.length));
        }
      }

      console.log('\n[5] 가짜·정직 사례 — 화면까지 봐야 하는 것(법정 전체 실행, 순차)');
      for (const c of full) await runCase(c);
    } finally {
      if (!args.keep) for (const lab of labs.values()) lab.dispose();
      else console.log('\n(--keep) 합성 저장소: ' + [...labs.values()].map(l => l.dir).join(', ') + ' / 판정서: ' + outRoot + ' / 전용 임시 폴더: ' + PRIVATE_TMP);
    }
  }

  const okN = results.filter(r => r.ok).length;
  const badList = results.filter(r => !r.ok);
  console.log('\n──────── 요약 (' + sec(Date.now() - tAll) + ') ────────');
  if (badList.length) {
    console.log('어긋난 시험 ' + badList.length + '건 — 기대값을 낮추지 말고 법정을 고친다:');
    for (const r of badList) { console.log('  ' + r.id + ' ' + r.title); for (const b of r.bad) console.log('      · ' + b); }
  } else if (results.length) console.log('어긋난 시험 없음.');
  if (args.unitOnly || args.filter) console.log('(일부만 실행: ' + [args.unitOnly ? '--unit-only' : '', args.filter ? '--filter ' + args.filter : ''].filter(Boolean).join(' ') + ' — 전체 결과가 아니다)');
  // 아무것도 안 돌리고 "문제없음"을 내지 않는다(0/0 은 실패다).
  finish('자가시험: 기대대로 ' + okN + '/' + results.length, results.length > 0 && okN === results.length ? 0 : 1);
}

// 마지막 줄이 계약이다(CI·훅이 이 줄을 읽는다). Windows 에서는 파이프로 나가는 stdout 이 비동기일 수 있어 바로 exit 하면 잘릴 수 있다 — 다 쓴 뒤에 끝낸다.
let keepTmp = false;
function finish(lastLine, code) { if (!keepTmp) removePrivateTmp(); process.stdout.write(lastLine + '\n', () => process.exit(code)); }

main().catch(e => { console.error('자가시험 실행 실패: ' + ((e && e.stack) || e)); finish('자가시험: 기대대로 0/0', 1); });
