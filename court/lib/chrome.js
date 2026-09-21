'use strict';
// 법정(court) — headless Chrome 기동 + CDP(Chrome DevTools Protocol) 클라이언트. 의존성 없음(Node 22+ 전역 WebSocket).
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const CDP_TIMEOUT_MS = 30000; // CDP 호출 하나가 기다리는 상한. 페이지가 무한 루프에 빠지면 답이 영영 안 온다 — 법정이 같이 멈추면 판정서를 못 남긴다.

// 이 프로세스가 띄운 Chrome 들. 정상 경로에서는 close() 가 하나씩 지운다.
// 법정이 도중에 끝날 때(예외·중단 신호)에도 브라우저와 프로필 폴더가 남지 않게, 끝날 때 남은 것을 한꺼번에 치운다(killAllSync).
const LIVE = new Set(); // { proc, userDataDir }
let exitHooked = false;

function sleepSync(ms) { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch (_) { /* 기다리지 못해도 정리는 계속한다 */ } }

function killTreeSync(proc) {
  if (!proc || proc.exitCode !== null || proc.signalCode !== null) return;
  // Windows 에서는 자식(렌더러·GPU) 프로세스가 프로필 폴더를 잡고 있어 폴더가 안 지워진다 — 프로세스 나무째 끝낸다.
  if (process.platform === 'win32' && proc.pid) { try { spawnSync('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { stdio: 'ignore', timeout: 5000, windowsHide: true }); } catch (_) { /* 아래 kill 로 넘어간다 */ } }
  try { proc.kill('SIGKILL'); } catch (_) { /* 이미 종료 */ }
}

// 동기 정리: process 의 'exit' 안에서도 부를 수 있다. 몇 개를 치웠는지 돌려준다. 여러 번 불러도 된다.
function killAllSync() {
  let n = 0;
  for (const b of [...LIVE]) {
    LIVE.delete(b); n++;
    killTreeSync(b.proc);
    for (let i = 0; i < 5; i++) { try { fs.rmSync(b.userDataDir, { recursive: true, force: true }); break; } catch (_) { sleepSync(200); } }
  }
  return n;
}

function liveCount() { return LIVE.size; }

function findChrome() {
  const candidates = [];
  if (process.env.CHROME_PATH) candidates.push(process.env.CHROME_PATH);
  if (process.platform === 'win32') {
    for (const base of [process.env['PROGRAMFILES'], process.env['PROGRAMFILES(X86)'], process.env['LOCALAPPDATA']].filter(Boolean)) {
      candidates.push(path.join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'));
    }
    for (const base of [process.env['PROGRAMFILES(X86)'], process.env['PROGRAMFILES']].filter(Boolean)) {
      candidates.push(path.join(base, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
    }
  } else if (process.platform === 'darwin') {
    candidates.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
  } else {
    candidates.push('/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium-browser', '/usr/bin/chromium', '/snap/bin/chromium');
  }
  for (const c of candidates) { try { if (fs.statSync(c).isFile()) return c; } catch (_) { /* 다음 후보 */ } }
  return null;
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, res => {
      let d = ''; res.setEncoding('utf8');
      res.on('data', c => { d += c; });
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    });
    req.on('error', reject);
    req.setTimeout(3000, () => req.destroy(new Error('timeout')));
  });
}

// allowHosts: 외부 통신 허용 호스트(기본 없음). 127.0.0.1 만 열고 나머지는 전부 NOTFOUND 로 막는다 → 판정이 외부 상태에 흔들리지 않는다.
async function launch(opts) {
  const o = opts || {};
  const exe = o.chromePath || findChrome();
  if (!exe) throw new Error('Chrome 실행 파일을 찾지 못했다(CHROME_PATH 로 지정 가능)');
  if (typeof WebSocket === 'undefined') throw new Error('전역 WebSocket 이 없다(Node 22 이상 필요). 현재 ' + process.version);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'court-chrome-'));
  const allow = ['127.0.0.1'].concat(o.allowHosts || []);
  // siteOrigin(법정이 실행마다 새로 고른 호스트 이름 + 포트 — lib/site-host.js): 앱을 127.0.0.1·localhost 로 열면 개발용 지름길(자동 샘플 프로필)로 빠져 실사용자 경로를 못 본다.
  // 법정 전용 호스트 이름을 127.0.0.1 로 매핑해서 열고, 그 주소를 보안 컨텍스트로 취급하게 한다(서비스워커·저장소 API 가 실서비스처럼 동작).
  let siteHost = null;
  try { if (o.siteOrigin) siteHost = new URL(o.siteOrigin).hostname; } catch (_) { siteHost = null; }
  const mapSite = siteHost && siteHost !== '127.0.0.1' ? 'MAP ' + siteHost + ' 127.0.0.1 , ' : '';
  const rules = mapSite + 'MAP * ~NOTFOUND' + allow.map(h => ' , EXCLUDE ' + h).join('');
  const vp = o.viewport || { width: 375, height: 812 };
  const args = [
    '--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + userDataDir,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--mute-audio', '--hide-scrollbars',
    '--disable-background-networking', '--disable-component-update', '--disable-sync', '--disable-extensions', '--lang=' + (o.locale || 'ko-KR'),
    '--window-size=' + vp.width + ',' + vp.height, '--host-resolver-rules=' + rules,
  ];
  if (mapSite) args.push('--unsafely-treat-insecure-origin-as-secure=' + o.siteOrigin);
  if (process.platform === 'linux') args.push('--no-sandbox', '--disable-dev-shm-usage');
  args.push('about:blank');
  const proc = spawn(exe, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  const live = { proc, userDataDir };
  LIVE.add(live);
  if (!exitHooked) { exitHooked = true; process.on('exit', killAllSync); } // 마지막 안전망. 중단 신호(SIGINT·SIGTERM)를 exit 로 잇는 것은 법정 본체(judge.js)가 한다.
  let stderr = '';
  proc.stderr.on('data', c => { if (stderr.length < 20000) stderr += c.toString(); });
  let exited = false;
  proc.on('exit', () => { exited = true; });

  const portFile = path.join(userDataDir, 'DevToolsActivePort');
  let port = null;
  for (let i = 0; i < 150 && !exited; i++) {
    try {
      const first = fs.readFileSync(portFile, 'utf8').split('\n')[0].trim();
      if (/^\d+$/.test(first)) { port = Number(first); break; }
    } catch (_) { /* 아직 안 생김 */ }
    await sleep(100);
  }
  const close = async () => {
    try { proc.kill(); } catch (_) { /* 이미 종료 */ }
    for (let i = 0; i < 30 && !exited; i++) await sleep(100);
    if (!exited) killTreeSync(proc); // 응답 없는 페이지를 물고 있으면 보통 종료 요청에 답하지 않는다
    let removed = false;
    for (let i = 0; i < 5 && !removed; i++) {
      try { fs.rmSync(userDataDir, { recursive: true, force: true }); removed = true; } catch (_) { await sleep(300); }
    }
    if (removed) LIVE.delete(live); // 못 지웠으면 목록에 남겨 두어 끝날 때 한 번 더 치운다
  };
  if (!port) { await close(); throw new Error('Chrome 디버그 포트를 얻지 못했다: ' + stderr.slice(0, 500)); }

  let pageTarget = null;
  for (let i = 0; i < 50; i++) {
    try {
      const targets = await getJson('http://127.0.0.1:' + port + '/json');
      pageTarget = targets.find(t => t.type === 'page');
      if (pageTarget) break;
    } catch (_) { /* 재시도 */ }
    await sleep(100);
  }
  if (!pageTarget) { await close(); throw new Error('Chrome 페이지 타깃을 찾지 못했다'); }
  let version = null;
  try { version = (await getJson('http://127.0.0.1:' + port + '/json/version')).Browser || null; } catch (_) { version = null; }

  const page = await connect(pageTarget.webSocketDebuggerUrl);
  return { page, version, exe, close: async () => { try { page.close(); } catch (_) { /* 무시 */ } await close(); } };
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let seq = 1;
    const pending = new Map();
    const listeners = new Map();
    ws.addEventListener('error', e => reject(new Error('CDP 연결 실패: ' + (e && e.message ? e.message : 'unknown'))));
    ws.addEventListener('close', () => { for (const p of pending.values()) { clearTimeout(p.timer); p.reject(new Error('CDP 연결이 닫혔다')); } pending.clear(); });
    ws.addEventListener('message', evt => {
      let m; try { m = JSON.parse(typeof evt.data === 'string' ? evt.data : evt.data.toString()); } catch (_) { return; }
      if (m.id && pending.has(m.id)) {
        const p = pending.get(m.id); pending.delete(m.id); clearTimeout(p.timer);
        if (m.error) p.reject(new Error(m.error.message || JSON.stringify(m.error))); else p.resolve(m.result);
      } else if (m.method) {
        for (const fn of listeners.get(m.method) || []) { try { fn(m.params); } catch (_) { /* 리스너 오류는 판정에 영향 주지 않는다 */ } }
      }
    });
    ws.addEventListener('open', () => resolve({
      // 답이 제한 시간 안에 안 오면 거절한다(e.cdpTimeout = true). 부르는 쪽이 "페이지가 응답하지 않음"인지 도구 오류인지 가린다.
      send(method, params, timeoutMs) {
        return new Promise((res, rej) => {
          const id = seq++;
          const limit = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : CDP_TIMEOUT_MS;
          const timer = setTimeout(() => {
            if (!pending.has(id)) return;
            pending.delete(id);
            const e = new Error('브라우저가 ' + Math.round(limit / 1000) + '초 안에 답하지 않았다(' + method + ')'); e.cdpTimeout = true; e.method = method; rej(e);
          }, limit);
          pending.set(id, { resolve: res, reject: rej, timer });
          try { ws.send(JSON.stringify({ id, method, params: params || {} })); } catch (e) { pending.delete(id); clearTimeout(timer); rej(e); }
        });
      },
      on(method, fn) { if (!listeners.has(method)) listeners.set(method, []); listeners.get(method).push(fn); },
      close() { try { ws.close(); } catch (_) { /* 무시 */ } },
    }));
  });
}

module.exports = { findChrome, launch, connect, sleep, killAll: killAllSync, killAllSync, liveCount, CDP_TIMEOUT_MS };
