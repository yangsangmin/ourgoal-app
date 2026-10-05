'use strict';
// #TASK-ES-509: 감사 하네스(docs/design/harness/tab-states.js clickReal·VISIBLE_FN)가 접힌 <details> 안 요소를
// 「보이는데 가려짐」으로 잘못 적던 오탐(같은 오탐 5회: #767 R4 · 3차 3건 · 4차 2건) 회귀 시험.
// 진짜 크롬(court/lib/chrome.js 의 실행기 — 읽기만 함)으로 고정 픽스처 페이지를 띄워 잰다.
//   1) 접힌 details 안 단추 → 보이지 않음, 누르지 않음(오탐 0)
//   2) 진짜로 다른 요소에 덮인 단추 → 여전히 「가려짐」으로 잡힘
//   3) 열린 details 안 단추·평범한 단추 → 보임, 가려지지 않음
// HARNESS_DIR 환경 변수로 다른 하네스(예: 기준 커밋 사본)를 잴 수 있다.
const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const HARNESS_DIR = process.env.HARNESS_DIR || path.join(ROOT, 'docs', 'design', 'harness');
const { clickReal, VISIBLE_FN: VISIBLE_FN_EXPORT } = require(path.join(HARNESS_DIR, 'tab-states.js'));
const { launch, sleep } = require(path.join(ROOT, 'court', 'lib', 'chrome.js'));
const server = require(path.join(ROOT, 'court', 'lib', 'static-server.js'));

// 기준 하네스는 VISIBLE_FN 을 내보내지 않았다 — 같은 파일 글자에서 꺼낸다(없으면 내보낸 것)
function loadVisibleFn() {
  if (typeof VISIBLE_FN_EXPORT === 'function') return VISIBLE_FN_EXPORT;
  const src = fs.readFileSync(path.join(HARNESS_DIR, 'tab-states.js'), 'utf8');
  const m = src.match(/const VISIBLE_FN = (\(sel\) => \{[\s\S]*?\n\};)/);
  assert.ok(m, 'tab-states.js 에서 VISIBLE_FN 을 찾는다');
  return eval(m[1].replace(/;$/, ''));
}
const VISIBLE_FN = loadVisibleFn();

const FIXTURE = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<style>body{margin:0;font:16px sans-serif} button{display:block;width:200px;height:44px;margin:12px}</style></head><body>
<button id="plainBtn">평범</button>
<details id="closedBox"><summary id="closedSum">접힌 묶음</summary><button id="inClosed">접힌 안 단추</button></details>
<details id="openBox" open><summary>열린 묶음</summary><button id="inOpen">열린 안 단추</button></details>
<button id="coveredBtn">덮인 단추</button>
<div id="cover" style="position:absolute;left:0;width:400px;height:60px;background:rgba(0,0,0,.2)"></div>
<script>var c=document.getElementById('cover'),b=document.getElementById('coveredBtn').getBoundingClientRect();c.style.top=(b.top+scrollY-8)+'px';</script>
</body></html>`;

// puppeteer 의 page 꼴(evaluate(fn,arg) · mouse.click)을 크롬 개발자 프로토콜 위에 얇게 맞춘다
function adapt(p) {
  return {
    evaluate: async (fn, arg) => {
      const r = await p.send('Runtime.evaluate', { expression: '(' + fn.toString() + ')(' + JSON.stringify(arg) + ')', returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 300));
      return r.result.value;
    },
    mouse: { click: async (x, y) => {
      await p.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
      await p.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    } },
  };
}

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-details-'));
  fs.writeFileSync(path.join(dir, 'index.html'), FIXTURE, 'utf8');
  const srv = await server.start(dir, []);
  const b = await launch({ viewport: { width: 500, height: 800 }, allowHosts: [], siteOrigin: srv.url });
  try {
    await b.page.send('Page.navigate', { url: srv.url + '/index.html' });
    await sleep(800);
    const page = adapt(b.page);
    // 1) 접힌 details 안: 오탐 0
    assert.strictEqual(await page.evaluate(VISIBLE_FN, '#inClosed'), false, '접힌 details 안 단추는 보이지 않음');
    const c1 = await clickReal(page, '#inClosed');
    assert.strictEqual(c1.clicked, false, '접힌 details 안 단추는 누르지 않는다: ' + c1.note);
    assert.ok(!c1.covered, '접힌 details 안 단추를 「가려짐」으로 적지 않는다: ' + c1.note);
    // 자기 summary 는 보이고 누를 수 있다
    assert.strictEqual(await page.evaluate(VISIBLE_FN, '#closedSum'), true, '접힌 details 의 summary 는 보임');
    // 2) 진짜 가려진 단추: 여전히 잡힘
    const c2 = await clickReal(page, '#coveredBtn');
    assert.strictEqual(c2.covered, true, '진짜 덮인 단추는 가려짐으로 잡는다: ' + c2.note);
    assert.ok(/#cover/.test(c2.note), '가린 요소(#cover)를 적는다: ' + c2.note);
    // 3) 열린 details 안·평범한 단추
    assert.strictEqual(await page.evaluate(VISIBLE_FN, '#inOpen'), true, '열린 details 안 단추는 보임');
    const c3 = await clickReal(page, '#plainBtn');
    assert.strictEqual(c3.clicked, true); assert.strictEqual(c3.covered, false, '평범한 단추는 가려지지 않음: ' + c3.note);
    console.log('harness-closed-details: OK');
  } finally {
    await b.close(); await srv.close();
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
