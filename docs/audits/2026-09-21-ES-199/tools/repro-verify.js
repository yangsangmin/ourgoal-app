'use strict';
// 재현 도구 점검기: README 에 적은 "고장 A 클릭 순서"가 재현 도구가 띄운 두 판에서 실제로 그렇게 되는지 잰다.
// 왜 있는가: 사람에게 "이렇게 누르면 이렇게 됩니다"라고 적으려면, 그 순서를 진짜 마우스 입력으로 먼저 넣어 봐야 한다.
// 방법: repro-es199.js 를 띄우고, 법정의 시나리오 러너(court/lib/scenario.js — 진짜 마우스 입력, 임의 JS 없음)로 같은 순서를 넣는다.
//       휴대폰 크기(375x812)와 PC 크기(1280x800) 두 화면에서 각각 잰다.
// 한계: 러너는 바깥 통신을 막고 잰다. 인터넷이 연결된 상민님 크롬에서 사람이 눌러 본 것은 이 점검에 들어 있지 않다.
// 쓰는 법: node docs/audits/2026-09-21-ES-199/tools/repro-verify.js   (약 1분. 결과는 evidence/repro-verify.out.json)
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const AUDIT_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(AUDIT_DIR, '..', '..', '..');
const { runScenario } = require(path.join(REPO_ROOT, 'court', 'lib', 'scenario.js'));
const OUT = path.join(AUDIT_DIR, 'evidence', 'repro-verify.out.json');

// README "고장 A"의 클릭 순서 그대로. 127.0.0.1 로 열면 앱이 샘플 게스트 프로필로 곧장 홈에 들어가므로(index.html 의 isPreviewEnv) 첫 화면이 홈이다.
const SCENARIO = {
  id: 'human-repro-a',
  title: '홈에서 새 목표 창을 열고 어두운 배경을 눌러 닫으면 종료 안내가 뜨지 않는다',
  steps: [
    { do: 'goto', path: '/index.html' },
    { do: 'waitFor', selector: '#homeAddGoal' },
    { do: 'click', selector: '#homeAddGoal' },
    { expect: 'visible', selector: '#modalOverlay.active' },
    { do: 'click', selector: '#modalOverlay', position: 'top' },
    { expect: 'notVisible', selector: '#modalOverlay.active' },
    { expect: 'neverVisible', selector: '#toast.show', text: '종료', forMs: 1500 },
    { expect: 'hasClass', selector: '.navbtn[data-tab="home"]', className: 'active' },
  ],
};
const SITES = [['① 고치기 전(15df641)', 8198], ['② ES-199 작업 후(1c61f5f)', 8199]];
const sleep = ms => new Promise(r => setTimeout(r, ms));

let child = null;
process.on('exit', () => { try { if (child) child.kill(); } catch (_) { /* 이미 끝났을 수 있다 */ } });

(async () => {
  child = spawn(process.execPath, [path.join(__dirname, 'repro-es199.js'), '--no-open'], { stdio: ['ignore', 'pipe', 'pipe'] });
  let banner = '';
  child.stdout.on('data', d => { banner += d; });
  child.stderr.on('data', d => { banner += d; });
  for (let i = 0; i < 150 && !/안내 페이지/.test(banner) && child.exitCode === null; i++) await sleep(200);
  if (!/안내 페이지/.test(banner)) { console.error('재현 도구가 뜨지 않았다: ' + banner.trim()); process.exit(2); }

  const results = [];
  for (const vp of [{ width: 375, height: 812 }, { width: 1280, height: 800 }]) {
    for (const [name, port] of SITES) {
      const r = await runScenario({ scenario: { ...SCENARIO, viewport: vp }, siteUrl: 'http://127.0.0.1:' + port, siteRev: name, outDir: null });
      if (r.invalid) { console.error('시나리오가 법정 규칙에 맞지 않는다: ' + JSON.stringify(r.errors)); process.exit(2); }
      const failed = r.failedStep ? r.steps[r.failedStep - 1] : null;
      results.push({
        판: name, 화면: vp.width + 'x' + vp.height, 종료안내없이닫힘: r.passed, 실패단계: r.failedStep, 실패종류: r.failKind,
        관찰: failed ? (failed.detail || failed.error || null) : null,
        앱을띄울때난오류: r.bootExceptions.map(e => e.text + ' @ ' + e.url + ':' + e.line), 도구오류: r.toolError, 크롬: r.chromeVersion,
      });
    }
  }
  // 기대: ①은 두 화면 모두 안내 없이 닫힘, ②는 두 화면 모두 "종료" 안내가 뜸 + reactions.js 오류.
  const ok = results.every(x => !x.도구오류 && (x.판.startsWith('①') ? x.종료안내없이닫힘 && x.앱을띄울때난오류.length === 0 : !x.종료안내없이닫힘 && x.실패종류 === 'expect' && x.앱을띄울때난오류.some(t => /init is not defined/.test(t))));
  const doc = { 잰시각: new Date().toISOString(), 넣은순서: SCENARIO.steps, 결과: results, README의설명과일치: ok };
  fs.writeFileSync(OUT, JSON.stringify(doc, null, 2) + '\n', 'utf8');
  for (const x of results) console.log(x.판 + ' · ' + x.화면 + ' → ' + (x.종료안내없이닫힘 ? '안내 없이 닫힘' : '안내 뜸: ' + x.관찰) + ' · 띄울 때 오류 ' + x.앱을띄울때난오류.length + '건' + (x.앱을띄울때난오류.length ? ' (' + x.앱을띄울때난오류.join(' / ') + ')' : ''));
  console.log('README 의 설명과 일치: ' + (ok ? '예' : '아니오'));
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('도구 오류: ' + (e && e.message ? e.message : e)); process.exit(2); });
