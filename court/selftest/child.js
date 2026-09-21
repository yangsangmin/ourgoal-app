#!/usr/bin/env node
'use strict';
// 법정 자가시험 — 법정을 자식 프로세스에서 돌리는 도우미.
// 법정의 부품 하나를 시험용으로 바꿔 끼우거나(주장 심사 시간 예산 · 도구 오류 1건) 법정을 도중에 끝내 보는 시험은 자가시험 본체와 같은 프로세스에서 할 수 없다:
// 법정 모듈은 한 번 불러오면 그대로이고, 프로세스를 끝내면 자가시험도 같이 끝난다. 그래서 이 파일을 따로 띄운다. 법정 파일은 고치지 않는다.
//   node court/selftest/child.js '<설정 JSON>'
//   설정: { repo, head, out, quick,
//           budgetMs?    주장 심사 시간 예산을 이 값으로(법정 설정 파일은 그대로 두고, 읽어 온 설정에만 얹는다)
//           toolError?   기준 시험지 채점이 이 문장의 도구 오류 1건만 내게 한다
//           abort?       { phase: 미리 써 둔 판정서의 "마지막으로 하던 일"에 이 글자가 보이면, afterMs: 그 뒤 몇 ms, how: 'exit'|'SIGINT'|'SIGTERM' }
//           chromeOnly?  'exit'|'throw'|'killAll' — 법정은 돌리지 않고 브라우저 2개를 띄운 뒤 닫지 않은 채 그 방식으로 끝낸다 }
// 법정이 끝까지 갔으면 표준출력 마지막 줄에 결과 JSON 한 줄을 낸다.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const COURT = path.join(__dirname, '..');
const cfg = JSON.parse(process.argv[2] || '{}');

// 법정이 불러 쓰는 모듈의 내보내기 일부를 바꿔 끼운다. 법정(judge.js)을 불러오기 전에 해야 한다.
function swap(rel, make) {
  const file = require.resolve(path.join(COURT, rel));
  const real = require(file);
  require.cache[file].exports = { ...real, ...make(real) };
}

async function chromeOnly(how) {
  const chrome = require('../lib/chrome');
  await chrome.launch({}); await chrome.launch({});
  const info = { live: chrome.liveCount(), dirs: fs.readdirSync(os.tmpdir()).filter(n => n.startsWith('court-chrome-')).length };
  if (how === 'killAll') { info.killed = chrome.killAll(); info.after = chrome.liveCount(); }
  process.stderr.write(JSON.stringify(info) + '\n');
  if (how === 'throw') setTimeout(() => { throw new Error('(자가시험) 일부러 던진 예외'); }, 10);
  else process.exit(how === 'exit' ? 5 : 0);
}

function runCourt() {
  if (Number.isFinite(cfg.budgetMs)) swap('lib/scenario.js', real => ({ loadConfig: (...a) => ({ ...real.loadConfig(...a), claimBudgetMs: cfg.budgetMs }) }));
  if (typeof cfg.toolError === 'string') swap('probes/base-tests.js', () => ({ probeBaseTests: () => ({ ran: false, runners: [], newlyBroken: [], killedByProduct: [], forgery: [], toolErrors: [cfg.toolError], insufficient: [] }) }));
  const { judge, EXIT } = require('../judge');
  const report = require('../report');

  if (cfg.abort) {
    const file = path.join(cfg.out, 'verdict.json');
    const timer = setInterval(() => {
      let headline = ''; try { headline = String(JSON.parse(fs.readFileSync(file, 'utf8')).headline || ''); } catch (_) { return; } // 쓰는 도중에 읽었으면 다음에 다시 본다
      if (!headline.includes(cfg.abort.phase)) return;
      clearInterval(timer);
      setTimeout(() => {
        if (cfg.abort.how === 'exit') process.exit(7);
        else process.emit(cfg.abort.how); // 중단 신호가 온 것과 같은 길(등록된 신호 처리기)을 탄다. Windows 에서는 다른 프로세스가 보낸 신호가 처리기로 오지 않으므로 이렇게 흉내 낸다.
      }, cfg.abort.afterMs || 0);
    }, 150);
  }

  judge({ repo: cfg.repo, head: cfg.head, base: cfg.base || null, out: cfg.out, quick: !!cfg.quick, json: false }).then(v => {
    const slim = {
      verdict: v.verdict, exit: EXIT[v.verdict], headline: v.headline, todo: v.todo, verdictId: v.verdictId, where: v.where, interim: !!v.interim,
      findings: v.findings.map(f => ({ severity: f.severity, title: f.title, text: f.text })),
      claims: v.claims.map(c => ({ id: c.id, outcome: c.outcome, timeShort: !!c.timeShort, notes: c.notes })),
      reqs: v.rollup ? v.rollup.reqs.map(r => ({ id: r.id, bucket: r.bucket, note: r.note })) : null,
      claimBudget: v.claimBudget || null, firstLines: report.firstLines(v),
    };
    process.stdout.write('\n' + JSON.stringify(slim) + '\n', () => process.exit(0));
  }).catch(e => { console.error('법정 실행 실패: ' + ((e && e.stack) || e)); process.exit(9); });
}

if (cfg.chromeOnly) chromeOnly(cfg.chromeOnly).catch(e => { console.error('브라우저 시험 실패: ' + ((e && e.stack) || e)); process.exit(9); });
else runCourt();
